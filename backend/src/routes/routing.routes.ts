import { Router } from 'express';
import { getRoutingRules, updateRoutingRule } from '../controllers/routing.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getRoutingRules);
router.put('/', updateRoutingRule);

export const routingRoutes = router;
