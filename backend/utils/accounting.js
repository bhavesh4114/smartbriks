import { Decimal } from '@prisma/client/runtime/library';

export function toDecimal(value) {
  if (value instanceof Decimal) return value;
  return new Decimal(value ?? 0);
}

export function decimalToString(value) {
  return toDecimal(value).toString();
}

function clampZero(value) {
  return value.lessThan(0) ? new Decimal(0) : value;
}

export async function getBuilderAccounting(prisma, builderId) {
  const [fundsRaisedAgg, approvedWithdrawalsAgg] = await Promise.all([
    prisma.investment.aggregate({
      where: { project: { builderId } },
      _sum: { investedAmount: true },
    }),
    prisma.withdrawal.aggregate({
      where: {
        status: 'APPROVED',
        project: { builderId },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalFundsRaised = fundsRaisedAgg._sum.investedAmount ?? new Decimal(0);
  const totalPayoutGiven = approvedWithdrawalsAgg._sum.amount ?? new Decimal(0);
  const remainingBalance = clampZero(totalFundsRaised.minus(totalPayoutGiven));

  return {
    totalFundsRaised,
    totalPayoutGiven,
    remainingBalance,
  };
}

export async function getProjectAccounting(prisma, projectId) {
  const [fundsRaisedAgg, approvedWithdrawalsAgg] = await Promise.all([
    prisma.investment.aggregate({
      where: { projectId },
      _sum: { investedAmount: true },
    }),
    prisma.withdrawal.aggregate({
      where: {
        projectId,
        status: 'APPROVED',
      },
      _sum: { amount: true },
    }),
  ]);

  const totalFundsRaised = fundsRaisedAgg._sum.investedAmount ?? new Decimal(0);
  const totalPayoutGiven = approvedWithdrawalsAgg._sum.amount ?? new Decimal(0);
  const remainingBalance = clampZero(totalFundsRaised.minus(totalPayoutGiven));

  return {
    totalFundsRaised,
    totalPayoutGiven,
    remainingBalance,
  };
}
