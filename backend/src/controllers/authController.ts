import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { sendOtpEmail, sendResetPasswordEmail } from '../services/emailService';
import { JWT_SECRET } from '../config/jwtConfig';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration Attempt:', req.body.email, req.body.role);
    const {
      name,
      email,
      password,
      role: roleRaw,
      organization_name,
      organization_type,
      organization_id,
    } = req.body;

    const role =
      roleRaw === 'member'
        ? 'member'
        : roleRaw === 'orgAdmin' || roleRaw === 'organAdmin'
          ? 'orgAdmin'
          : null;
          
    if (!role || roleRaw === 'SuperAdmin') {
      console.warn('Registration Blocked: Invalid role', roleRaw);
      return res.status(400).json({ message: 'Invalid role. Register as Organization Admin or Member only.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn('Registration Blocked: User already exists', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'member' && (!organization_id || !organization_id.trim())) {
      console.warn('Registration Blocked: Member missing organization_id');
      return res.status(400).json({ message: 'Please select an organization to join.' });
    }

    if (role === 'orgAdmin' && (!organization_name?.trim() || !organization_type?.trim())) {
      console.warn('Registration Blocked: OrgAdmin missing name/type');
      return res.status(400).json({ message: 'Organization name and type are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Store in PendingUser instead of User
    await prisma.pendingUser.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role,
        organization_name: organization_name?.trim() || null,
        organization_type: organization_type?.trim() || null,
        organization_id: organization_id || null,
        otp_code: hashedOtp,
        expiresAt,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role,
        organization_name: organization_name?.trim() || null,
        organization_type: organization_type?.trim() || null,
        organization_id: organization_id || null,
        otp_code: hashedOtp,
        expiresAt,
      },
    });

    // Send OTP via Email
    try {
      await sendOtpEmail(email, otpCode, name);
    } catch (emailError: any) {
      console.error('Email Sending Failed during registration:', emailError);
      // In this flow, we still have the pending user saved, so they can try to resend or log in to verify
      return res.status(500).json({ 
        message: 'Registration data saved, but failed to send verification email. Please try to resend the code.', 
        error: emailError.message,
        email,
        requiresOtp: true 
      });
    }

    res.status(201).json({
      message: 'Registration initiated. Please verify your email with the OTP sent.',
      email,
      requiresOtp: true
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp_code } = req.body;
    console.log('OTP Verification Attempt:', email, otp_code);

    if (!email || !otp_code) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    // Look for the user in PendingUser instead of User
    const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
    
    if (!pendingUser) {
      // Check if user is already verified and in User table
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        console.warn('OTP Verification Blocked: Already verified', email);
        return res.status(400).json({ message: 'Email is already verified. Please log in.' });
      }
      console.warn('OTP Verification Blocked: Pending user not found', email);
      return res.status(404).json({ message: 'Registration not found or expired. Please register again.' });
    }

    if (new Date() > pendingUser.expiresAt) {
      console.warn('OTP Verification Blocked: OTP expired', email);
      await prisma.pendingUser.delete({ where: { id: pendingUser.id } });
      return res.status(400).json({ message: 'OTP has expired. Please register again.' });
    }

    const isValid = await bcrypt.compare(otp_code, pendingUser.otp_code);
    if (!isValid) {
      console.warn('OTP Verification Blocked: Invalid code', email);
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    let user;

    // Create User and Organization now that OTP is verified
    if (pendingUser.role === 'orgAdmin') {
      const org = await prisma.organization.create({
        data: {
          name: pendingUser.organization_name!,
          type: pendingUser.organization_type!,
        },
      });
      user = await prisma.user.create({
        data: {
          name: pendingUser.name,
          email: pendingUser.email,
          password: pendingUser.password,
          role: 'orgAdmin',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
          is_verified: true,
        },
      });
    } else {
      const org = await prisma.organization.findUnique({ where: { id: pendingUser.organization_id! } });
      if (!org) {
        console.error('OTP Verification Error: Target organization missing', pendingUser.organization_id);
        return res.status(400).json({ message: 'Target organization no longer exists. Please register again.' });
      }
      user = await prisma.user.create({
        data: {
          name: pendingUser.name,
          email: pendingUser.email,
          password: pendingUser.password,
          role: 'member',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
          is_verified: true,
        },
      });
    }

    // Delete the pending user record
    await prisma.pendingUser.delete({ where: { id: pendingUser.id } });

    // Log the user in
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    console.log('OTP Verification Successful:', email);
    res.status(200).json({
      message: 'Email verified and account created successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error: any) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
    if (!pendingUser) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ message: 'User is already verified' });
      return res.status(404).json({ message: 'Registration not found. Please register again.' });
    }

    // Generate new OTP
    const otpCode = generateOtp();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    await prisma.pendingUser.update({
      where: { id: pendingUser.id },
      data: {
        otp_code: hashedOtp,
        expiresAt,
      }
    });

    await sendOtpEmail(pendingUser.email, otpCode, pendingUser.name);

    res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error: any) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Check if it's a pending registration
      const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
      if (pendingUser) {
        return res.status(403).json({ 
          message: 'Your registration is pending verification. Please verify your email with the OTP sent.', 
          requiresOtp: true, 
          email: pendingUser.email 
        });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Since in the new flow, User is only created after verification,
    // this check might be redundant but keeping it for safety/consistency.
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.', requiresOtp: true, email: user.email });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { plan: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    console.log('Update Profile Request Body:', req.body);
    console.log('Update Profile File:', req.file);

    const { name, email, phone, address, organization_name, organization_type, sex, join_date, remove_photo } = req.body;
    
    // Get current user to check for existing photo
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { profile_photo_path: true }
    });

    let profile_photo_path = currentUser?.profile_photo_path;

    // Handle photo removal
    if (remove_photo === 'true' || remove_photo === true) {
      if (profile_photo_path) {
        const fullPath = path.resolve(profile_photo_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      profile_photo_path = null;
    } 
    // Handle new photo upload
    else if (req.file) {
      // Delete old photo if it exists
      if (profile_photo_path) {
        const fullPath = path.resolve(profile_photo_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      profile_photo_path = req.file.path;
    }

    const updateData: any = {
      name,
      email,
      phone,
      address,
      organization_name,
      organization_type,
      sex,
      profile_photo_path: profile_photo_path,
    };

    if (join_date && join_date.trim() !== '') {
      const parsedDate = new Date(join_date);
      if (!isNaN(parsedDate.getTime())) {
        updateData.join_date = parsedDate;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    
    // Handle unique constraint errors (e.g. email already exists)
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }
    
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = Math.random().toString(36).substr(2, 10);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expiresAt },
      create: { email, token, expiresAt },
    });

    await sendResetPasswordEmail(user.email, token, user.name);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Error in forgot password', error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, password } = req.body;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { email },
    });

    if (!resetToken || resetToken.token !== token || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { email } });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Error in reset password', error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    console.log('Google Login: clientId present:', !!process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid google token payload' });

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return res.status(404).json({ message: 'User not registered. Please sign up first.' });
    }

    const jwtToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error('Google Login Error:', error.message);
    res.status(500).json({ message: 'Error verifying Google authentication', error: error.message });
  }
};

