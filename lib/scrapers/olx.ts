import { BaseScraper } from './base';
import { ScrapedOffer } from './types';

export class OlxScraper extends BaseScraper {
  async scrape(url: string): Promise<ScrapedOffer[]> {
    if (!this.browser) await this.initialize();
    
    const offers: ScrapedOffer[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    const maxPages = 5; // Safety limit to avoid infinite loops

    while (hasNextPage && currentPage <= maxPages) {
        // Construct URL with page parameter
        const pageUrl = url.includes('?') ? `${url}&page=${currentPage}` : `${url}?page=${currentPage}`;
        console.log(`Navigating to ${pageUrl}`);
        
        try {
            await this.navigate(pageUrl);
            
            // Handle cookie consent only on first page
            if (currentPage === 1) {
                try {
                    const cookieButton = await this.page?.$('button[id="onetrust-accept-btn-handler"]');
                    if (cookieButton) await cookieButton.click();
                } catch (e) { /* Ignore */ }
            }

            // Scroll down to trigger lazy loading
            await this.page?.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });

            // Check if there are any results
            try {
               await this.page?.waitForSelector('div[data-testid="l-card"]', { timeout: 5000 });
            } catch {
               console.log('No offers found on this page, stopping.');
               hasNextPage = false;
               break;
            }

            if (!this.page) break;
            const cards = await this.page.$$('div[data-testid="l-card"]');
            console.log(`Found ${cards.length} cards on page ${currentPage}`);
            
            if (cards.length === 0) {
                hasNextPage = false;
                break;
            }

            for (const card of cards) {
            try {
                const id = await card.getAttribute('id');
                if (!id) continue;

                const titleParams = await card.$eval('h4', (el) => (el as HTMLElement).innerText).catch(() => null);
                if (!titleParams) continue;
                
                const priceText = await card.$eval('p[data-testid="ad-price"]', (el) => (el as HTMLElement).innerText).catch(() => null);
                
                const linkEl = await card.$('a');
                let offerUrl = await linkEl?.getAttribute('href');
                if (offerUrl && !offerUrl.startsWith('http')) {
                offerUrl = `https://www.olx.pl${offerUrl}`;
                }

                // Better image extraction: try src, then srcset (pick LAST which is usually highest quality), then data-src
                const imgEl = await card.$('img');
                let imageUrl = await imgEl?.getAttribute('src');
                const srcset = await imgEl?.getAttribute('srcset');
                
                if (srcset) {
                     // srcset format: "url size, url size, ..."
                     // We want the last one as it's typically the largest (e.g. 600w)
                     const candidates = srcset.split(',').map(s => s.trim().split(' '));
                     if (candidates.length > 0) {
                         const bestCandidate = candidates[candidates.length - 1][0];
                         if (bestCandidate) {
                             imageUrl = bestCandidate;
                         }
                     }
                }

                if (id && titleParams && offerUrl) {
                offers.push({
                    externalId: id,
                    title: titleParams,
                    price: priceText || 'N/A',
                    currency: priceText ? (priceText.includes('zł') ? 'PLN' : (priceText.includes('€') ? 'EUR' : '')) : '',
                    url: offerUrl,
                    imageUrl: imageUrl || null,
                    location: null,
                    source: 'OLX'
                });
                }
            } catch (e) {
                console.error('Error scraping card', e);
            }
            }
            
            // Check for "Next Page" button availability or just try next index
            // OLX usually handles ?page=X fine even if button is not clicked.
            // But we should stop if we didn't find many cards or if it redirected.
            
            currentPage++;
            // Random sleep between pages
            await new Promise(r => setTimeout(r, 2000));

        } catch (e) {
            console.error(`Error on page ${currentPage}`, e);
            hasNextPage = false;
        }
    }

    return offers;
  }
}
