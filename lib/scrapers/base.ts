import { chromium, Browser, Page } from 'playwright';
import { ScrapedOffer } from './types';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  async initialize() {
    this.browser = await chromium.launch({
      headless: true, // Set to false for debugging
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    this.page = await context.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  abstract scrape(url: string): Promise<ScrapedOffer[]>;

  protected async navigate(url: string) {
    if (!this.page) throw new Error('Scraper not initialized');
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    // Random wait to be polite
    await this.page.waitForTimeout(Math.random() * 2000 + 1000);
  }
}
