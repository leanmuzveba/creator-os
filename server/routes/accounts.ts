/**
 * Connected social account routes: list, batch sync from client, reset to
 * defaults, toggle connection, and update handle/metrics for one account.
 */
import { Router } from 'express';
import { listAccounts, getAccount, upsertAccount, updateAccountFields } from '../db.ts';
import { defaultSocialAccounts } from '../store.ts';

export const accountsRouter = Router();

// List all social accounts.
accountsRouter.get('/api/accounts', (req, res) => {
  res.json(listAccounts(req.userId!));
});

// Batch sync/save social account state from the client.
accountsRouter.post('/api/accounts/sync', (req, res) => {
  const incomingAccounts = req.body;
  if (Array.isArray(incomingAccounts) && incomingAccounts.length > 0) {
    for (const existing of listAccounts(req.userId!)) {
      const matched = incomingAccounts.find((inc: any) => inc.id === existing.id);
      if (!matched) continue;
      upsertAccount(req.userId!, {
        ...existing,
        ...matched,
        connected: matched.connected !== undefined ? matched.connected : existing.connected,
      });
    }
  }
  res.json(listAccounts(req.userId!));
});

// Reset social accounts to their default state.
accountsRouter.post('/api/accounts/reset', (req, res) => {
  for (const acc of defaultSocialAccounts) {
    upsertAccount(req.userId!, { ...acc });
  }
  res.json(listAccounts(req.userId!));
});

// Toggle a single account's connection state.
accountsRouter.post('/api/accounts/:id/toggle', (req, res) => {
  const { id } = req.params;
  const account = getAccount(req.userId!, id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  const updated = updateAccountFields(req.userId!, id, { connected: !account.connected });
  res.json(updated);
});

// Update a single account's handle and metrics.
accountsRouter.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const account = getAccount(req.userId!, id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const { handle, followers, views, viewsGrowth, avatar } = req.body;
  const patch: Record<string, unknown> = {};
  if (handle !== undefined) patch.handle = handle;
  if (followers !== undefined) patch.followers = followers;
  if (views !== undefined) patch.views = views;
  if (viewsGrowth !== undefined) patch.viewsGrowth = viewsGrowth;
  if (avatar !== undefined) patch.avatar = avatar;

  const updated = updateAccountFields(req.userId!, id, patch);
  res.json(updated);
});
