import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { builderOnly } from '../middleware/role.middleware.js';
import { uploadKycDocuments, uploadProjectImages } from '../middleware/upload.middleware.js';
import { submitBuilderKyc, getBuilderKycStatus } from '../controllers/builderKyc.controller.js';
import { getBuilderDashboard, getBuilderProfile } from '../controllers/builder.controller.js';
import { createBuilderProject } from '../controllers/project.controller.js';

const router = Router();

router.get('/profile', authenticate, builderOnly, getBuilderProfile);
router.get('/dashboard', authenticate, builderOnly, getBuilderDashboard);
router.get('/kyc/status', authenticate, builderOnly, getBuilderKycStatus);
router.post('/projects', authenticate, builderOnly, uploadProjectImages, createBuilderProject);

router.post(
  '/kyc',
  authenticate,
  builderOnly,
  uploadKycDocuments,
  submitBuilderKyc
);

export default router;
