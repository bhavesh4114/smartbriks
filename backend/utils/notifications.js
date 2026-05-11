export function timeAgo(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

export function serializeNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    time: timeAgo(row.createdAt),
    createdAt: row.createdAt,
    metadata: row.metadata ?? null,
  };
}

export async function createNotification(tx, data) {
  return tx.notification.create({
    data: {
      userId: data.userId ?? null,
      builderId: data.builderId ?? null,
      role: data.role ?? null,
      type: data.type ?? 'info',
      title: data.title,
      message: data.message,
      metadata: data.metadata ?? undefined,
    },
  });
}

export async function notifyAdmins(tx, data) {
  return createNotification(tx, { ...data, role: 'ADMIN' });
}
