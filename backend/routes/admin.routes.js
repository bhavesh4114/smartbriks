import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import {
  listPendingInvestorKyc,
  approveInvestorKyc,
  rejectInvestorKyc,
} from '../controllers/adminKyc.controller.js';

const router = Router();

// All /api/admin/* routes require valid JWT and role === ADMIN
router.use(authenticate, adminOnly);

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Admin API. Add routes here.' });
});

// Investor KYC management
router.get('/kyc/pending', listPendingInvestorKyc);
router.patch('/kyc/:id/approve', approveInvestorKyc);
router.patch('/kyc/:id/reject', rejectInvestorKyc);

export default router;
