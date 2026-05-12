import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET } from '../config/jwtConfig';

const prisma = new PrismaClient();

/**
 * Mock Verification: In a real scenario, this would call the Fayda National ID API.
 * Here we simulate it by returning mock data for any ID sent.
 */
export const verifyFayda = async (req: Request, res: Response) => {
  try {
    const { faydaId } = req.body;

    if (!faydaId) {
      return res.status(400).json({ message: 'Fayda ID is required' });
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 1. Check if user already linked this Fayda ID in our DB
    const existingUser = await prisma.user.findFirst({
      where: { fayda_id: faydaId }
    });

    // 2. Mock response data from Fayda System
    // Since we do not have the real Government API Keys, we mock the response.
    // If we recognize the ID in our DB, we return the real name.
    // For testing purposes, we hardcode Nasir's ID.
    let fullName = 'Ethiopian Citizen';
    let mockEmail = `citizen.${faydaId}@fayda.gov.et`;
    
    if (existingUser) {
        fullName = existingUser.name;
        mockEmail = existingUser.email;
    } else if (faydaId === '643078154180') {
        fullName = 'Nasir Amme Siraj';
        mockEmail = 'nasiramme1511@gmail.com';
    }

    const mockData = {
      faydaId,
      fullName: fullName,
      email: mockEmail,
      phoneNumber: existingUser?.phone || '+251911223344',
      dateOfBirth: '1990-01-01',
      address: 'Addis Ababa, Ethiopia',
      gender: 'Male',
      verified: true
    };

    res.status(200).json(mockData);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying Fayda ID', error });
  }
};

/**
 * Login or Sign Up with Fayda ID
 */
export const faydaLogin = async (req: Request, res: Response) => {
  try {
    const { faydaId, email, fullName, phoneNumber } = req.body;

    if (!faydaId || !email) {
      return res.status(400).json({ message: 'Missing required Fayda information' });
    }

    // 1. Check if user exists with this Fayda ID
    let user = await prisma.user.findFirst({
      where: { fayda_id: faydaId }
    });

    if (!user) {
      // 2. Check if user exists with this email but no Fayda ID linked
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Link existing user to Fayda ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            fayda_id: faydaId,
            is_fayda_verified: true,
            phone: user.phone || phoneNumber
          }
        });
      } else {
        // 3. Create new user (Automatic Account Creation)
        // Ensure a "Fayda Verified" organization exists or just create one
        let defaultOrg = await prisma.organization.findFirst({
          where: { name: 'Fayda Verified Users' }
        });

        if (!defaultOrg) {
          defaultOrg = await prisma.organization.create({
            data: {
              name: 'Fayda Verified Users',
              type: 'Public'
            }
          });
        }

        user = await prisma.user.create({
          data: {
            name: fullName || 'Fayda User',
            email,
            password: `FAYDA_${Math.random().toString(36).slice(-10)}`, // Virtual password
            role: 'member', // Default to member role
            fayda_id: faydaId,
            is_fayda_verified: true,
            organizationId: defaultOrg.id,
            organization_name: defaultOrg.name,
            organization_type: defaultOrg.type,
            phone: phoneNumber
          }
        });
      }
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFaydaVerified: user.is_fayda_verified
      }
    });
  } catch (error) {
    console.error('Fayda Login Error:', error);
    res.status(500).json({ message: 'Error during Fayda login/signup', error });
  }
};
