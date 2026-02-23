import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { submitKyc, getMyKyc } from '../controllers/kyc.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', submitKyc);
router.get('/me', getMyKyc);

export default router;
