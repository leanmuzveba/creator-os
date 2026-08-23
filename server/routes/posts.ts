/**
 * Content post routes: list (with filters), create, update, and delete posts.
 */
import { Router } from 'express';
import { store, saveStorage } from '../store.ts';
import type { PostItem } from '../store.ts';

export const postsRouter = Router();

// 1. Get all posts (optionally filtered by status, category, platform).
postsRouter.get('/api/posts', (req, res) => {
  const { status, category, platform } = req.query;
  let filtered = [...store.posts];

  if (status && status !== 'all') {
    filtered = filtered.filter((p) => p.status === status);
  }
  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (platform && platform !== 'all') {
    filtered = filtered.filter((p) => p.platforms.includes(platform as any));
  }

  res.json(filtered);
});

// 2. Create a post.
postsRouter.post('/api/posts', (req, res) => {
  const isPublished = req.body.status === 'published';
  const newPost: PostItem = {
    id: `post-${Date.now()}`,
    title: req.body.title || 'Untitled Post',
    category: req.body.category || 'Tech Education',
    platforms: req.body.platforms || ['tiktok'],
    status: req.body.status || 'draft',
    scheduledDate: req.body.scheduledDate,
    scheduledTime: req.body.scheduledTime,
    publishedDate: isPublished ? new Date().toISOString().split('T')[0] : undefined,
    caption: req.body.caption || '',
    hashtags: req.body.hashtags || [],
    thumbnailUrl:
      req.body.thumbnailUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    videoUrl: req.body.videoUrl,
    duration: req.body.duration || '00:45',
    views: isPublished ? Math.floor(Math.random() * 50000) + 5000 : undefined,
    likes: isPublished ? Math.floor(Math.random() * 5000) + 500 : undefined,
    comments: isPublished ? Math.floor(Math.random() * 200) + 20 : undefined,
    shares: isPublished ? Math.floor(Math.random() * 150) + 10 : undefined,
    bookmarks: isPublished ? Math.floor(Math.random() * 400) + 50 : undefined,
    metricsGrowth: '↑ ' + (Math.floor(Math.random() * 20) + 5) + '%',
    script: req.body.script,
  };

  store.posts.unshift(newPost);
  saveStorage();
  res.status(201).json(newPost);
});

// 3. Update a post.
postsRouter.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const index = store.posts.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  store.posts[index] = { ...store.posts[index], ...req.body };
  saveStorage();
  res.json(store.posts[index]);
});

// 4. Delete a post.
postsRouter.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  store.posts = store.posts.filter((p) => p.id !== id);
  saveStorage();
  res.json({ success: true, id });
});
