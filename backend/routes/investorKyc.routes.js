import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { investorOnly } from '../middleware/role.middleware.js';
import { submitInvestorKyc, getInvestorKycStatus } from '../controllers/investorKyc.controller.js';

const router = Router();

router.post('/kyc', authenticate, investorOnly, submitInvestorKyc);
router.get('/kyc/status', authenticate, investorOnly, getInvestorKycStatus);

export default router;
