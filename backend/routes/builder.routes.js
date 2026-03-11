import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { builderOnly } from '../middleware/role.middleware.js';
import {
  getMe,
  getBuilderDashboard,
  getMyProjects,
  getProjectInvestments,
  getBuilderInvestors,
} from '../controllers/builder.controller.js';

const router = Router();

router.use(authenticate, builderOnly);

router.get('/me', getMe);
router.get('/dashboard', getBuilderDashboard);
router.get('/projects', getMyProjects);
router.get('/projects/:projectId/investments', getProjectInvestments);
router.get('/investors', getBuilderInvestors);

export default router;
