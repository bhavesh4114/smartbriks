import { Decimal } from '@prisma/client/runtime/library';

export async function ensureProjectFundRelease(tx, { projectId, builderId, amount }) {
  const normalizedAmount = amount instanceof Decimal ? amount : new Decimal(amount ?? 0);

  const existing = await tx.payment.findFirst({
    where: {
      projectId,
      builderId,
      userId: null,
      paymentMethod: 'ADMIN_RELEASE',
      paymentStatus: { in: ['PENDING', 'SUCCESS'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing?.paymentStatus === 'SUCCESS') {
    return existing;
  }

  if (existing) {
    return tx.payment.update({
      where: { id: existing.id },
      data: {
        amount: normalizedAmount,
        gatewayResponse: {
          ...(existing.gatewayResponse || {}),
          release_for_project_id: projectId,
          release_to_builder_id: builderId,
          release_amount: normalizedAmount.toString(),
        },
      },
    });
  }

  return tx.payment.create({
    data: {
      builderId,
      projectId,
      amount: normalizedAmount,
      paymentStatus: 'PENDING',
      paymentMethod: 'ADMIN_RELEASE',
      transactionId: `ADMIN_RELEASE_${projectId}`,
      gatewayResponse: {
        release_for_project_id: projectId,
        release_to_builder_id: builderId,
        release_amount: normalizedAmount.toString(),
      },
    },
  });
}

export async function getBuilderReleasedFunds(prisma, builderId) {
  const released = await prisma.payment.aggregate({
    where: {
      builderId,
      userId: null,
      paymentMethod: 'ADMIN_RELEASE',
      paymentStatus: 'SUCCESS',
    },
    _sum: { amount: true },
  });

  return released._sum.amount ?? new Decimal(0);
}
