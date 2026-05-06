import prisma from '../utils/prisma.js';
import { buildProjectTimeline } from '../utils/projectTimeline.js';

const allowedStages = new Set(['Foundation', 'Structure', 'Interiors', 'Handover']);
const allowedStatuses = new Set(['pending', 'in_progress', 'completed']);

function toNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : NaN;
}

export async function updateProjectTimeline(req, res) {
  try {
    const builderId = req.auth.id;
    const { projectId, stage, status, progress, description } = req.body ?? {};

    const normalizedProjectId = Number.parseInt(projectId, 10);
    const normalizedProgress = Math.max(0, Math.min(100, Math.round(toNumber(progress))));
    const normalizedDescription = String(description ?? '').trim();

    if (!Number.isInteger(normalizedProjectId)) {
      return res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    }
    if (!allowedStages.has(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage selected.' });
    }
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status selected.' });
    }
    if (!Number.isFinite(normalizedProgress)) {
      return res.status(400).json({ success: false, message: 'Progress must be between 0 and 100.' });
    }
    if (!normalizedDescription) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const project = await prisma.project.findFirst({
      where: { id: normalizedProjectId, builderId },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const timelineRow = await prisma.projectTimeline.upsert({
      where: {
        projectId_stage: {
          projectId: normalizedProjectId,
          stage,
        },
      },
      update: {
        status,
        progress: normalizedProgress,
        description: normalizedDescription,
      },
      create: {
        projectId: normalizedProjectId,
        stage,
        status,
        progress: normalizedProgress,
        description: normalizedDescription,
      },
    });

    const allTimelineRows = await prisma.projectTimeline.findMany({
      where: { projectId: normalizedProjectId },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      success: true,
      message: 'Timeline updated successfully.',
      data: {
        projectId: normalizedProjectId,
        builderId,
        timeline: buildProjectTimeline(allTimelineRows),
        updated: {
          stage: timelineRow.stage,
          status: timelineRow.status,
          progress: timelineRow.progress,
          description: timelineRow.description,
          updatedAt: timelineRow.updatedAt,
        },
      },
    });
  } catch (err) {
    console.error('updateProjectTimeline:', err);
    return res.status(500).json({ success: false, message: 'Failed to update timeline.' });
  }
}
