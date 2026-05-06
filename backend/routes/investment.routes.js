import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { investorOnly } from '../middleware/role.middleware.js';
import {
  invest,
  getPortfolio,
  getMyReturns,
} from '../controllers/investment.controller.js';

const router = Router();

router.use(authenticate, investorOnly);

router.post('/', invest);
router.get('/portfolio', getPortfolio);
router.get('/returns', getMyReturns);

export default router;
