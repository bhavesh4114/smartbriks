import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createPayment,
  linkPaymentToInvestment,
  listPayments,
} from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createPayment);
router.get('/', listPayments);
router.patch('/:id/link-investment', linkPaymentToInvestment);

export default router;
