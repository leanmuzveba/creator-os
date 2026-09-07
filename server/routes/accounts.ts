/**
 * Connected social account routes: list, batch sync from client, reset to
 * defaults, toggle connection, and update handle/metrics for one account.
 */
import { Router } from 'express';
import { listAccounts, getAccount, upsertAccount, updateAccountFields, DEFAULT_LOCAL_USER_ID } from '../db.ts';
import { defaultSocialAccounts } from '../store.ts';

export const accountsRouter = Router();

// List all social accounts.
accountsRouter.get('/api/accounts', (req, res) => {
  res.json(listAccounts(DEFAULT_LOCAL_USER_ID));
});

// Batch sync/save social account state from the client.
accountsRouter.post('/api/accounts/sync', (req, res) => {
  const incomingAccounts = req.body;
  if (Array.isArray(incomingAccounts) && incomingAccounts.length > 0) {
    for (const existing of listAccounts(DEFAULT_LOCAL_USER_ID)) {
      const matched = incomingAccounts.find((inc: any) => inc.id === existing.id);
      if (!matched) continue;
      upsertAccount(DEFAULT_LOCAL_USER_ID, {
        ...existing,
        ...matched,
        connected: matched.connected !== undefined ? matched.connected : existing.connected,
      });
    }
  }
  res.json(listAccounts(DEFAULT_LOCAL_USER_ID));
});

// Reset social accounts to their default state.
accountsRouter.post('/api/accounts/reset', (req, res) => {
  for (const acc of defaultSocialAccounts) {
    upsertAccount(DEFAULT_LOCAL_USER_ID, { ...acc });
  }
  res.json(listAccounts(DEFAULT_LOCAL_USER_ID));
});

// Toggle a single account's connection state.
accountsRouter.post('/api/accounts/:id/toggle', (req, res) => {
  const { id } = req.params;
  const account = getAccount(DEFAULT_LOCAL_USER_ID, id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  const updated = updateAccountFields(DEFAULT_LOCAL_USER_ID, id, { connected: !account.connected });
  res.json(updated);
});

// Update a single account's handle and metrics.
accountsRouter.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const account = getAccount(DEFAULT_LOCAL_USER_ID, id);
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

  const updated = updateAccountFields(DEFAULT_LOCAL_USER_ID, id, patch);
  res.json(updated);
});
