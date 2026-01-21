import { PrismaClient } from '@prisma/client';
import { OlxScraper } from '../lib/scrapers/olx';
import { OtodomScraper } from '../lib/scrapers/otodom';
import { OtomotoScraper } from '../lib/scrapers/otomoto';
import { ScrapedOffer } from '../lib/scrapers/types';

const prisma = new PrismaClient();
const olxScraper = new OlxScraper();
const otodomScraper = new OtodomScraper();
const otomotoScraper = new OtomotoScraper();

async function determineSource(url: string) {
  if (url.includes('olx.pl')) return 'OLX';
  if (url.includes('otodom.pl')) return 'OTODOM';
  if (url.includes('otomoto.pl')) return 'OTOMOTO';
  return null;
}

async function run() {
  console.log('Worker started...');
  
  try {
    const watchers = await prisma.watcher.findMany({
      where: { isActive: true }
    });
    
    console.log(`Found ${watchers.length} active watchers.`);

    for (const watcher of watchers) {
      console.log(`Processing watcher: ${watcher.name} (${watcher.url})`);
      const source = await determineSource(watcher.url);
      
      let offers: ScrapedOffer[] = [];
      
      try {
        if (source === 'OLX') {
            offers = await olxScraper.scrape(watcher.url);
        } else if (source === 'OTODOM') {
            offers = await otodomScraper.scrape(watcher.url);
        } else if (source === 'OTOMOTO') {
            offers = await otomotoScraper.scrape(watcher.url);
        } else {
            console.warn(`Source not supported yet: ${source}`);
            continue;
        }
        
        console.log(`Scraped ${offers.length} offers for ${watcher.name}`);
        
        if (offers.length > 0) {
            // Deduplicate offers within the current batch (e.g. promoted vs organic might appear twice)
            const uniqueScrapedOffers = offers.filter((offer, index, self) => 
                index === self.findIndex((t) => t.externalId === offer.externalId)
            );

            const data = uniqueScrapedOffers.map(o => ({
            externalId: o.externalId,
            title: o.title,
            price: o.price,
            currency: o.currency,
            url: o.url,
            imageUrl: o.imageUrl,
            source: o.source,
            location: o.location,
            watcherId: watcher.id, // Link to this specific watcher
            isSeen: false,
            isFavorite: false
            }));

            // Filter out offers that already exist for this watcher to avoid unique constraint errors
            const existingOffers = await prisma.offer.findMany({
              where: {
                watcherId: watcher.id,
                OR: uniqueScrapedOffers.map(o => ({ externalId: o.externalId, source: o.source }))
              },
              select: { externalId: true, source: true }
            });

            const existingSet = new Set(existingOffers.map(o => `${o.externalId}-${o.source}`));
            
            const newOffers = data.filter(o => !existingSet.has(`${o.externalId}-${o.source}`));

            if (newOffers.length > 0) {
              const result = await prisma.offer.createMany({
                data: newOffers
              });
              console.log(`Inserted ${result.count} new offers.`);
            } else {
              console.log('No new unique offers found.');
            }
        }

        await prisma.watcher.update({
            where: { id: watcher.id },
            data: { lastRunAt: new Date() }
        });

      } catch (err) {
        console.error(`Failed to process watcher ${watcher.id}:`, err);
      }
      
      // Be polite between watchers
      await new Promise(r => setTimeout(r, 5000));
    }
    
  } catch (e) {
    console.error('Worker error:', e);
  } finally {
    await olxScraper.close();
    await otodomScraper.close();
    await otomotoScraper.close();
    await prisma.$disconnect();
    console.log('Worker finished.');
  }
}

// Auto-run if executed directly
run();
