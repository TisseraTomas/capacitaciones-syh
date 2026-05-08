import { Router } from 'express';
import adminRoutes from './admin.js';
import workerRoutes from './worker.js';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/c', workerRoutes);

export default router;
