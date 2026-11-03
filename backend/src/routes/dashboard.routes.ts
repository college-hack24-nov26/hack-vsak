import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);

export const dashboardRoutes = router;
