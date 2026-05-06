import prisma from '../utils/prisma.js';

function toNumber(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value) {
  return new Date(value ?? new Date()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function maskAccountNumber(accountNumber) {
  const digits = String(accountNumber ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.slice(-4).padStart(Math.min(4, digits.length), '*');
}

function calculateInvestmentReturn(investment) {
  const invested = toNumber(investment.investedAmount?.toString?.() ?? investment.investedAmount);
  const expectedRoi = toNumber(investment.project?.expectedROI?.toString?.() ?? investment.project?.expectedROI);
  const isCompleted = investment.project?.projectStatus === 'COMPLETED';
  const profit = isCompleted ? (invested * expectedRoi) / 100 : 0;
  return {
    invested,
    profit,
    totalReturn: isCompleted ? invested + profit : 0,
    isCompleted,
    completionDate: investment.project?.updatedAt ?? null,
  };
}

function normalizeWithdrawalStatus(status) {
  if (status === 'APPROVED') return 'SUCCESS';
  if (status === 'REJECTED') return 'FAILED';
  return 'PENDING';
}

function getProjectLabel(source) {
  return source?.project?.title || (source?.metadata?.projectId ? `project #${source.metadata.projectId}` : 'project');
}

function buildWalletTransactionNotification(tx) {
  const metadata = tx.metadata && typeof tx.metadata === 'object' ? tx.metadata : {};
  const amount = formatINR(tx.amount?.toString?.() ?? tx.amount);
  const description = String(tx.description || '');
  const isWithdrawal = tx.type === 'DEBIT' && description.startsWith('Withdrawal request');
  const isInvestment = tx.type === 'DEBIT' && description.startsWith('Investment in project');
  const isRazorpayCredit = tx.type === 'CREDIT' && (metadata.provider === 'razorpay' || description.includes('Razorpay'));
  const isTopUp = tx.type === 'CREDIT' && description.toLowerCase().includes('top-up');

  if (isWithdrawal) {
    const bankLabel = metadata.bankName
      ? `${metadata.bankName}${metadata.accountLast4 ? ` account ending ${metadata.accountLast4}` : ''}`
      : 'your registered bank account';

    return {
      id: `wallet-${tx.id}`,
      title: tx.status === 'SUCCESS' ? 'Withdrawal Sent to Bank' : 'Withdrawal Request Sent',
      message:
        tx.status === 'SUCCESS'
          ? `${amount} has been transferred to ${bankLabel}.`
          : `${amount} withdrawal request has been sent for transfer to ${bankLabel}.`,
      type: tx.status === 'FAILED' ? 'warning' : 'success',
      read: false,
    };
  }

  if (isInvestment) {
    return {
      id: `wallet-${tx.id}`,
      title: 'Wallet Debited for Investment',
      message: `${amount} was debited from your wallet for ${getProjectLabel({ metadata })}.`,
      type: tx.status === 'FAILED' ? 'warning' : 'info',
      read: false,
    };
  }

  if (isRazorpayCredit || isTopUp) {
    return {
      id: `wallet-${tx.id}`,
      title: isRazorpayCredit ? 'Razorpay Payment Added to Wallet' : 'Wallet Top-up Successful',
      message: `${amount} was credited to your wallet${metadata.razorpay_payment_id ? ` via Razorpay payment ${metadata.razorpay_payment_id}` : ''}.`,
      type: tx.status === 'FAILED' ? 'warning' : 'success',
      read: false,
    };
  }

  return {
    id: `wallet-${tx.id}`,
    title: tx.type === 'CREDIT' ? 'Wallet Credited' : 'Wallet Debited',
    message: `${amount} ${tx.type === 'CREDIT' ? 'credited to' : 'debited from'} your wallet. ${description}`.trim(),
    type: tx.status === 'FAILED' ? 'warning' : tx.type === 'CREDIT' ? 'success' : 'info',
    read: true,
  };
}

function buildInvestorNotifications({ latestCompleted, returns, investments, walletTransactions = [], payments = [] }) {
  const events = [
    ...walletTransactions.map((tx) => ({
      ...buildWalletTransactionNotification(tx),
      time: formatDate(tx.createdAt),
      sortAt: new Date(tx.createdAt).getTime(),
      status: tx.status,
      amount: toNumber(tx.amount?.toString?.() ?? tx.amount),
      channel: 'Wallet',
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      title: payment.paymentStatus === 'SUCCESS' ? 'Razorpay Payment Successful' : 'Razorpay Payment Pending',
      message: `${formatINR(payment.amount?.toString?.() ?? payment.amount)} payment ${payment.paymentStatus.toLowerCase()} for ${getProjectLabel(payment)}.`,
      time: formatDate(payment.createdAt),
      sortAt: new Date(payment.createdAt).getTime(),
      type: payment.paymentStatus === 'FAILED' ? 'warning' : payment.paymentStatus === 'SUCCESS' ? 'success' : 'info',
      read: payment.paymentStatus === 'SUCCESS',
      status: payment.paymentStatus,
      amount: toNumber(payment.amount?.toString?.() ?? payment.amount),
      channel: payment.paymentMethod || 'Payment',
    })),
    ...(latestCompleted
      ? [
          {
            id: `complete-${latestCompleted.investment.projectId}`,
            title: 'Project Completed',
            message: 'Your project has been completed and returns are available',
            time: formatDate(latestCompleted.calculated.completionDate),
            sortAt: new Date(latestCompleted.calculated.completionDate ?? 0).getTime(),
            type: 'success',
            read: false,
            status: 'SUCCESS',
            amount: toNumber(latestCompleted.calculated.profit),
            channel: 'Project',
          },
        ]
      : []),
    ...returns.slice(0, 3).map((r, i) => ({
      id: `ret-${i}`,
      title: 'Payout Received',
      message: `${formatINR(r.amount?.toString?.() ?? r.amount)} credited from ${r.returnDistribution?.project?.title ?? 'project'}`,
      time: formatDate(r.creditedAt),
      sortAt: new Date(r.creditedAt).getTime(),
      type: 'success',
      read: i > 0,
      status: 'SUCCESS',
      amount: toNumber(r.amount?.toString?.() ?? r.amount),
      channel: 'Returns',
    })),
    ...investments
      .slice(-3)
      .reverse()
      .map((inv, i) => ({
        id: `inv-${i}`,
        title: 'Investment Added',
        message: `${formatINR(inv.investedAmount?.toString?.() ?? inv.investedAmount)} in ${inv.project?.title ?? 'project'}`,
        time: formatDate(inv.createdAt),
        sortAt: new Date(inv.createdAt).getTime(),
        type: 'info',
        read: true,
        status: inv.investmentStatus || 'ACTIVE',
        amount: toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
        channel: 'Investment',
      })),
  ];

  const seen = new Set();
  return events
    .sort((a, b) => b.sortAt - a.sortAt)
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .slice(0, 20)
    .map(({ sortAt, ...event }) => event);
}

export async function getInvestorDashboard(req, res) {
  try {
    const investorId = req.auth.id;

    const [user, investments, returns, walletTransactions, withdrawals, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: investorId },
        select: {
          id: true,
          fullName: true,
          kycStatus: true,
        },
      }),
      prisma.investment.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          investedAmount: true,
          investmentStatus: true,
          createdAt: true,
          projectId: true,
          project: {
            select: {
              id: true,
              title: true,
              expectedROI: true,
              projectStatus: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.userReturn.findMany({
        where: { userId: investorId },
        orderBy: { creditedAt: 'desc' },
        select: {
          amount: true,
          creditedAt: true,
          returnDistribution: {
            select: {
              project: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.walletTransaction.findMany({
        where: { wallet: { userId: investorId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          status: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.withdrawal.findMany({
        where: { investorId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          project: { select: { id: true, title: true } },
        },
      }),
      prisma.payment.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          paymentStatus: true,
          paymentMethod: true,
          transactionId: true,
          createdAt: true,
          project: { select: { id: true, title: true } },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    const totalInvested = investments.reduce(
      (sum, inv) => sum + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
      0
    );

    const activeProjectIds = new Set(
      investments
        .filter((inv) => inv.investmentStatus === 'ACTIVE' && inv.project?.projectStatus !== 'COMPLETED')
        .map((inv) => inv.projectId)
    );
    const activeProjects = activeProjectIds.size;

    const calculatedReturns = investments.map(calculateInvestmentReturn);
    const projectedReturnTotal = calculatedReturns.reduce((sum, item) => sum + item.totalReturn, 0);
    const distributedReturnTotal = returns.reduce((sum, r) => sum + toNumber(r.amount?.toString?.() ?? r.amount), 0);
    const totalReturns = Math.max(projectedReturnTotal, distributedReturnTotal);
    const profit = Math.max(0, totalReturns - totalInvested);
    const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    const pendingWithdrawals = withdrawals
      .filter((item) => item.status === 'PENDING')
      .reduce((sum, item) => sum + toNumber(item.amount?.toString?.() ?? item.amount), 0);
    const approvedWithdrawals = withdrawals
      .filter((item) => item.status === 'APPROVED')
      .reduce((sum, item) => sum + toNumber(item.amount?.toString?.() ?? item.amount), 0);
    const withdrawableAmount = Math.max(0, profit - pendingWithdrawals - approvedWithdrawals);
    const walletBalance = totalInvested + profit - approvedWithdrawals;
    const completedInvestments = investments
      .map((inv, index) => ({ investment: inv, calculated: calculatedReturns[index] }))
      .filter((item) => item.calculated.isCompleted);
    const latestCompleted = completedInvestments
      .sort((a, b) => new Date(b.calculated.completionDate ?? 0) - new Date(a.calculated.completionDate ?? 0))[0];

    const monthlyInvestments = new Map();
    for (const inv of investments) {
      const date = new Date(inv.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const prev = monthlyInvestments.get(monthKey) ?? 0;
      monthlyInvestments.set(monthKey, prev + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount));
    }

    const sortedMonths = [...monthlyInvestments.keys()].sort();
    let cumulative = 0;
    const growth = sortedMonths.map((key) => {
      cumulative += monthlyInvestments.get(key) ?? 0;
      const [year, month] = key.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      return { month: label, value: cumulative };
    });
    if (totalReturns > 0) {
      growth.push({ month: 'Returns', value: totalReturns });
    }

    const activeInvestments = investments
      .slice(-5)
      .reverse()
      .map((inv) => ({
        id: inv.id,
        name: inv.project?.title ?? 'Project',
        invested: toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
        roi: `${toNumber(inv.project?.expectedROI?.toString?.() ?? inv.project?.expectedROI)}%`,
        status: inv.project?.projectStatus === 'COMPLETED' ? 'Project Completed' : 'Active',
      }));

    const notificationTransactions = walletTransactions.length ? walletTransactions : withdrawals;
    const notifications = buildInvestorNotifications({
      latestCompleted,
      returns,
      investments,
      walletTransactions: notificationTransactions,
      payments,
    }).slice(0, 5);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          kycStatus: user.kycStatus,
        },
        stats: {
          totalInvested,
          activeProjects,
          totalReturns,
          profit,
          roi,
          pendingPayouts: withdrawableAmount,
          withdrawableAmount,
          walletBalance,
          pendingWithdrawals,
          approvedWithdrawals,
          hasCompletedProject: Boolean(latestCompleted),
          completedProjectStatus: latestCompleted ? 'Project Completed' : null,
          completedProjectTitle: latestCompleted?.investment?.project?.title ?? null,
          completionDate: latestCompleted?.calculated?.completionDate ?? null,
        },
        growth: growth.length ? growth : [{ month: 'No Data', value: 0 }],
        activeInvestments,
        notifications,
        walletTransactions: walletTransactions.map((tx) => ({
          id: tx.id,
          amount: toNumber(tx.amount?.toString?.() ?? tx.amount),
          type: tx.type,
          description: tx.description,
          status: tx.status,
          createdAt: tx.createdAt,
        })),
        withdrawals: withdrawals.map((item) => ({
          id: item.id,
          amount: toNumber(item.amount?.toString?.() ?? item.amount),
          status: normalizeWithdrawalStatus(item.status),
          projectId: item.project?.id ?? null,
          projectName: item.project?.title ?? null,
          note: `Withdrawal request for ${item.project?.title ?? 'project'}`,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('getInvestorDashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investor dashboard.' });
  }
}

export async function createWithdrawalRequest(req, res) {
  try {
    const investorId = req.auth.id;
    const requestedAmount = toNumber(req.body?.amount);
    const requestedProjectId = Number.parseInt(req.body?.projectId ?? req.body?.project_id ?? '', 10);

    if (requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Withdrawal amount must be greater than zero.' });
    }

    const [user, wallet, investments, withdrawals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: investorId },
        select: {
          id: true,
          kycStatus: true,
          profile: {
            select: {
              bankName: true,
              accountHolderName: true,
              accountNumber: true,
              routingNumber: true,
              swiftCode: true,
            },
          },
        },
      }),
      prisma.wallet.upsert({
        where: { userId: investorId },
        update: {},
        create: { userId: investorId },
        select: { id: true },
      }),
      prisma.investment.findMany({
        where: { userId: investorId },
        select: {
          projectId: true,
          investedAmount: true,
          project: {
            select: {
              id: true,
              title: true,
              expectedROI: true,
              projectStatus: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.withdrawal.findMany({
        where: {
          investorId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
        select: { amount: true, status: true },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }
    if (user.kycStatus !== 'VERIFIED') {
      return res.status(403).json({ success: false, message: 'Complete KYC before withdrawing.' });
    }

    const bankDetails = user.profile ?? {};
    const hasBankDetails =
      bankDetails.bankName?.trim() &&
      bankDetails.accountHolderName?.trim() &&
      bankDetails.accountNumber?.trim();

    if (!hasBankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Please add complete bank details before withdrawing.',
      });
    }

    const totalInvested = investments.reduce(
      (sum, inv) => sum + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
      0
    );
    const totalReturns = investments.reduce((sum, inv) => sum + calculateInvestmentReturn(inv).totalReturn, 0);
    const profit = Math.max(0, totalReturns - totalInvested);
    const reserved = withdrawals.reduce((sum, item) => sum + toNumber(item.amount?.toString?.() ?? item.amount), 0);
    const withdrawableAmount = Math.max(0, profit - reserved);
    const completedInvestments = investments.filter((inv) => inv.project?.projectStatus === 'COMPLETED');
    const targetInvestment = Number.isInteger(requestedProjectId)
      ? investments.find((inv) => inv.projectId === requestedProjectId)
      : completedInvestments[0] ?? investments[0];

    if (Number.isInteger(requestedProjectId) && !targetInvestment) {
      return res.status(404).json({
        success: false,
        message: 'Project investment not found for this investor.',
      });
    }

    if (!targetInvestment?.projectId) {
      return res.status(400).json({
        success: false,
        message: 'No investment project found for this withdrawal.',
      });
    }

    if (requestedAmount > withdrawableAmount) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount exceeds available profit.',
        data: { withdrawableAmount },
      });
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      const withdrawalRecord = await tx.withdrawal.create({
        data: {
          investorId,
          projectId: targetInvestment.projectId,
          amount: requestedAmount,
          status: 'PENDING',
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          projectId: true,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: requestedAmount,
          type: 'DEBIT',
          status: 'PENDING',
          description: 'Withdrawal request sent to bank',
          externalRef: `WITHDRAW_${withdrawalRecord.id}`,
          metadata: {
            withdrawalId: withdrawalRecord.id,
            projectId: targetInvestment.projectId,
            projectTitle: targetInvestment.project?.title ?? null,
            note: 'Withdrawal request sent to bank account',
            requested_by: investorId,
            bankName: bankDetails.bankName,
            accountHolderName: bankDetails.accountHolderName,
            accountLast4: maskAccountNumber(bankDetails.accountNumber),
            routingNumber: bankDetails.routingNumber,
            swiftCode: bankDetails.swiftCode,
            notification_type: 'BANK_WITHDRAWAL',
          },
        },
      });

      return withdrawalRecord;
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      data: {
        id: withdrawal.id,
        amount: toNumber(withdrawal.amount?.toString?.() ?? withdrawal.amount),
        status: normalizeWithdrawalStatus(withdrawal.status),
        projectId: withdrawal.projectId,
        createdAt: withdrawal.createdAt,
        notification: 'Withdrawal request sent to your registered bank account.',
      },
    });
  } catch (err) {
    console.error('createWithdrawalRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to create withdrawal request.' });
  }
}

export async function getInvestorNotifications(req, res) {
  try {
    const investorId = req.auth.id;

    const [investments, returns, walletTransactions, payments] = await Promise.all([
      prisma.investment.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          investedAmount: true,
          investmentStatus: true,
          createdAt: true,
          projectId: true,
          project: {
            select: {
              title: true,
              expectedROI: true,
              projectStatus: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.userReturn.findMany({
        where: { userId: investorId },
        orderBy: { creditedAt: 'desc' },
        select: {
          amount: true,
          creditedAt: true,
          returnDistribution: {
            select: {
              project: {
                select: { title: true },
              },
            },
          },
        },
      }),
      prisma.walletTransaction.findMany({
        where: { wallet: { userId: investorId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          description: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.payment.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          amount: true,
          paymentStatus: true,
          paymentMethod: true,
          transactionId: true,
          createdAt: true,
          project: { select: { id: true, title: true } },
        },
      }),
    ]);

    const calculatedReturns = investments.map(calculateInvestmentReturn);
    const latestCompleted = investments
      .map((investment, index) => ({ investment, calculated: calculatedReturns[index] }))
      .filter((item) => item.calculated.isCompleted)
      .sort((a, b) => new Date(b.calculated.completionDate ?? 0) - new Date(a.calculated.completionDate ?? 0))[0];

    const notifications = buildInvestorNotifications({
      latestCompleted,
      returns,
      investments,
      walletTransactions,
      payments,
    });

    return res.json({
      success: true,
      data: notifications,
      stats: {
        total: notifications.length,
        unread: notifications.filter((item) => !item.read).length,
        important: notifications.filter((item) => item.type === 'warning').length,
        updates: notifications.filter((item) => item.type === 'success').length,
      },
    });
  } catch (err) {
    console.error('getInvestorNotifications:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investor notifications.' });
  }
}
