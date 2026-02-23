import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { builderOnly } from '../middleware/role.middleware.js';
import {
  getMe,
  getMyProjects,
  getProjectInvestments,
} from '../controllers/builder.controller.js';

const router = Router();

router.use(authenticate, builderOnly);

router.get('/me', getMe);
router.get('/projects', getMyProjects);
router.get('/projects/:projectId/investments', getProjectInvestments);

export default router;
