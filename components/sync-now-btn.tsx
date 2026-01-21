'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { scrapeUrl } from '@/lib/browser-scraper';
import { storage } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';

export function SyncNowBtn() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const queryClient = useQueryClient();

    const handleSync = async () => {
        setLoading(true);
        setResult(null);

        try {
            const watchers = storage.getWatchers().filter(w => w.isActive);
            if (watchers.length === 0) {
                setResult({ success: false, message: 'No active watchers' });
                return;
            }

            let newOffersCount = 0;
            for (const watcher of watchers) {
                try {
                    const scraped = await scrapeUrl(watcher.url);
                    if (scraped.length > 0) {
                        const added = storage.addOffers(scraped.map(o => ({ ...o, watcherId: watcher.id })));
                        newOffersCount += added;
                    }
                    storage.updateWatcherLastRun(watcher.id);
                } catch (e) {
                    console.error(`Failed to scrape ${watcher.name}:`, e);
                }
            }

            setResult({ success: true, message: `Loaded ${newOffersCount} new offers` });

            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ['watchers'] });
            queryClient.invalidateQueries({ queryKey: ['offers'] });

        } catch (err) {
            setResult({ success: false, message: 'Scraping error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={handleSync}
                disabled={loading}
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 text-primary shadow-sm"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Syncing...' : 'Sync Now'}
            </Button>

            {result && (
                <div className={`flex items-center gap-1 text-xs font-medium ${result.success ? 'text-primary' : 'text-destructive'}`}>
                    {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {result.message}
                </div>
            )}
        </div>
    );
}
