import { Router } from 'express';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import activityRoutes from './activityRoutes';
import matchRoutes from './matchRoutes';
import messageRoutes from './messageRoutes';
import datePlanRoutes from './datePlanRoutes';
import cronRoutes from './cronRoutes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/activities', activityRoutes);
router.use('/matches', matchRoutes);
router.use('/messages', messageRoutes);
router.use('/date-plans', datePlanRoutes);
router.use('/cron', cronRoutes);

export default router;
