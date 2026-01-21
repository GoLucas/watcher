import { BaseScraper } from './base';
import { ScrapedOffer } from './types';

export class OtodomScraper extends BaseScraper {
  async scrape(url: string): Promise<ScrapedOffer[]> {
    if (!this.browser) await this.initialize();
    
    console.log(`Navigating to ${url}`);
    await this.navigate(url);
    
    // Handle cookie consent
    try {
      const cookieButton = await this.page?.$('button[id="onetrust-accept-btn-handler"]');
      if (cookieButton) {
        await cookieButton.click();
      }
    } catch (e) {
      // Ignore
    }

    // Wait for offers (articles with data-cy="listing-item-link" inside or just article tags)
    // Otodom uses <article> for items.
    await this.page?.waitForSelector('article', { timeout: 10000 });

    const offers: ScrapedOffer[] = [];
    
    if (!this.page) return [];

    const cards = await this.page.$$('article');
    
    console.log(`Found ${cards.length} cards`);

    for (const card of cards) {
      try {
        // Otodom doesn't always have a clean ID on the card, but the link usually ends with ID
        const linkEl = await card.$('a[data-cy="listing-item-link"]');
        if (!linkEl) continue; // Not a valid listing card

        let offerUrl = await linkEl.getAttribute('href');
        if (offerUrl && !offerUrl.startsWith('http')) {
            offerUrl = `https://www.otodom.pl${offerUrl}`;
        }
        if (!offerUrl) continue;

        // Extract ID from URL (usually last part before .html or just the end)
        // Example: .../oferta/tytul-ID12345.html
        // Otodom IDs are usually part of the slug after "ID"
        // If not found in URL, try to generate one or find in DOM
        // Looking at researching: "url": "a[data-cy='listing-item-link']"
        
        // title: [data-cy='listing-item-title']
        const titleEl = await card.$('[data-cy="listing-item-title"]');
        const title = await titleEl?.innerText();
        
        // price: [class*='eanmlll1'] - this is a generated class, might be unstable.
        // Let's try finding the price by text content pattern if class fails, or use common parent
        // Research said: [class*='eanmlll1']
        const priceEl = await card.$('span[class*="eanmlll1"]'); 
        const priceText = await priceEl?.innerText().catch(() => 'N/A');

        const imgEl = await card.$('img[data-cy="listing-item-image-source"]');
        const imageUrl = await imgEl?.getAttribute('src');

        const locationEl = await card.$('p[class*="e1cuc5p50"]');
        const location = await locationEl?.innerText().catch(() => null);

        // Generate ID from URL if possible
        // https://www.otodom.pl/pl/oferta/mieszkanie-2-pokoje-42m2-warszawa-wola-ID4pKxY
        // ID is 4pKxY
        let externalId = 'unknown';
        const urlParts = offerUrl.split('-');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart.includes('ID')) {
             externalId = lastPart; // might need cleaning if .html is there
        } else {
             externalId = Buffer.from(offerUrl).toString('base64'); // Fallback
        }

        if (title && offerUrl) {
          offers.push({
            externalId,
            title,
            price: priceText || 'N/A',
            currency: 'PLN', // Otodom is mostly PLN
            url: offerUrl,
            imageUrl: imageUrl || null,
            location: location || null,
            source: 'OTODOM'
          });
        }
      } catch (e) {
        console.error('Error scraping Otodom card', e);
      }
    }

    return offers;
  }
}
