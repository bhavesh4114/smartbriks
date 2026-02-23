import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Create project (Builder only)
 * POST /api/projects
 */
export async function createProject(req, res) {
  try {
    const builderId = req.auth.id;
    const {
      title,
      description,
      location,
      totalValue,
      totalShares,
      pricePerShare,
      minInvestment,
      expectedROI,
      projectStatus = 'DRAFT',
      startDate,
      endDate,
    } = req.body;

    if (!title || !description || !location || totalValue == null || totalShares == null) {
      return res.status(400).json({
        success: false,
        message: 'title, description, location, totalValue and totalShares are required.',
      });
    }

    const price = pricePerShare != null ? new Decimal(pricePerShare) : new Decimal(totalValue).div(totalShares);
    const minInv = minInvestment != null ? new Decimal(minInvestment) : price;
    const roi = expectedROI != null ? new Decimal(expectedROI) : new Decimal(0);

    const project = await prisma.project.create({
      data: {
        builderId,
        title,
        description,
        location,
        totalValue: new Decimal(totalValue),
        totalShares: Number(totalShares),
        pricePerShare: price,
        minInvestment: minInv,
        expectedROI: roi,
        projectStatus: projectStatus || 'DRAFT',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created.',
      data: serializeProject(project),
    });
  } catch (err) {
    console.error('createProject:', err);
    res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
}

/**
 * Update project (Builder, own only)
 * PATCH /api/projects/:id
 */
export async function updateProject(req, res) {
  try {
    const builderId = req.auth.id;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const existing = await prisma.project.findFirst({
      where: { id, builderId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const allowed = [
      'title', 'description', 'location', 'totalValue', 'totalShares',
      'pricePerShare', 'minInvestment', 'expectedROI', 'projectStatus',
      'startDate', 'endDate',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (['totalValue', 'pricePerShare', 'minInvestment', 'expectedROI'].includes(key)) {
          updates[key] = new Decimal(req.body[key]);
        } else if (['startDate', 'endDate'].includes(key)) {
          updates[key] = req.body[key] ? new Date(req.body[key]) : null;
        } else if (key === 'totalShares') {
          updates[key] = Number(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updates,
    });

    res.json({
      success: true,
      message: 'Project updated.',
      data: serializeProject(project),
    });
  } catch (err) {
    console.error('updateProject:', err);
    res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
}

/**
 * Delete project (Builder, own only)
 * DELETE /api/projects/:id
 */
export async function deleteProject(req, res) {
  try {
    const builderId = req.auth.id;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const existing = await prisma.project.findFirst({
      where: { id, builderId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    console.error('deleteProject:', err);
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
}

/**
 * List active projects (for investors to browse)
 * GET /api/projects?status=ACTIVE
 */
export async function listProjects(req, res) {
  try {
    const status = req.query.status || 'ACTIVE';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.projectStatus = status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          builder: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
            },
          },
          _count: { select: { investments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects.map((p) => ({
        ...serializeProject(p),
        builder: p.builder,
        investmentCount: p._count?.investments ?? 0,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('listProjects:', err);
    res.status(500).json({ success: false, message: 'Failed to list projects.' });
  }
}

/**
 * Get single project by ID (for investors)
 * GET /api/projects/:id
 */
export async function getProjectById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        builder: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            kycStatus: true,
          },
        },
        _count: { select: { investments: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({
      success: true,
      data: {
        ...serializeProject(project),
        builder: project.builder,
        investmentCount: project._count?.investments ?? 0,
      },
    });
  } catch (err) {
    console.error('getProjectById:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
}

function serializeProject(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    location: p.location,
    totalValue: p.totalValue?.toString?.() ?? p.totalValue,
    totalShares: p.totalShares,
    pricePerShare: p.pricePerShare?.toString?.() ?? p.pricePerShare,
    minInvestment: p.minInvestment?.toString?.() ?? p.minInvestment,
    expectedROI: p.expectedROI?.toString?.() ?? p.expectedROI,
    projectStatus: p.projectStatus,
    builderId: p.builderId,
    startDate: p.startDate,
    endDate: p.endDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
