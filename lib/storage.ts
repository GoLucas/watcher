'use client'

export interface Watcher {
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    lastRunAt: string | null;
}

export interface Offer {
    id: string;
    externalId: string;
    title: string;
    url: string;
    price: string | null;
    location: string | null;
    imageUrl: string | null;
    source: string;
    isSeen: boolean;
    isFavorite: boolean;
    createdAt: string;
    watcherId: string;
}

const WATCHERS_KEY = 'watcher_v1_watchers'
const OFFERS_KEY = 'watcher_v1_offers'

export const storage = {
    getWatchers: (): Watcher[] => {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem(WATCHERS_KEY)
        return data ? JSON.parse(data) : []
    },
    saveWatchers: (watchers: Watcher[]) => {
        localStorage.setItem(WATCHERS_KEY, JSON.stringify(watchers))
    },
    addWatcher: (watcher: Omit<Watcher, 'id' | 'isActive' | 'lastRunAt'>) => {
        const watchers = storage.getWatchers()
        const newWatcher: Watcher = {
            ...watcher,
            id: Math.random().toString(36).substring(2, 9),
            isActive: true,
            lastRunAt: null,
        }
        storage.saveWatchers([newWatcher, ...watchers])
        return newWatcher
    },
    deleteWatcher: (id: string) => {
        const watchers = storage.getWatchers().filter(w => w.id !== id)
        storage.saveWatchers(watchers)
        const offers = storage.getOffers().filter(o => o.watcherId !== id)
        storage.saveOffers(offers)
    },
    toggleWatcher: (id: string) => {
        const watchers = storage.getWatchers().map(w => 
            w.id === id ? { ...w, isActive: !w.isActive } : w
        )
        storage.saveWatchers(watchers)
    },
    updateWatcherLastRun: (id: string) => {
        const watchers = storage.getWatchers().map(w => 
            w.id === id ? { ...w, lastRunAt: new Date().toISOString() } : w
        )
        storage.saveWatchers(watchers)
    },
    getWatchersWithCounts: () => {
        const watchers = storage.getWatchers()
        const offersByWatcher = storage.getOffers().reduce((acc, offer) => {
            if (!offer.isSeen) {
                acc[offer.watcherId] = (acc[offer.watcherId] || 0) + 1
            }
            return acc
        }, {} as Record<string, number>)

        return watchers.map(w => ({
            ...w,
            _count: { offers: offersByWatcher[w.id] || 0 }
        }))
    },

    getOffers: (): Offer[] => {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem(OFFERS_KEY)
        return data ? JSON.parse(data) : []
    },
    saveOffers: (offers: Offer[]) => {
        localStorage.setItem(OFFERS_KEY, JSON.stringify(offers))
    },
    addOffers: (newOffers: Omit<Offer, 'id' | 'createdAt' | 'isSeen' | 'isFavorite'>[]) => {
        const existingOffers = storage.getOffers()
        const existingIds = new Set(existingOffers.map(o => `${o.externalId}-${o.source}`))
        
        const prepared = newOffers
            .filter(o => !existingIds.has(`${o.externalId}-${o.source}`))
            .map(o => ({
                ...o,
                id: Math.random().toString(36).substring(2, 9),
                createdAt: new Date().toISOString(),
                isSeen: false,
                isFavorite: false,
            }))
        
        const combined = [...prepared, ...existingOffers].slice(0, 1000) // Keep last 1000
        storage.saveOffers(combined)
        return prepared.length
    },
    markOfferSeen: (id: string) => {
        const offers = storage.getOffers().map(o => 
            o.id === id ? { ...o, isSeen: true } : o
        )
        storage.saveOffers(offers)
    },
    toggleOfferFavorite: (id: string) => {
        const offers = storage.getOffers().map(o => 
            o.id === id ? { ...o, isFavorite: !o.isFavorite } : o
        )
        storage.saveOffers(offers)
    }
}
