import { BaseScraper } from './base.js';
import { ScrapedOffer } from '../types.js';

export class OtomotoScraper extends BaseScraper {
  async scrape(url: string): Promise<ScrapedOffer[]> {
    if (!this.browser) await this.initialize();
    
    console.log(`[Otomoto] Navigating to ${url}`);
    await this.navigate(url);
    
    // Handle cookie consent
    try {
      const cookieButton = await this.page?.$('button#onetrust-accept-btn-handler');
      if (cookieButton) await cookieButton.click();
    } catch (e) { /* Ignore */ }

    await this.page?.waitForSelector('article[data-id]', { timeout: 10000 });

    const offers: ScrapedOffer[] = [];
    if (!this.page) return [];

    const cards = await this.page.$$('article[data-id]');
    console.log(`[Otomoto] Found ${cards.length} cards`);

    for (const card of cards) {
      try {
        const id = await card.getAttribute('data-id');
        if (!id) continue;

        const titleEl = await card.$('h2 a');
        if (!titleEl) continue;

        const title = await titleEl.innerText();
        const offerUrl = await titleEl.getAttribute('href');

        const priceEl = await card.$('h3');
        const priceText = await priceEl?.innerText().catch(() => 'N/A');

        const imgEl = await card.$('img');
        const imageUrl = await imgEl?.getAttribute('src');

        if (id && title && offerUrl) {
          offers.push({
            externalId: id,
            title: title,
            price: priceText || 'N/A',
            currency: 'PLN',
            url: offerUrl.startsWith('http') ? offerUrl : `https://www.otomoto.pl${offerUrl}`,
            imageUrl: imageUrl || null,
            location: null,
            source: 'OTOMOTO'
          });
        }
      } catch (e) {
        console.error('[Otomoto] Error scraping card', e);
      }
    }

    return offers;
  }
}
