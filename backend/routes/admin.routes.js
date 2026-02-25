import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import {
  listPendingInvestorKyc,
  approveInvestorKyc,
  rejectInvestorKyc,
} from '../controllers/adminKyc.controller.js';
import {
  listAdminProjects,
  approveProject,
  rejectProject,
} from '../controllers/adminProject.controller.js';
import {
  listInvestors,
  getInvestorStats,
  verifyInvestor,
  rejectInvestor,
  blockInvestor,
  unblockInvestor,
} from '../controllers/adminInvestor.controller.js';
import {
  listBuilders,
  getBuilderStats,
  verifyBuilder,
  rejectBuilder,
} from '../controllers/adminBuilder.controller.js';

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

// Project approval workflow
router.get('/projects', listAdminProjects);
router.post('/projects/:id/approve', approveProject);
router.post('/projects/:id/reject', rejectProject);

// Investor management workflow
router.get('/investors', listInvestors);
router.get('/investors/stats', getInvestorStats);
router.get('/investor', listInvestors);
router.get('/investor/stats', getInvestorStats);
router.post('/investors/:id/verify', verifyInvestor);
router.post('/investors/:id/reject', rejectInvestor);
router.post('/investors/:id/block', blockInvestor);
router.post('/investors/:id/unblock', unblockInvestor);
router.post('/investor/:id/verify', verifyInvestor);
router.post('/investor/:id/reject', rejectInvestor);
router.post('/investor/:id/block', blockInvestor);
router.post('/investor/:id/unblock', unblockInvestor);

// Builder management workflow
router.get('/builders', listBuilders);
router.get('/builders/stats', getBuilderStats);
router.get('/builder', listBuilders);
router.get('/builder/stats', getBuilderStats);
router.post('/builders/:id/verify', verifyBuilder);
router.post('/builders/:id/reject', rejectBuilder);
router.post('/builder/:id/verify', verifyBuilder);
router.post('/builder/:id/reject', rejectBuilder);

export default router;
