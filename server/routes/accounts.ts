/**
 * Connected social account routes: list, batch sync from client, reset to
 * defaults, toggle connection, and update handle/metrics for one account.
 */
import { Router } from 'express';
import { store, saveStorage, defaultSocialAccounts } from '../store.ts';

export const accountsRouter = Router();

// List all social accounts.
accountsRouter.get('/api/accounts', (req, res) => {
  res.json(store.socialAccounts);
});

// Batch sync/save social account state from the client.
accountsRouter.post('/api/accounts/sync', (req, res) => {
  const incomingAccounts = req.body;
  if (Array.isArray(incomingAccounts) && incomingAccounts.length > 0) {
    store.socialAccounts = store.socialAccounts.map((existing) => {
      const matched = incomingAccounts.find((inc: any) => inc.id === existing.id);
      if (!matched) return existing;
      return {
        ...existing,
        ...matched,
        connected: matched.connected !== undefined ? matched.connected : existing.connected,
      };
    });
    saveStorage();
  }
  res.json(store.socialAccounts);
});

// Reset social accounts to their default state.
accountsRouter.post('/api/accounts/reset', (req, res) => {
  store.socialAccounts = defaultSocialAccounts.map((a) => ({ ...a }));
  saveStorage();
  res.json(store.socialAccounts);
});

// Toggle a single account's connection state.
accountsRouter.post('/api/accounts/:id/toggle', (req, res) => {
  const { id } = req.params;
  const account = store.socialAccounts.find((a) => a.id === id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  account.connected = !account.connected;
  saveStorage();
  res.json(account);
});

// Update a single account's handle and metrics.
accountsRouter.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const account = store.socialAccounts.find((a) => a.id === id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const { handle, followers, views, viewsGrowth, avatar } = req.body;
  if (handle !== undefined) account.handle = handle;
  if (followers !== undefined) account.followers = followers;
  if (views !== undefined) account.views = views;
  if (viewsGrowth !== undefined) account.viewsGrowth = viewsGrowth;
  if (avatar !== undefined) account.avatar = avatar;

  saveStorage();
  res.json(account);
});
