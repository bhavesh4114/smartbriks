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
  getAdminProjectDetails,
  approveProject,
  rejectProject,
} from '../controllers/adminProject.controller.js';
import {
  listInvestors,
  getInvestorDetails,
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
import { listInvestments } from '../controllers/adminInvestment.controller.js';
import {
  listPayouts,
  approvePayoutRequest,
  denyPayoutRequest,
} from '../controllers/adminPayout.controller.js';
import { listDocuments } from '../controllers/adminDocument.controller.js';
import { getAdminDashboard } from '../controllers/adminDashboard.controller.js';
import {
  listAdminNotifications,
  markNotificationsRead,
  sendAdminNotification,
} from '../controllers/notification.controller.js';

const router = Router();

// All /api/admin/* routes require valid JWT and role === ADMIN
router.use(authenticate, adminOnly);

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Admin API. Add routes here.' });
});

router.get('/dashboard', getAdminDashboard);
router.get('/notifications', listAdminNotifications);
router.post('/notifications/read', markNotificationsRead);
router.post('/notifications/send', sendAdminNotification);

// Investor KYC management
router.get('/kyc/pending', listPendingInvestorKyc);
router.patch('/kyc/:id/approve', approveInvestorKyc);
router.patch('/kyc/:id/reject', rejectInvestorKyc);

// Project approval workflow
router.get('/projects', listAdminProjects);
router.get('/projects/:id', getAdminProjectDetails);
router.post('/projects/:id/approve', approveProject);
router.post('/projects/:id/reject', rejectProject);

// Investor management workflow
router.get('/investors', listInvestors);
router.get('/investors/stats', getInvestorStats);
router.get('/investors/:id', getInvestorDetails);
router.get('/investor', listInvestors);
router.get('/investor/stats', getInvestorStats);
router.get('/investor/:id', getInvestorDetails);
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

// Investment records
router.get('/investments', listInvestments);

// Payout records
router.get('/payouts', listPayouts);
router.post('/payouts/:projectId/approve', approvePayoutRequest);
router.post('/payouts/:projectId/deny', denyPayoutRequest);

// Document verification
router.get('/documents', listDocuments);

export default router;
