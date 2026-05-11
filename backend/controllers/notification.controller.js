import prisma from '../utils/prisma.js';
import { createNotification, serializeNotification } from '../utils/notifications.js';

async function listForAuth(req, res, audience) {
  try {
    const where =
      audience === 'INVESTOR'
        ? { userId: req.auth.id }
        : audience === 'BUILDER'
        ? { builderId: req.auth.id }
        : { OR: [{ role: 'ADMIN' }, { userId: req.auth.id }] };

    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({
      success: true,
      data: {
        notifications: rows.map(serializeNotification),
        stats: {
          total: rows.length,
          unread: rows.filter((row) => !row.read).length,
          important: rows.filter((row) => row.type === 'warning').length,
          updates: rows.filter((row) => row.type === 'success').length,
        },
      },
    });
  } catch (err) {
    console.error('list notifications:', err);
    return res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
}

export const listInvestorNotifications = (req, res) => listForAuth(req, res, 'INVESTOR');
export const listBuilderNotifications = (req, res) => listForAuth(req, res, 'BUILDER');
export const listAdminNotifications = (req, res) => listForAuth(req, res, 'ADMIN');

export async function markNotificationsRead(req, res) {
  try {
    const role = req.auth.role;
    const where =
      role === 'INVESTOR'
        ? { userId: req.auth.id }
        : role === 'BUILDER'
        ? { builderId: req.auth.id }
        : { OR: [{ role: 'ADMIN' }, { userId: req.auth.id }] };

    await prisma.notification.updateMany({ where, data: { read: true } });
    return res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('markNotificationsRead:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
}

export async function sendAdminNotification(req, res) {
  try {
    const title = String(req.body?.title ?? '').trim();
    const message = String(req.body?.message ?? '').trim();
    const recipient = String(req.body?.recipient ?? 'All Users');
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    await prisma.$transaction(async (tx) => {
      const base = { type: 'info', title, message, metadata: { source: 'admin_broadcast', recipient } };
      if (recipient === 'All Investors' || recipient === 'All Users') {
        const investors = await tx.user.findMany({ where: { role: 'INVESTOR' }, select: { id: true } });
        for (const investor of investors) await createNotification(tx, { ...base, userId: investor.id });
      }
      if (recipient === 'All Builders' || recipient === 'All Users') {
        const builders = await tx.builder.findMany({ select: { id: true } });
        for (const builder of builders) await createNotification(tx, { ...base, builderId: builder.id });
      }
      await createNotification(tx, { ...base, role: 'ADMIN', title: `Sent: ${title}` });
    });

    return res.json({ success: true, message: 'Notification sent.' });
  } catch (err) {
    console.error('sendAdminNotification:', err);
    return res.status(500).json({ success: false, message: 'Failed to send notification.' });
  }
}