export const googleRegister = async (req: Request, res: Response) => {
  try {
    const {
      token,
      role: roleRaw,
      organization_name,
      organization_type,
      organization_id,
    } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid google token payload' });

    const email = payload.email;
    const name = payload.name || 'Google User';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const role =
      roleRaw === 'member' ? 'member' : roleRaw === 'orgAdmin' || roleRaw === 'organAdmin' ? 'orgAdmin' : null;
    if (!role || roleRaw === 'SuperAdmin') {
      return res.status(400).json({ message: 'Invalid role. Register as Organization Admin or Member.' });
    }

    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    let user;

    if (role === 'orgAdmin') {
      if (!organization_name?.trim() || !organization_type?.trim()) {
        return res.status(400).json({ message: 'Organization name and type are required' });
      }
      const org = await prisma.organization.create({
        data: { name: organization_name.trim(), type: organization_type.trim() },
      });
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          google_id: payload.sub,
          role: 'orgAdmin',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
          is_verified: true,
        },
      });
    } else {
      const orgId = organization_id as string | undefined;
      if (!orgId?.trim()) {
        return res.status(400).json({ message: 'Please select an organization' });
      }
      const org = await prisma.organization.findUnique({ where: { id: orgId.trim() } });
      if (!org) {
        return res.status(400).json({ message: 'Organization not found' });
      }
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          google_id: payload.sub,
          role: 'member',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
          is_verified: true,
        },
      });
    }

    const jwtToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Google Registration Error:', error);
    res.status(500).json({ message: 'Error registering via Google', error: error.message });
  }
};