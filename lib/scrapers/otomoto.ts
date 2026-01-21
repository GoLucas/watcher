import { BaseScraper } from './base';
import { ScrapedOffer } from './types';

export class OtomotoScraper extends BaseScraper {
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

    // Wait for offers (articles with data-id or data-testid)
    await this.page?.waitForSelector('article[data-id]', { timeout: 10000 });

    const offers: ScrapedOffer[] = [];
    
    if (!this.page) return [];

    const cards = await this.page.$$('article[data-id]');
    
    console.log(`Found ${cards.length} cards`);

    for (const card of cards) {
      try {
        const id = await card.getAttribute('data-id');
        if (!id) continue;

        // Title is usually h2 > a
        const titleEl = await card.$('h2 a');
        if (!titleEl) continue;

        const title = await titleEl.innerText();
        const offerUrl = await titleEl.getAttribute('href');
        
        if (!offerUrl) continue;

        // Price is h3
        const priceEl = await card.$('h3');
        const priceText = await priceEl?.innerText().catch(() => 'N/A');

        const imgEl = await card.$('img');
        const imageUrl = await imgEl?.getAttribute('src');
        
        // Location usually in p or span nested in div below properties
        // It's less standardized, but often text in a span/p with location icon
        // For MVP we can skip location or try a generic extraction
        
        if (title && offerUrl) {
          offers.push({
            externalId: id,
            title,
            price: priceText || 'N/A',
            currency: 'PLN', // Default Assumption
            url: offerUrl,
            imageUrl: imageUrl || null,
            location: null, // difficult to pinpoint generically
            source: 'OTOMOTO'
          });
        }
      } catch (e) {
        // console.error('Error scraping Otomoto card', e);
      }
    }

    return offers;
  }
}
