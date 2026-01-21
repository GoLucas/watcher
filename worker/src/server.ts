import express from 'express';
import cors from 'cors';
import { runScraperForAllWatchers } from './scraper-runner.js';
import { startScheduler } from './scheduler.js';
import { prisma } from './db.js';

const app = express();
const PORT = process.env.WORKER_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth middleware
const WORKER_SECRET = process.env.WORKER_SECRET || 'watcher-worker-secret';

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== WORKER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'watcher-worker' });
});

// Trigger scraping manually
let isRunning = false;

app.post('/scrape', authMiddleware, async (req, res) => {
  if (isRunning) {
    return res.status(429).json({ 
      success: false, 
      message: 'Scraping already in progress. Please wait.' 
    });
  }

  isRunning = true;
  console.log('[Server] Scrape triggered via API');

  try {
    const result = await runScraperForAllWatchers();
    res.json(result);
  } catch (error) {
    console.error('[Server] Scrape error:', error);
    res.status(500).json({ success: false, message: String(error) });
  } finally {
    isRunning = false;
  }
});

// Get scraping status
app.get('/status', (req, res) => {
  res.json({ 
    isRunning,
    lastCheck: new Date().toISOString()
  });
});

// --- New API Endpoints for Frontend ---

// Get all watchers
app.get('/api/watchers', async (req, res) => {
  try {
    const watchers = await prisma.watcher.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { offers: { where: { isSeen: false } } }
        }
      }
    });
    res.json(watchers);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create watcher
app.post('/api/watchers', authMiddleware, async (req, res) => {
  const { url, name } = req.body;
  try {
    const watcher = await prisma.watcher.create({
      data: { url, name }
    });
    res.json(watcher);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Delete watcher
app.delete('/api/watchers/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.watcher.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Toggle watcher status
app.patch('/api/watchers/:id', authMiddleware, async (req, res) => {
  const { isActive } = req.body;
  try {
    const watcher = await prisma.watcher.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.json(watcher);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Get offers
app.get('/api/offers', async (req, res) => {
  const filter = req.query.filter as string;
  const where: any = {};
  if (filter === 'unseen') where.isSeen = false;
  if (filter === 'favorites') where.isFavorite = true;

  try {
    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { watcher: true }
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Mark offer as seen
app.post('/api/offers/:id/mark-seen', async (req, res) => {
  try {
    await prisma.offer.update({
      where: { id: req.params.id },
      data: { isSeen: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Toggle offer favorite
app.post('/api/offers/:id/toggle-favorite', async (req, res) => {
  const { isFavorite } = req.body;
  try {
    await prisma.offer.update({
      where: { id: req.params.id },
      data: { isFavorite: !isFavorite }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[Worker] Server running on http://localhost:${PORT}`);
  console.log('[Worker] Endpoints:');
  console.log('  GET  /health    - Health check');
  console.log('  GET  /status    - Scraping status');
  console.log('  POST /scrape    - Trigger scraping (requires auth)');
  
  // Start scheduler
  startScheduler();
});
