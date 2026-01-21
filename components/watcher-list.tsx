'use client'

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { storage } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';

interface Watcher {
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    lastRunAt: string | null;
    _count: { offers: number };
}

export function WatcherList({ watchers }: { watchers: Watcher[] }) {
    const queryClient = useQueryClient();

    const handleToggle = async (id: string) => {
        storage.toggleWatcher(id);
        queryClient.invalidateQueries({ queryKey: ['watchers'] });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        storage.deleteWatcher(id);
        queryClient.invalidateQueries({ queryKey: ['watchers'] });
        queryClient.invalidateQueries({ queryKey: ['offers'] });
    };

    if (watchers.length === 0) {
        return <div className="text-muted-foreground text-sm font-serif italic text-center py-8">No watchers yet. Add one to start.</div>;
    }

    return (
        <div className="space-y-3">
            {watchers.map((watcher) => (
                <Card key={watcher.id} className={cn("p-5 bg-card border-border transition-all shadow-sm hover:shadow-md", !watcher.isActive && "opacity-50 grayscale")}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-serif font-bold text-foreground leading-tight line-clamp-1" title={watcher.name}>{watcher.name}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {watcher.lastRunAt
                                    ? `Last check: ${formatDistanceToNow(new Date(watcher.lastRunAt))} ago`
                                    : 'Never active'}
                            </p>
                        </div>
                        {watcher._count.offers > 0 && (
                            <Badge variant="secondary" className="font-sans text-[10px] h-5 px-1.5">{watcher._count.offers}</Badge>
                        )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => window.open(watcher.url, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "h-8 w-8",
                                watcher.isActive ? "text-primary hover:text-primary/80 hover:bg-primary/5" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => handleToggle(watcher.id)}
                        >
                            {watcher.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleDelete(watcher.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
