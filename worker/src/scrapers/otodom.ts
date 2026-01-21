import { BaseScraper } from './base.js';
import { ScrapedOffer } from '../types.js';

export class OtodomScraper extends BaseScraper {
  async scrape(url: string): Promise<ScrapedOffer[]> {
    if (!this.browser) await this.initialize();
    
    console.log(`[Otodom] Navigating to ${url}`);
    await this.navigate(url);
    
    // Handle cookie consent
    try {
      const cookieButton = await this.page?.$('button#onetrust-accept-btn-handler');
      if (cookieButton) await cookieButton.click();
    } catch (e) { /* Ignore */ }

    await this.page?.waitForSelector('[data-cy="search.listing"]', { timeout: 10000 });

    const offers: ScrapedOffer[] = [];
    if (!this.page) return [];

    const cards = await this.page.$$('[data-cy="listing-item"]');
    console.log(`[Otodom] Found ${cards.length} cards`);

    for (const card of cards) {
      try {
        const titleEl = await card.$('[data-cy="listing-item-title"]');
        const title = await titleEl?.innerText();
        
        const priceEl = await card.$('span[class*="eanmlll1"]'); 
        const priceText = await priceEl?.innerText().catch(() => 'N/A');
        
        const linkEl = await card.$('a[data-cy="listing-item-link"]');
        let offerUrl = await linkEl?.getAttribute('href');
        if (offerUrl && !offerUrl.startsWith('http')) {
          offerUrl = `https://www.otodom.pl${offerUrl}`;
        }
        
        const imgEl = await card.$('img');
        const imageUrl = await imgEl?.getAttribute('src');

        const locationEl = await card.$('p[class*="css-1dvtw4c"]'); 
        const location = await locationEl?.innerText().catch(() => null);

        const id = offerUrl?.match(/ID([a-zA-Z0-9]+)/)?.[1] || offerUrl?.split('/').pop() || null;
        
        if (id && title && offerUrl) {
          offers.push({
            externalId: id,
            title: title,
            price: priceText || 'N/A',
            currency: 'PLN',
            url: offerUrl,
            imageUrl: imageUrl || null,
            location: location || null,
            source: 'OTODOM'
          });
        }
      } catch (e) {
        console.error('[Otodom] Error scraping card', e);
      }
    }

    return offers;
  }
}
