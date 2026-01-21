'use client'

import { OfferCard } from './offer-card';

interface Offer {
    id: string;
    title: string;
    url: string;
    price: string | null;
    location: string | null;
    imageUrl: string | null;
    source: string;
    isSeen: boolean;
    isFavorite: boolean;
    createdAt: string;
}

export function OfferFeed({ offers }: { offers: Offer[] }) {
    if (offers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500">
                <p>No new offers found.</p>
                <p className="text-sm">Wait for the scraper to run.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
            ))}
        </div>
    );
}
