import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { builderOnly } from '../middleware/role.middleware.js';
import { uploadKycDocument } from '../middleware/upload.middleware.js';
import { submitBuilderKyc, getBuilderKycStatus } from '../controllers/builderKyc.controller.js';

const router = Router();

router.get('/kyc/status', authenticate, builderOnly, getBuilderKycStatus);

router.post(
  '/kyc',
  authenticate,
  builderOnly,
  uploadKycDocument,
  submitBuilderKyc
);

export default router;
