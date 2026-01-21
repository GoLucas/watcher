import cron from 'node-cron';
import { runScraperForAllWatchers } from './scraper-runner.js';

let isSchedulerRunning = false;
let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

// Default: every hour
const SCRAPE_CRON = process.env.SCRAPE_CRON || '0 * * * *';

export function startScheduler() {
  if (isSchedulerRunning) {
    console.log('[Scheduler] Already running, skipping.');
    return;
  }

  console.log(`[Scheduler] Starting with cron schedule: ${SCRAPE_CRON}`);

  scheduledTask = cron.schedule(SCRAPE_CRON, async () => {
    console.log('[Scheduler] Triggered by cron.');
    try {
      await runScraperForAllWatchers();
    } catch (err) {
      console.error('[Scheduler] Error during scheduled run:', err);
    }
  });

  isSchedulerRunning = true;
  console.log('[Scheduler] Started successfully.');
}

export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    isSchedulerRunning = false;
    console.log('[Scheduler] Stopped.');
  }
}
