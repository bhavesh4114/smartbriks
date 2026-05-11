const defaultTimelineStages = [
  {
    stage: 'Foundation',
    progress: 0,
    status: 'pending',
    description: 'Work update not added yet.',
  },
  {
    stage: 'Structure',
    progress: 0,
    status: 'pending',
    description: 'Work update not added yet.',
  },
  {
    stage: 'Interiors',
    progress: 0,
    status: 'pending',
    description: 'Work update not added yet.',
  },
  {
    stage: 'Handover',
    progress: 0,
    status: 'pending',
    description: 'Work update not added yet.',
  },
];

function clampProgress(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function buildProjectTimeline(rows = []) {
  const byStage = new Map(
    rows.map((row) => [
      row.stage,
      {
        stage: row.stage,
        progress: clampProgress(row.progress),
        status: row.status,
        description: row.description,
      },
    ]),
  );

  return defaultTimelineStages.map((item) => byStage.get(item.stage) ?? item);
}

export function calculateOverallTimelineProgress(rows = []) {
  const timeline = buildProjectTimeline(rows);
  if (!timeline.length) return 0;
  const total = timeline.reduce((sum, item) => sum + clampProgress(item.progress), 0);
  return clampProgress(total / timeline.length);
}

export function serializeProjectTimelineForInvestor(rows = []) {
  return buildProjectTimeline(rows).map((item) => ({
    phase: item.stage,
    status:
      item.status === 'completed'
        ? 'Completed'
        : item.status === 'in_progress'
        ? 'In Progress'
        : 'Pending',
    progress: item.progress,
    description: item.description,
  }));
}
