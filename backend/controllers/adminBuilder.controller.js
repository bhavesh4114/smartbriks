import prisma from '../utils/prisma.js';

function toNumber(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET /api/admin/builders
 */
export async function listBuilders(req, res) {
  try {
    const builders = await prisma.builder.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        kycStatus: true,
        createdAt: true,
        projects: {
          select: {
            id: true,
            projectStatus: true,
            investments: { select: { investedAmount: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rowsFromBuilderTable = builders.map((b) => {
      const totalProjects = b.projects.length;
      const totalFundsRaised = b.projects
        .filter((p) => p.projectStatus === 'APPROVED')
        .reduce(
          (acc, p) =>
            acc +
            p.investments.reduce(
              (sum, i) => sum + toNumber(i.investedAmount?.toString?.() ?? i.investedAmount),
              0
            ),
          0
        );

      return {
        id: b.id,
        company_name: b.companyName,
        email: b.email,
        total_projects: totalProjects,
        funds_raised: totalFundsRaised,
        total_funds_raised: totalFundsRaised,
        created_at: b.createdAt,
        join_date: b.createdAt,
        kyc_status: b.kycStatus,
      };
    });

    let rows = rowsFromBuilderTable;
    if (rows.length === 0) {
      // Compatibility for deployments storing builders in users table with role=BUILDER.
      const legacyBuilders = await prisma.user.findMany({
        where: { role: 'BUILDER' },
        select: {
          id: true,
          fullName: true,
          email: true,
          kycStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      rows = legacyBuilders.map((u) => ({
        id: u.id,
        company_name: u.fullName || `Builder #${u.id}`,
        email: u.email,
        total_projects: 0,
        funds_raised: 0,
        total_funds_raised: 0,
        created_at: u.createdAt,
        join_date: u.createdAt,
        kyc_status: u.kycStatus,
      }));
    }

    return res.json({
      success: true,
      builders: rows,
      users: rows,
      data: rows,
    });
  } catch (err) {
    console.error('listBuilders:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch builders.' });
  }
}

/**
 * GET /api/admin/builders/stats
 */
export async function getBuilderStats(req, res) {
  try {
    let [totalBuilders, verifiedBuilders, pendingBuilders] = await Promise.all([
      prisma.builder.count(),
      prisma.builder.count({ where: { kycStatus: 'VERIFIED' } }),
      prisma.builder.count({ where: { kycStatus: 'PENDING' } }),
    ]);

    if (totalBuilders === 0) {
      const fallback = await Promise.all([
        prisma.user.count({ where: { role: 'BUILDER' } }),
        prisma.user.count({ where: { role: 'BUILDER', kycStatus: 'VERIFIED' } }),
        prisma.user.count({ where: { role: 'BUILDER', kycStatus: 'PENDING' } }),
      ]);
      [totalBuilders, verifiedBuilders, pendingBuilders] = fallback;
    }

    const stats = {
      total_builders: totalBuilders,
      verified_builders: verifiedBuilders,
      pending_builders: pendingBuilders,
    };

    return res.json({
      success: true,
      total_builders: stats.total_builders,
      verified_builders: stats.verified_builders,
      pending_builders: stats.pending_builders,
      stats,
      data: stats,
    });
  } catch (err) {
    console.error('getBuilderStats:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch builder stats.' });
  }
}

/**
 * POST /api/admin/builders/:id/verify
 */
export async function verifyBuilder(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid builder id.' });
    }

    const builder = await prisma.builder.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.builder.update({
        where: { id },
        data: { kycStatus: 'VERIFIED', isApproved: true },
      });

      const latestKyc = await tx.kYC.findFirst({
        where: { builderId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (latestKyc) {
        await tx.kYC.update({
          where: { id: latestKyc.id },
          data: { status: 'VERIFIED', rejectionReason: null, verifiedAt: new Date() },
        });
      }
    });

    return res.json({ success: true, message: 'Builder verified.' });
  } catch (err) {
    console.error('verifyBuilder:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify builder.' });
  }
}

/**
 * POST /api/admin/builders/:id/reject
 * Body: { reason?: string }
 */
export async function rejectBuilder(req, res) {
  try {
    const id = Number(req.params.id);
    const reason = req.body?.reason?.trim() || null;
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid builder id.' });
    }

    const builder = await prisma.builder.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.builder.update({
        where: { id },
        data: { kycStatus: 'REJECTED', isApproved: false },
      });

      const latestKyc = await tx.kYC.findFirst({
        where: { builderId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (latestKyc) {
        await tx.kYC.update({
          where: { id: latestKyc.id },
          data: { status: 'REJECTED', rejectionReason: reason, verifiedAt: null },
        });
      }
    });

    return res.json({ success: true, message: 'Builder rejected.' });
  } catch (err) {
    console.error('rejectBuilder:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject builder.' });
  }
}
