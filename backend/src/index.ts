import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

import path from 'path';

// Serve uploaded receipts statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve built frontend
const frontendDist = path.join(__dirname, '../../frontend/dist');
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
