'use server'

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createWatcher(url: string, name: string) {
  try {
      await prisma.watcher.create({
        data: {
          url,
          name,
        },
      });
      revalidatePath('/');
      return { success: true };
  } catch (e) {
      console.error(e);
      return { success: false, error: 'Failed to create watcher' };
  }
}

export async function deleteWatcher(id: string) {
  await prisma.watcher.delete({
    where: { id },
  });
  revalidatePath('/');
}

export async function toggleWatcherStatus(id: string, isActive: boolean) {
  await prisma.watcher.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath('/');
}

export async function getWatchers() {
  const watchers = await prisma.watcher.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { offers: { where: { isSeen: false } } }
      }
    }
  });
  return watchers;
}

export async function getOffers(filter: 'all' | 'unseen' | 'favorites' = 'all') {
  const where: any = {};
  if (filter === 'unseen') where.isSeen = false;
  if (filter === 'favorites') where.isFavorite = true;

  return await prisma.offer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
        watcher: true
    }
  });
}

export async function markSeen(id: string) {
  await prisma.offer.update({
    where: { id },
    data: { isSeen: true }
  });
  revalidatePath('/');
}

export async function toggleFavorite(id: string, currentState: boolean) {
  await prisma.offer.update({
    where: { id },
    data: { isFavorite: !currentState }
  });
  revalidatePath('/');
}
