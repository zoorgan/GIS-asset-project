import { Router } from 'express';
import authRoutes from './auth.routes';
import assetRoutes from './asset.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);

export default router;
