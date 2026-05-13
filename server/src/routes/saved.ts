import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { buildSignedUrlMap } from '../lib/media-utils.js';
import { validateBody } from '../middleware/validateBody.js';

export const savedRouter = express.Router();

const getAuthUserId = (req: Request): string => req.authUserId as string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Guard to prevent cross-user access to saved collections.
async function ensureUserOwnsCollection(collectionId: string, userId: string) {
  const collection = await prisma.savedCollection.findUnique({
    where: { id: collectionId },
  });
  if (!collection || collection.userId !== userId) return null;
  return collection;
}

// ─── GET /saved/memories ──────────────────────────────────────────────────────
// Returns all { memoryId, collectionId } pairs for the authed user.
// Clients derive bookmark Set<memoryId> and per-collection checkmarks
// (Map<memoryId, collectionId[]>) from this single response — no N+1 calls.

savedRouter.get('/saved/memories', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);

  const items = await prisma.savedMemory.findMany({
    where: { collection: { userId } },
    select: { memoryId: true, collectionId: true },
  });

  return res.status(200).json(items);
});

// ─── GET /saved/collections ───────────────────────────────────────────────────

savedRouter.get('/saved/collections', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);

  const count = await prisma.savedCollection.count({ where: { userId } });
  if (count === 0) {
    await prisma.savedCollection.create({
      data: { userId, name: 'Saved', isDefault: true },
    });
  }

  const collections = await prisma.savedCollection.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { savedAt: 'desc' },
        select: {
          memory: {
            select: {
              media: {
                where: { mediaType: 'image' },
                orderBy: { createdAt: 'asc' as const },
                take: 1,
                select: { mediaPath: true },
              },
            },
          },
        },
      },
    },
  });

  const coverPaths = collections.flatMap((c) =>
    c.items.flatMap((i) => i.memory.media.map((m) => m.mediaPath))
  );
  const signedUrlMap = await buildSignedUrlMap(coverPaths);

  const result = collections.map((c) => ({
    id: c.id,
    name: c.name,
    isDefault: c.isDefault,
    createdAt: c.createdAt,
    count: c._count.items,
    coverImages: c.items
      .flatMap((i) => i.memory.media.map((m) => signedUrlMap.get(m.mediaPath) ?? null))
      .filter((url): url is string => url !== null),
  }));

  return res.status(200).json(result);
});

// ─── POST /saved/collections ──────────────────────────────────────────────────

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
});

savedRouter.post(
  '/saved/collections',
  validateBody(createCollectionSchema),
  async (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const { name } = req.body as z.infer<typeof createCollectionSchema>;

    const collection = await prisma.savedCollection.create({
      data: { userId, name },
      select: { id: true, name: true, isDefault: true, createdAt: true },
    });

    return res.status(201).json(collection);
  }
);

// ─── POST /saved/collections/:id/memories ─────────────────────────────────────

const saveMemorySchema = z.object({
  memoryId: z.string().min(1),
});

savedRouter.post(
  '/saved/collections/:id/memories',
  validateBody(saveMemorySchema),
  async (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const collectionId = req.params['id'] as string;
    const { memoryId } = req.body as z.infer<typeof saveMemorySchema>;

    const collection = await ensureUserOwnsCollection(collectionId, userId);
    if (!collection) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Collection not found');
    }

    const memoryExists = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { id: true },
    });
    if (!memoryExists) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Memory not found');
    }

    try {
      const saved = await prisma.savedMemory.create({
        data: { collectionId, memoryId },
        select: { id: true, collectionId: true, memoryId: true, savedAt: true },
      });
      return res.status(201).json(saved);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return errorResponse(res, 409, 'ALREADY_SAVED', 'Memory already saved to this collection');
      }
      throw err;
    }
  }
);

// ─── DELETE /saved/collections/:id/memories/:memoryId ────────────────────────

savedRouter.delete(
  '/saved/collections/:id/memories/:memoryId',
  async (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const collectionId = req.params['id'] as string;
    const memoryId = req.params['memoryId'] as string;

    const collection = await ensureUserOwnsCollection(collectionId, userId);
    if (!collection) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Collection not found');
    }

    try {
      await prisma.savedMemory.delete({
        where: {
          collectionId_memoryId: { collectionId, memoryId },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return errorResponse(res, 404, 'NOT_FOUND', 'Saved memory not found');
      }
      throw err;
    }

    return res.status(204).send();
  }
);

// ─── GET /saved/collections/:id ───────────────────────────────────────────────

savedRouter.get('/saved/collections/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const collectionId = req.params['id'] as string;

  const collection = await ensureUserOwnsCollection(collectionId, userId);
  if (!collection) {
    return errorResponse(res, 404, 'NOT_FOUND', 'Collection not found');
  }

  type SavedItem = {
    memory: {
      id: string;
      userId: string;
      title: string;
      description: string | null;
      relativeArea: string | null;
      latitude: number;
      longitude: number;
      visibility: string;
      createdAt: Date;
      media: { mediaPath: string; mediaType: string }[];
      user: { profile: { displayName: string; avatarUrl: string | null } | null };
    };
  };

  const savedItems: SavedItem[] = (await prisma.savedMemory.findMany({
    where: { collectionId },
    orderBy: { savedAt: 'desc' },
    select: {
      memory: {
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          relativeArea: true,
          latitude: true,
          longitude: true,
          visibility: true,
          createdAt: true,
          media: {
            select: { mediaPath: true, mediaType: true },
            orderBy: { createdAt: 'asc' as const },
            take: 1,
          },
          user: {
            select: {
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  })) as unknown as SavedItem[];

  const paths = savedItems
    .map((i) => i.memory.media[0]?.mediaPath)
    .filter((p): p is string => p != null);
  const signedUrlMap = await buildSignedUrlMap(paths);

  const result = savedItems.map(({ memory: m }) => {
    const firstMedia = m.media[0];
    return {
      id: m.id,
      userId: m.userId,
      title: m.title,
      description: m.description,
      relativeArea: m.relativeArea,
      latitude: m.latitude,
      longitude: m.longitude,
      visibility: m.visibility,
      createdAt: m.createdAt,
      author: m.user.profile?.displayName ?? 'Unknown',
      avatarUrl: m.user.profile?.avatarUrl ?? null,
      imageUrl: firstMedia ? (signedUrlMap.get(firstMedia.mediaPath) ?? null) : null,
      mediaType: firstMedia?.mediaType ?? null,
    };
  });

  return res.status(200).json(result);
});

// ─── DELETE /saved/collections/:id ───────────────────────────────────────────

savedRouter.delete('/saved/collections/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const collectionId = req.params['id'] as string;

  const collection = await ensureUserOwnsCollection(collectionId, userId);
  if (!collection) {
    return errorResponse(res, 404, 'NOT_FOUND', 'Collection not found');
  }

  if (collection.isDefault) {
    return errorResponse(res, 403, 'FORBIDDEN', 'Cannot delete the default collection');
  }

  await prisma.savedCollection.delete({ where: { id: collectionId } });

  return res.status(204).send();
});
