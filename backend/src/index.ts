import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import planRoutes from './routes/planRoutes';
import paymentRoutes from './routes/paymentRoutes';
import blogRoutes from './routes/blogRoutes';
import eventRoutes from './routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import organizationRoutes from './routes/organizationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import helpRoutes from './routes/helpRoutes';
import faydaRoutes from './routes/faydaRoutes';
import customAttributeRoutes from './routes/customAttributeRoutes';
import chapaRoutes from './routes/chapaRoutes';

const prisma = new PrismaClient();

async function ensureSeedUsers() {
  try {
    const superEmail = process.env.SEED_SUPERADMIN_EMAIL?.trim();
    const superPassword = process.env.SEED_SUPERADMIN_PASSWORD?.trim();
    if (superEmail && superPassword) {
      const hash = await bcrypt.hash(superPassword, 10);
      const existing = await prisma.user.findUnique({ where: { email: superEmail } });
      if (existing) {
        await prisma.user.update({ where: { email: superEmail }, data: { password: hash, role: 'SuperAdmin', is_verified: true } });
      } else {
        await prisma.user.create({ data: { name: 'Platform Owner', email: superEmail, password: hash, role: 'SuperAdmin', is_verified: true } });
      }
      console.log('SuperAdmin ready:', superEmail);
    }

    const demoEmail = process.env.SEED_DEMO_ORG_ADMIN_EMAIL?.trim();
    const demoPassword = process.env.SEED_DEMO_ORG_ADMIN_PASSWORD?.trim();
    if (demoEmail && demoPassword) {
      const hash = await bcrypt.hash(demoPassword, 10);
      const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
      if (!existing) {
        const org = await prisma.organization.create({
          data: { name: 'Demo Organization', type: 'nonprofit' },
        });
        await prisma.user.create({
          data: {
            name: 'Demo Admin',
            email: demoEmail,
            password: hash,
            role: 'orgAdmin',
            is_verified: true,
            organizationId: org.id,
            organization_name: org.name,
            organization_type: org.type,
          },
        });
      }
    }
  } catch (err) {
    console.error('Seed error (non-fatal):', err);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

import path from 'path';

// Resolve project root for dev (ts-node) and prod (compiled) modes
const isDist = __dirname.includes('dist');
const projectRoot = path.resolve(__dirname, isDist ? '../../..' : '../..');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(projectRoot, 'backend/uploads')));

// Serve built frontend
const frontendDist = path.join(projectRoot, 'frontend/dist');
app.use(express.static(frontendDist));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fayda', faydaRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/custom-attributes', customAttributeRoutes);
app.use('/api/chapa', chapaRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Catch-all for client-side routing (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

ensureSeedUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
