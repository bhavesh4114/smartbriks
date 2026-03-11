import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { investorOnly } from '../middleware/role.middleware.js';
import { uploadInvestorKycDocuments } from '../middleware/upload.middleware.js';
import { submitInvestorKyc, getInvestorKycStatus } from '../controllers/investorKyc.controller.js';
import { getInvestorProfile } from '../controllers/investorProfile.controller.js';
import { createInvestorOrder, verifyInvestorPayment } from '../controllers/payment.controller.js';
import {
  listApprovedProjectsForInvestor,
  getApprovedProjectDetailsForInvestor,
} from '../controllers/investorProject.controller.js';

const router = Router();

router.post('/kyc', authenticate, investorOnly, uploadInvestorKycDocuments, submitInvestorKyc);
router.get('/kyc/status', authenticate, investorOnly, getInvestorKycStatus);
router.get('/profile', authenticate, investorOnly, getInvestorProfile);
router.get('/projects', authenticate, investorOnly, listApprovedProjectsForInvestor);
router.get('/projects/:projectId', authenticate, investorOnly, getApprovedProjectDetailsForInvestor);
router.post('/create-order', authenticate, investorOnly, createInvestorOrder);
router.post('/verify-payment', authenticate, investorOnly, verifyInvestorPayment);

export default router;
