import { Router } from 'express';
import {
  registerBuilder,
  registerInvestor,
  login,
  loginBuilder,
  loginInvestor,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/builder/register', registerBuilder);
router.post('/builder/login', loginBuilder);
router.post('/investor/register', registerInvestor);
router.post('/investor/login', loginInvestor);

export default router;
