import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getMembers = async (req: any, res: Response) => {
  try {
    const orgName = req.user.role === 'SuperAdmin' ? undefined : (await prisma.user.findUnique({ where: { id: req.user.userId } }))?.organization_name;
    
    const whereClause: any = { role: 'member' };
    if (orgName) {
      whereClause.organization_name = orgName;
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      include: { 
        plan: true,
        customAttributeValues: {
          include: { attribute: true }
        }
      }
    });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error });
  }
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const createMember = async (req: any, res: Response) => {
  try {
    const { name, email, phone, address, sex, join_date } = req.body;
    const admin = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      include: { plan: true }
    });

    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Check plan limits
    const currentMembers = await prisma.user.count({
      where: { organization_name: admin.organization_name, role: 'member' }
    });

    if (admin.plan && currentMembers >= admin.plan.max_members) {
      return res.status(400).json({ message: 'Member limit reached for your plan' });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const member = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        sex,
        join_date: join_date ? new Date(join_date) : new Date(),
        role: 'member',
        organizationId: admin.organizationId,
        organization_name: admin.organization_name,
        organization_type: admin.organization_type,
        is_verified: true,
      },
    });

    const { password: _, ...memberWithoutPassword } = member;
    res.status(201).json({
      ...memberWithoutPassword,
      tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating member', error });
  }
};

export const updateMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, sex, join_date, status } = req.body;
    
    // In a real app we'd verify the admin owns this member
    const member = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        email,
        phone,
        address,
        sex,
        join_date: join_date ? new Date(join_date) : undefined,
      },
    });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error updating member', error });
  }
};

export const deleteMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting member', error });
  }
};
