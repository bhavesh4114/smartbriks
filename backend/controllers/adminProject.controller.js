import prisma from '../utils/prisma.js';

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function serializeProjectForAdmin(p) {
  const required = toNum(p.totalValue?.toString?.() ?? p.totalValue);
  const raised = toNum(p._sumInvested ?? 0);
  const progress = required > 0 ? Math.min(100, (raised / required) * 100) : 0;
  return {
    id: p.id,
    projectName: p.title,
    builder: p.builder?.companyName ?? 'Unknown',
    required,
    raised,
    progress,
    status: p.projectStatus,
    rejectionReason: p.rejectionReason ?? null,
    approvedAt: p.approvedAt ?? null,
    createdAt: p.createdAt,
  };
}

/**
 * GET /api/admin/projects
 */
export async function listAdminProjects(req, res) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        builder: { select: { id: true, companyName: true } },
        investments: { select: { investedAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = projects.map((p) => {
      const sumInvested = p.investments.reduce((acc, i) => acc + toNum(i.investedAmount?.toString?.() ?? i.investedAmount), 0);
      return serializeProjectForAdmin({ ...p, _sumInvested: sumInvested });
    });

    const totalProjects = rows.length;
    const activeProjects = rows.filter((p) => p.status === 'APPROVED').length;
    const pendingProjects = rows.filter((p) => p.status === 'PENDING_APPROVAL').length;

    return res.json({
      success: true,
      data: rows,
      stats: {
        totalProjects,
        activeProjects,
        pendingProjects,
      },
    });
  } catch (err) {
    console.error('listAdminProjects:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
}

/**
 * POST /api/admin/projects/:id/approve
 */
export async function approveProject(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        investments: { select: { investedAmount: true } },
      },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Only pending projects can be approved.' });
    }

    const raised = project.investments.reduce(
      (sum, inv) => sum + toNum(inv.investedAmount?.toString?.() ?? inv.investedAmount),
      0
    );
    const totalValue = toNum(project.totalValue?.toString?.() ?? project.totalValue);
    const isFundingApproval = raised > 0 && raised >= totalValue;

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          projectStatus: isFundingApproval ? 'FUNDED' : 'APPROVED',
          approvedAt: new Date(),
          rejectionReason: null,
        },
      });

      if (isFundingApproval) {
        const pendingRelease = await tx.payment.findFirst({
          where: {
            projectId: id,
            builderId: project.builderId,
            userId: null,
            paymentMethod: 'ADMIN_RELEASE',
            paymentStatus: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (pendingRelease) {
          await tx.payment.update({
            where: { id: pendingRelease.id },
            data: {
              paymentStatus: 'SUCCESS',
              gatewayResponse: {
                ...(pendingRelease.gatewayResponse || {}),
                approved_at: new Date().toISOString(),
                approved_by_role: 'ADMIN',
              },
            },
          });
        }
      }
    });

    return res.json({
      success: true,
      message: isFundingApproval
        ? 'Project approved and funds released to builder wallet.'
        : 'Project approved.',
    });
  } catch (err) {
    console.error('approveProject:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve project.' });
  }
}

/**
 * POST /api/admin/projects/:id/reject
 * Body: { reason: string }
 */
export async function rejectProject(req, res) {
  try {
    const id = Number(req.params.id);
    const reason = req.body?.reason?.trim();
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        investments: { select: { investedAmount: true } },
      },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Only pending projects can be rejected.' });
    }

    const raised = project.investments.reduce(
      (sum, inv) => sum + toNum(inv.investedAmount?.toString?.() ?? inv.investedAmount),
      0
    );
    const totalValue = toNum(project.totalValue?.toString?.() ?? project.totalValue);
    const isFundingApproval = raised > 0 && raised >= totalValue;

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          projectStatus: 'REJECTED',
          approvedAt: null,
          rejectionReason: reason,
        },
      });

      if (isFundingApproval) {
        await tx.payment.updateMany({
          where: {
            projectId: id,
            builderId: project.builderId,
            userId: null,
            paymentMethod: 'ADMIN_RELEASE',
            paymentStatus: 'PENDING',
          },
          data: {
            paymentStatus: 'FAILED',
          },
        });
      }
    });

    return res.json({ success: true, message: 'Project rejected.' });
  } catch (err) {
    console.error('rejectProject:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject project.' });
  }
}
