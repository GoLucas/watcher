'use client'

const PROXY_URL = 'https://api.allorigins.win/raw?url=';

export interface ScrapedOffer {
  externalId: string;
  title: string;
  price: string;
  url: string;
  imageUrl: string | null;
  source: string;
  location: string | null;
}

export async function scrapeUrl(url: string): Promise<ScrapedOffer[]> {
  const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Proxy error');
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (url.includes('olx.pl')) {
      return parseOlx(doc);
    } else if (url.includes('otodom.pl')) {
      return parseOtodom(doc);
    }
    
    return [];
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}

function parseOlx(doc: Document): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  const cards = doc.querySelectorAll('div[data-testid="l-card"]');
  
  cards.forEach(card => {
    const id = card.getAttribute('id');
    const title = card.querySelector('h4')?.textContent;
    const price = card.querySelector('p[data-testid="ad-price"]')?.textContent;
    const link = card.querySelector('a')?.getAttribute('href');
    const img = card.querySelector('img');
    
    let imageUrl = img?.getAttribute('src');
    const srcset = img?.getAttribute('srcset');
    if (srcset) {
      const candidates = srcset.split(',').map(s => s.trim().split(' '));
      if (candidates.length > 0) {
        imageUrl = candidates[candidates.length - 1][0];
      }
    }

    if (id && title && link) {
      offers.push({
        externalId: id,
        title: title.trim(),
        price: price?.trim() || 'N/A',
        url: link.startsWith('http') ? link : `https://www.olx.pl${link}`,
        imageUrl: imageUrl || null,
        source: 'OLX',
        location: null
      });
    }
  });
  
  return offers;
}

function parseOtodom(doc: Document): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  // Basic Otodom parsing (might need more robust selectors as they use CSS modules often)
  const cards = doc.querySelectorAll('article[data-testid="listing-item"]');
  
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent;
    const price = card.querySelector('p[data-testid="listing-item-price"]')?.textContent;
    const link = card.querySelector('a')?.getAttribute('href');
    const img = card.querySelector('img');
    const id = link?.split('-').pop() || Math.random().toString();

    if (title && link) {
      offers.push({
        externalId: id,
        title: title.trim(),
        price: price?.trim() || 'N/A',
        url: link.startsWith('http') ? link : `https://www.otodom.pl${link}`,
        imageUrl: img?.getAttribute('src') || null,
        source: 'OTODOM',
        location: null
      });
    }
  });
  
  return offers;
}
