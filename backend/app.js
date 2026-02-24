import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import builderRoutes from './routes/builder.routes.js';
import builderKycRoutes from './routes/builderKyc.routes.js';
import projectRoutes from './routes/project.routes.js';
import investmentRoutes from './routes/investment.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import returnRoutes from './routes/return.routes.js';
import kycRoutes from './routes/kyc.routes.js';
import investorKycRoutes from './routes/investorKyc.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
// Allow larger payloads for KYC (e.g. base64 selfie images)
const bodyLimit = '15mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'SmartBrik API is running.' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/builders', builderRoutes);
app.use('/api/builder', builderKycRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/investor', investorKycRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

export default app;
