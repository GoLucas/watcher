'use client'

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Heart, ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import { storage } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';

export function OfferCard({ offer }: { offer: any }) {
    const queryClient = useQueryClient();

    const handleMarkSeen = async () => {
        storage.markOfferSeen(offer.id);
        queryClient.invalidateQueries({ queryKey: ['offers'] });
        queryClient.invalidateQueries({ queryKey: ['watchers'] });
    };

    const handleToggleFavorite = async () => {
        storage.toggleOfferFavorite(offer.id);
        queryClient.invalidateQueries({ queryKey: ['offers'] });
    };

    return (
        <Card className={cn("overflow-hidden bg-card border-border transition-all hover:border-muted-foreground/30 flex flex-col h-full shadow-sm hover:shadow-md",
            !offer.isSeen && "border-l-4 border-l-primary"
        )}>
            <div className="relative aspect-video w-full bg-muted overflow-hidden group">
                {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-serif italic">No Image</div>
                )}

                <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                        size="icon"
                        variant="secondary"
                        className={cn(
                            "h-8 w-8 rounded-full shadow-sm backdrop-blur-md transition-colors",
                            "bg-background/60 hover:bg-background/90 text-foreground",
                            offer.isFavorite && "text-destructive"
                        )}
                        onClick={handleToggleFavorite}
                    >
                        <Heart className={cn("w-4 h-4", offer.isFavorite && "fill-current")} />
                    </Button>
                </div>

                <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-background/80 backdrop-blur-md text-foreground text-[10px] uppercase tracking-wider font-semibold rounded-sm shadow-sm border border-border/50">
                        {formatDistanceToNow(new Date(offer.createdAt))} ago
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg font-bold text-foreground line-clamp-2 leading-tight flex-1" title={offer.title}>
                        {offer.title}
                    </h3>
                </div>

                <div className="text-primary font-serif font-black text-xl mb-2">
                    {offer.price || 'Price N/A'}
                </div>

                {offer.location && (
                    <div className="flex items-center text-muted-foreground text-xs mb-4">
                        <MapPin className="w-3 h-3 mr-1" />
                        {offer.location}
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{offer.source}</span>
                    <div className="flex gap-2">
                        {!offer.isSeen && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-border hover:bg-muted font-sans text-xs"
                                onClick={handleMarkSeen}
                            >
                                <Eye className="w-4 h-4 mr-1" /> Mark Seen
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="h-8 shadow-sm font-sans text-xs"
                            onClick={() => {
                                handleMarkSeen();
                                window.open(offer.url, '_blank');
                            }}
                        >
                            Visit <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
