import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { supabase, MEDIA_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '../lib/supabase.js';
import { buildSignedUrlMap } from '../lib/media-utils.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMemoryBodySchema, updateMemoryBodySchema } from '../schemas/memories.js';

type CreateMemoryBody = z.infer<typeof createMemoryBodySchema>;
type UpdateMemoryBody = z.infer<typeof updateMemoryBodySchema>;

const memorySelect = {
  id: true,
  userId: true,
  title: true,
  description: true,
  relativeArea: true,
  latitude: true,
  longitude: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MemorySelect;

const mediaSelect = {
  id: true,
  memoryId: true,
  mediaPath: true,
  mediaType: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

const memoryDetailSelect = {
  ...memorySelect,
  media: { select: mediaSelect, orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.MemorySelect;

export const memoriesRouter = express.Router();

const getAuthUserId = (req: Request): string => req.authUserId as string;

const getPrismaErrorCode = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  return null;
};

// ─── Explore feed: recent public memories from all users ──────────────────────

memoriesRouter.get('/explore', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const memories = await prisma.memory.findMany({
    where: { visibility: 'public' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      ...memorySelect,
      media: {
        select: mediaSelect,
        orderBy: { createdAt: 'asc' as const },
        take: 1,
      },
      user: {
        select: {
          profile: {
            select: { displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  const paths = memories.map((m) => m.media[0]?.mediaPath).filter(Boolean) as string[];
  const signedUrlMap = await buildSignedUrlMap(paths);

  const result = memories.map((m) => {
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

// ─────────────────────────────────────────────────────────────────────────────

memoriesRouter.get('/memories', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const memories = await prisma.memory.findMany({
    where: { userId: authUserId },
    select: {
      ...memorySelect,
      media: {
        select: { mediaPath: true },
        where: { mediaType: 'image' },
        orderBy: { createdAt: 'asc' as const },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const thumbnailPaths = memories.map((m) => m.media[0]?.mediaPath).filter((p): p is string => !!p);

  let signedUrlMap = new Map<string, string>();
  if (thumbnailPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(thumbnailPaths, SIGNED_URL_EXPIRY_SECONDS);
    signedUrlMap = new Map(
      (signedUrls ?? []).map((s) => [s.path as string, s.signedUrl as string])
    );
  }

  return res.status(200).json(
    memories.map(({ media, ...memory }) => ({
      ...memory,
      thumbnailUrl: media[0] ? (signedUrlMap.get(media[0].mediaPath) ?? null) : null,
    }))
  );
});

memoriesRouter.get('/memories/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;

  const memory = await prisma.memory.findUnique({
    where: { id },
    select: memoryDetailSelect,
  });

  if (!memory) {
    return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  if (memory.userId !== authUserId) {
    const ownerId = memory.userId;
    const [userAId, userBId] = [authUserId, ownerId].sort() as [string, string];

    const [block, friendship] = await Promise.all([
      prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: authUserId, blockedId: ownerId },
            { blockerId: ownerId, blockedId: authUserId },
          ],
        },
        select: { id: true },
      }),
      prisma.friendship.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
        select: { id: true },
      }),
    ]);

    if (block) {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }

    const canAccess =
      memory.visibility === 'public' || (memory.visibility === 'friends_only' && !!friendship);

    if (!canAccess) {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }
  }

  if (memory.media.length === 0) {
    return res.status(200).json({ ...memory, media: [] });
  }

  const paths = memory.media.map((m) => m.mediaPath);
  const { data: signedUrls, error: signedUrlsError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

  if (signedUrlsError) {
    return errorResponse(res, 500, 'MEDIA_SIGNING_FAILED', 'Unable to generate signed media URLs');
  }

  const signedUrlMap = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  return res.status(200).json({
    ...memory,
    media: memory.media.map((m) => ({ ...m, signedUrl: signedUrlMap.get(m.mediaPath) ?? null })),
  });
});

memoriesRouter.put(
  '/memories/:id',
  validateBody(updateMemoryBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
    const body = req.validatedBody as UpdateMemoryBody;

    const data: Prisma.MemoryUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.relativeArea !== undefined) data.relativeArea = body.relativeArea;
    if (body.latitude !== undefined) data.latitude = body.latitude;
    if (body.longitude !== undefined) data.longitude = body.longitude;
    if (body.visibility !== undefined) data.visibility = body.visibility;

    try {
      const memory = await prisma.memory.update({
        where: { id, userId: authUserId },
        data,
        select: memorySelect,
      });

      return res.status(200).json(memory);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2025') {
        return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
      }
      return errorResponse(res, 400, 'MEMORY_UPDATE_FAILED', 'Unable to update memory');
    }
  }
);

memoriesRouter.delete('/memories/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;

  // Fetch storage paths before deleting so we can clean up Supabase Storage.
  // Prisma cascade handles the Media rows; we handle the objects.
  const mediaItems = await prisma.media.findMany({
    where: { memoryId: id, memory: { userId: authUserId } },
    select: { mediaPath: true },
  });

  try {
    await prisma.memory.delete({
      where: { id, userId: authUserId },
    });

    if (mediaItems.length > 0) {
      const { error: storageRemoveError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(mediaItems.map((m) => m.mediaPath));

      if (storageRemoveError) {
        console.error('Failed to remove media objects during memory deletion', {
          memoryId: id,
          error: storageRemoveError,
        });
      }
    }

    return res.status(200).json({ id });
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }
    return errorResponse(res, 400, 'MEMORY_DELETE_FAILED', 'Unable to delete memory');
  }
});

// GET /users/:userId/memories - List a user's memories filtered by relationship
// owner → all; friends → public + friends_only; stranger → public only; blocked → 404
memoriesRouter.get('/users/:userId/memories', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const userId = req.params.userId as string;

  if (userId === authUserId) {
    const memories = await prisma.memory.findMany({
      where: { userId: authUserId },
      select: memorySelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(memories);
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');

  const [userAId, userBId] = [authUserId, userId].sort() as [string, string];

  const [block, friendship] = await Promise.all([
    prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: authUserId, blockedId: userId },
          { blockerId: userId, blockedId: authUserId },
        ],
      },
      select: { id: true },
    }),
    prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true },
    }),
  ]);

  if (block) return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');

  const visibilityFilter: Prisma.MemoryWhereInput['visibility'] = friendship
    ? { in: ['public', 'friends_only'] }
    : { equals: 'public' };

  const memories = await prisma.memory.findMany({
    where: { userId, visibility: visibilityFilter },
    select: memorySelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(memories);
});

// GET /api/users/:userId/memories/with-covers
// Same visibility rules as GET /users/:userId/memories but each memory includes a
// signed coverImage URL (first image). Batch-signs all covers in one Supabase call
// so callers don't need per-memory media requests.
const memoryWithCoverSelect = {
  ...memorySelect,
  media: {
    where: { mediaType: 'image' as const },
    select: { mediaPath: true },
    take: 1,
    orderBy: { createdAt: 'asc' as const },
  },
};

type MemoryWithCoverRaw = Prisma.MemoryGetPayload<{ select: typeof memoryWithCoverSelect }>;

async function attachCoverImages(memories: MemoryWithCoverRaw[]) {
  const coverPaths = memories.map((m) => m.media[0]?.mediaPath).filter((p): p is string => !!p);

  let signedUrlMap = new Map<string, string>();
  if (coverPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(coverPaths, SIGNED_URL_EXPIRY_SECONDS);
    signedUrlMap = new Map(
      (signedUrls ?? []).map((s) => [s.path as string, s.signedUrl as string])
    );
  }

  return memories.map(({ media, ...m }) => ({
    ...m,
    coverImage: media[0] ? (signedUrlMap.get(media[0].mediaPath) ?? null) : null,
  }));
}

memoriesRouter.get('/users/:userId/memories/with-covers', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const userId = req.params.userId as string;

  if (userId === authUserId) {
    const memories = await prisma.memory.findMany({
      where: { userId: authUserId },
      select: memoryWithCoverSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(await attachCoverImages(memories));
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!target) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  const [userAId, userBId] = [authUserId, userId].sort() as [string, string];

  const [block, friendship] = await Promise.all([
    prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: authUserId, blockedId: userId },
          { blockerId: userId, blockedId: authUserId },
        ],
      },
      select: { id: true },
    }),
    prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true },
    }),
  ]);

  if (block) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  const visibilityFilter: Prisma.MemoryWhereInput['visibility'] = friendship
    ? { in: ['public', 'friends_only'] }
    : { equals: 'public' };

  const memories = await prisma.memory.findMany({
    where: { userId, visibility: visibilityFilter },
    select: memoryWithCoverSelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(await attachCoverImages(memories));
});

memoriesRouter.post(
  '/memories',
  validateBody(createMemoryBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as CreateMemoryBody;

    try {
      const memory = await prisma.memory.create({
        data: {
          user: { connect: { id: authUserId } },
          title: body.title,
          description: body.description ?? null,
          relativeArea: body.relativeArea ?? null,
          latitude: body.latitude,
          longitude: body.longitude,
          visibility: body.visibility,
          ...(body.memoryDate ? { createdAt: body.memoryDate } : {}),
        },
        select: memorySelect,
      });

      return res.status(201).json(memory);
    } catch (error) {
      const code = getPrismaErrorCode(error);
      if (code === 'P2003' || code === 'P2025') {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }
      return errorResponse(res, 400, 'MEMORY_CREATE_FAILED', 'Unable to create memory');
    }
  }
);
