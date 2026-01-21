'use client'

import { useQuery } from '@tanstack/react-query';
import { WatcherList } from '@/components/watcher-list';
import { OfferFeed } from '@/components/offer-feed';
import { AddWatcherBtn } from '@/components/add-watcher-btn';
import { SyncNowBtn } from '@/components/sync-now-btn';
import { Loader2 } from 'lucide-react';
import { storage } from '@/lib/storage';

export default function Home() {
  const { data: watchers = [], isLoading: isLoadingWatchers } = useQuery({
    queryKey: ['watchers'],
    queryFn: () => storage.getWatchersWithCounts(),
  });

  const { data: offers = [], isLoading: isLoadingOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: () => storage.getOffers(),
  });

  const loading = isLoadingWatchers || isLoadingOffers;

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-primary">
              Watcher AI
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Automated classifieds aggregator (Client-Only)</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncNowBtn />
            <AddWatcherBtn />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your local data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <aside className="lg:col-span-3 lg:sticky lg:top-8 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-serif text-xl font-semibold">Tracking ({watchers.length})</h2>
              </div>
              <WatcherList watchers={watchers as any} />
            </aside>

            <section className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-serif text-xl font-semibold">New Arrivals</h2>
              </div>
              <OfferFeed offers={offers as any} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
