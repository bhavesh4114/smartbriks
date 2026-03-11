import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { builderOnly } from '../middleware/role.middleware.js';
import {
  distributeReturns,
  getDistributionsByProject,
  getBuilderPayouts,
} from '../controllers/return.controller.js';

const router = Router();

router.use(authenticate, builderOnly);

router.post('/distribute', distributeReturns);
router.get('/project/:projectId', getDistributionsByProject);
router.get('/payouts', getBuilderPayouts);

export default router;
