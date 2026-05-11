import prisma from '../utils/prisma.js';
import { buildProjectTimeline, calculateOverallTimelineProgress } from '../utils/projectTimeline.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';

const allowedStages = new Set(['Foundation', 'Structure', 'Interiors', 'Handover']);
const allowedStatuses = new Set(['pending', 'in_progress', 'completed']);

function toNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : NaN;
}

export async function updateProjectTimeline(req, res) {
  try {
    const builderId = req.auth.id;
    const { stage, status, progress, description } = req.body ?? {};

    const normalizedProjectId = Number.parseInt(req.params.projectId ?? req.body?.projectId, 10);
    let normalizedProgress = Math.max(0, Math.min(100, Math.round(toNumber(progress))));
    let normalizedStatus = status;
    const normalizedDescription = String(description ?? '').trim();

    if (!Number.isInteger(normalizedProjectId)) {
      return res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    }
    if (!allowedStages.has(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage selected.' });
    }
    if (!allowedStatuses.has(normalizedStatus)) {
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
      select: { id: true, title: true },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (normalizedStatus === 'completed') {
      normalizedProgress = 100;
    } else if (normalizedProgress === 100) {
      normalizedStatus = 'completed';
    }

    const result = await prisma.$transaction(async (tx) => {
      const timelineRow = await tx.projectTimeline.upsert({
        where: {
          projectId_stage: {
            projectId: normalizedProjectId,
            stage,
          },
        },
        update: {
          status: normalizedStatus,
          progress: normalizedProgress,
          description: normalizedDescription,
        },
        create: {
          projectId: normalizedProjectId,
          stage,
          status: normalizedStatus,
          progress: normalizedProgress,
          description: normalizedDescription,
        },
      });

      const allTimelineRows = await tx.projectTimeline.findMany({
        where: { projectId: normalizedProjectId },
        orderBy: { createdAt: 'asc' },
      });
      const overallProgress = calculateOverallTimelineProgress(allTimelineRows);
      const projectUpdateData = {
        constructionProgress: overallProgress,
      };
      if (overallProgress === 100) {
        projectUpdateData.projectStatus = 'COMPLETED';
      }

      const updatedProject = await tx.project.update({
        where: { id: normalizedProjectId },
        data: projectUpdateData,
        select: {
          id: true,
          projectStatus: true,
          constructionProgress: true,
        },
      });

      if (overallProgress === 100) {
        await createNotification(tx, {
          builderId,
          type: 'success',
          title: 'Project Work Completed',
          message: `${project.title} progress is 100%. Settlement is ready for admin review.`,
          metadata: { event: 'WORK_COMPLETED', projectId: normalizedProjectId },
        });
        await notifyAdmins(tx, {
          type: 'warning',
          title: 'Project 100% Completed',
          message: `${project.title} has reached 100% construction progress. Please review settlement.`,
          metadata: { event: 'WORK_COMPLETED', projectId: normalizedProjectId },
        });
      }

      return { timelineRow, allTimelineRows, updatedProject, overallProgress };
    });

    return res.json({
      success: true,
      message: 'Timeline updated successfully.',
      data: {
        projectId: normalizedProjectId,
        builderId,
        timeline: buildProjectTimeline(result.allTimelineRows),
        overallProgress: result.overallProgress,
        projectStatus: result.updatedProject.projectStatus,
        constructionProgress: result.updatedProject.constructionProgress,
        updated: {
          stage: result.timelineRow.stage,
          status: result.timelineRow.status,
          progress: result.timelineRow.progress,
          description: result.timelineRow.description,
          updatedAt: result.timelineRow.updatedAt,
        },
      },
    });
  } catch (err) {
    console.error('updateProjectTimeline:', err);
    return res.status(500).json({ success: false, message: 'Failed to update timeline.' });
  }
}
