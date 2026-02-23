import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Create payment record (Investor or Builder)
 * POST /api/payments
 */
export async function createPayment(req, res) {
  try {
    const { projectId, amount, paymentMethod, transactionId, gatewayResponse } = req.body;
    const role = req.auth.role;
    const investorId = role === 'INVESTOR' ? (req.investor?.id ?? req.auth.id) : null;
    const builderId = role === 'BUILDER' ? req.auth.id : null;

    const projId = parseInt(projectId, 10);
    if (Number.isNaN(projId) || amount == null || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid projectId and positive amount are required.',
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projId },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: investorId || undefined,
        builderId: builderId || undefined,
        projectId: projId,
        amount: new Decimal(amount),
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        transactionId: transactionId || null,
        gatewayResponse: gatewayResponse || undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment record created.',
      data: serializePayment(payment),
    });
  } catch (err) {
    console.error('createPayment:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment.' });
  }
}

/**
 * Link payment to investment (update payment status and optionally create/update investment)
 * PATCH /api/payments/:id/link-investment
 */
export async function linkPaymentToInvestment(req, res) {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const investorId = req.investor?.id ?? req.auth.id;
    if (Number.isNaN(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID.' });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: investorId },
    });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    if (payment.paymentStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be linked.',
      });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: 'SUCCESS' },
    });

    res.json({
      success: true,
      message: 'Payment linked successfully.',
      data: serializePayment({ ...payment, paymentStatus: 'SUCCESS' }),
    });
  } catch (err) {
    console.error('linkPaymentToInvestment:', err);
    res.status(500).json({ success: false, message: 'Failed to link payment.' });
  }
}

/**
 * List payments for current investor or builder
 * GET /api/payments
 */
export async function listPayments(req, res) {
  try {
    const role = req.auth.role;
    const investorId = role === 'INVESTOR' ? (req.investor?.id ?? req.auth.id) : null;
    const builderId = role === 'BUILDER' ? req.auth.id : null;

    const where = {};
    if (investorId) where.userId = investorId;
    if (builderId) where.builderId = builderId;
    if (!investorId && !builderId) {
      return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0 } });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: payments.map((p) => ({
        ...serializePayment(p),
        project: p.project,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('listPayments:', err);
    res.status(500).json({ success: false, message: 'Failed to list payments.' });
  }
}

function serializePayment(p) {
  return {
    id: p.id,
    investorId: p.userId,
    builderId: p.builderId,
    projectId: p.projectId,
    amount: p.amount?.toString?.() ?? p.amount,
    paymentStatus: p.paymentStatus,
    paymentMethod: p.paymentMethod,
    transactionId: p.transactionId,
    createdAt: p.createdAt,
  };
}
