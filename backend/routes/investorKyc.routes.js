import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { investorOnly } from '../middleware/role.middleware.js';
import { uploadInvestorKycDocuments } from '../middleware/upload.middleware.js';
import { submitInvestorKyc, getInvestorKycStatus } from '../controllers/investorKyc.controller.js';
import { getInvestorDashboard } from '../controllers/investorDashboard.controller.js';
import {
  getInvestorProfile,
  getInvestorIdentity,
  updateInvestorProfile,
  updateInvestorBankDetails,
  changeInvestorPassword,
} from '../controllers/investorProfile.controller.js';
import { createInvestorOrder, verifyInvestorPayment } from '../controllers/payment.controller.js';
import {
  listApprovedProjectsForInvestor,
  getApprovedProjectDetailsForInvestor,
} from '../controllers/investorProject.controller.js';
import {
  getWallet,
  getWalletTransactions,
  addMoney,
  verifyAddMoney,
  investFromWallet,
} from '../controllers/wallet.controller.js';
import { getInvestorPayouts } from '../controllers/return.controller.js';
import { listInvestorNotifications, markNotificationsRead } from '../controllers/notification.controller.js';

const router = Router();

router.get('/dashboard', authenticate, investorOnly, getInvestorDashboard);
router.post('/kyc', authenticate, investorOnly, uploadInvestorKycDocuments, submitInvestorKyc);
router.get('/kyc/status', authenticate, investorOnly, getInvestorKycStatus);
router.get('/profile', authenticate, investorOnly, getInvestorProfile);
router.get('/profile/identity', authenticate, investorOnly, getInvestorIdentity);
router.patch('/profile', authenticate, investorOnly, updateInvestorProfile);
router.patch('/profile/bank', authenticate, investorOnly, updateInvestorBankDetails);
router.post('/change-password', authenticate, investorOnly, changeInvestorPassword);
router.get('/wallet', authenticate, investorOnly, getWallet);
router.get('/transactions', authenticate, investorOnly, getWalletTransactions);
router.post('/add-money', authenticate, investorOnly, addMoney);
router.post('/add-money/verify', authenticate, investorOnly, verifyAddMoney);
router.post('/invest', authenticate, investorOnly, investFromWallet);
router.get('/projects', authenticate, investorOnly, listApprovedProjectsForInvestor);
router.get('/projects/:projectId', authenticate, investorOnly, getApprovedProjectDetailsForInvestor);
router.get('/returns/payouts', authenticate, investorOnly, getInvestorPayouts);
router.get('/payouts', authenticate, investorOnly, getInvestorPayouts);
router.get('/returns', authenticate, investorOnly, getInvestorPayouts);
router.get('/notifications', authenticate, investorOnly, listInvestorNotifications);
router.post('/notifications/read', authenticate, investorOnly, markNotificationsRead);
router.post('/create-order', authenticate, investorOnly, createInvestorOrder);
router.post('/verify-payment', authenticate, investorOnly, verifyInvestorPayment);

export default router;
