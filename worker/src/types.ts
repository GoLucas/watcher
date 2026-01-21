export interface ScrapedOffer {
  externalId: string;
  title: string;
  price: string;
  currency: string;
  url: string;
  imageUrl: string | null;
  location: string | null;
  source: string;
}

export interface WatcherConfig {
  url: string;
  name: string;
}
