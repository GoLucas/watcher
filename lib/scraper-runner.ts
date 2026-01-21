import { PrismaClient } from '@prisma/client';
import { OlxScraper } from './scrapers/olx';
import { OtodomScraper } from './scrapers/otodom';
import { OtomotoScraper } from './scrapers/otomoto';
import { ScrapedOffer } from './scrapers/types';

// Reusable scraper runner logic (used by both API and scheduler)
export async function runScraperForAllWatchers(): Promise<{ success: boolean; message: string; stats: { total: number; inserted: number } }> {
  const prisma = new PrismaClient();
  const olxScraper = new OlxScraper();
  const otodomScraper = new OtodomScraper();
  const otomotoScraper = new OtomotoScraper();

  let totalScraped = 0;
  let totalInserted = 0;

  console.log('[Scraper Runner] Starting...');

  try {
    const watchers = await prisma.watcher.findMany({
      where: { isActive: true }
    });

    console.log(`[Scraper Runner] Found ${watchers.length} active watchers.`);

    for (const watcher of watchers) {
      console.log(`[Scraper Runner] Processing: ${watcher.name}`);
      
      let source: string | null = null;
      if (watcher.url.includes('olx.pl')) source = 'OLX';
      else if (watcher.url.includes('otodom.pl')) source = 'OTODOM';
      else if (watcher.url.includes('otomoto.pl')) source = 'OTOMOTO';

      let offers: ScrapedOffer[] = [];

      try {
        if (source === 'OLX') {
          offers = await olxScraper.scrape(watcher.url);
        } else if (source === 'OTODOM') {
          offers = await otodomScraper.scrape(watcher.url);
        } else if (source === 'OTOMOTO') {
          offers = await otomotoScraper.scrape(watcher.url);
        } else {
          console.warn(`[Scraper Runner] Unsupported source for ${watcher.url}`);
          continue;
        }

        console.log(`[Scraper Runner] Scraped ${offers.length} offers for ${watcher.name}`);
        totalScraped += offers.length;

        if (offers.length > 0) {
          // Deduplicate
          const uniqueOffers = offers.filter((offer, index, self) =>
            index === self.findIndex((t) => t.externalId === offer.externalId)
          );

          const data = uniqueOffers.map(o => ({
            externalId: o.externalId,
            title: o.title,
            price: o.price,
            currency: o.currency,
            url: o.url,
            imageUrl: o.imageUrl,
            source: o.source,
            location: o.location,
            watcherId: watcher.id,
            isSeen: false,
            isFavorite: false
          }));

          // Filter existing
          const existingOffers = await prisma.offer.findMany({
            where: {
              watcherId: watcher.id,
              OR: uniqueOffers.map(o => ({ externalId: o.externalId, source: o.source }))
            },
            select: { externalId: true, source: true }
          });

          const existingSet = new Set(existingOffers.map(o => `${o.externalId}-${o.source}`));
          const newOffers = data.filter(o => !existingSet.has(`${o.externalId}-${o.source}`));

          if (newOffers.length > 0) {
            const result = await prisma.offer.createMany({ data: newOffers });
            console.log(`[Scraper Runner] Inserted ${result.count} new offers.`);
            totalInserted += result.count;
          }
        }

        await prisma.watcher.update({
          where: { id: watcher.id },
          data: { lastRunAt: new Date() }
        });

      } catch (err) {
        console.error(`[Scraper Runner] Error for watcher ${watcher.id}:`, err);
      }

      // Polite delay
      await new Promise(r => setTimeout(r, 3000));
    }

    return {
      success: true,
      message: `Scraped ${watchers.length} watchers.`,
      stats: { total: totalScraped, inserted: totalInserted }
    };

  } catch (e) {
    console.error('[Scraper Runner] Fatal error:', e);
    return { success: false, message: String(e), stats: { total: 0, inserted: 0 } };
  } finally {
    await olxScraper.close();
    await otodomScraper.close();
    await otomotoScraper.close();
    await prisma.$disconnect();
    console.log('[Scraper Runner] Finished.');
  }
}
