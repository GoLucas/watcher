'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';

import { storage } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';

export function AddWatcherBtn() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            storage.addWatcher({ name, url });
            queryClient.invalidateQueries({ queryKey: ['watchers'] });

            setOpen(false);
            setUrl('');
            setName('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Watcher
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl font-bold text-foreground">Add New Watcher</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Friendly Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., iPhone 13 Pro"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background border-border"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="url">URL (OLX, Otodom...)</Label>
                        <Input
                            id="url"
                            placeholder="https://www.olx.pl/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="bg-background border-border"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full shadow-md font-sans">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Watcher'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
