import express from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { supabase, MEDIA_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '../lib/supabase.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { uploadUrlBodySchema, confirmUploadBodySchema } from '../schemas/media.js';

type UploadUrlBody = z.infer<typeof uploadUrlBodySchema>;
type ConfirmUploadBody = z.infer<typeof confirmUploadBodySchema>;

const mediaSelect = {
  id: true,
  memoryId: true,
  mediaPath: true,
  mediaType: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

export const mediaRouter = express.Router();

const getAuthUserId = (req: Request): string => req.authUserId as string;

const getPrismaErrorCode = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  return null;
};

const uploadUrlRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.authUserId as string,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many upload URL requests, please try again later',
    },
  },
});

// POST /api/media/upload-url
// Generates a signed upload URL for direct client-to-Supabase upload.
mediaRouter.post(
  '/media/upload-url',
  uploadUrlRateLimit,
  validateBody(uploadUrlBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const { fileExtension } = req.validatedBody as UploadUrlBody;

    const storagePath = `memories/${authUserId}/${randomUUID()}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      return errorResponse(res, 500, 'UPLOAD_URL_FAILED', 'Failed to generate upload URL');
    }

    return res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
    });
  }
);

// POST /api/memories/:memoryId/media
// Confirms a completed upload and creates the Media row.
mediaRouter.post(
  '/memories/:memoryId/media',
  validateBody(confirmUploadBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const memoryId = req.params.memoryId as string;
    const { mediaPath, mediaType } = req.validatedBody as ConfirmUploadBody;

    if (!mediaPath.startsWith(`memories/${authUserId}/`)) {
      return errorResponse(
        res,
        400,
        'INVALID_MEDIA_PATH',
        'Media path does not belong to the authenticated user'
      );
    }

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { userId: true },
    });

    if (!memory || memory.userId !== authUserId) {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }

    try {
      const media = await prisma.media.create({
        data: {
          memory: { connect: { id: memoryId } },
          mediaPath,
          mediaType,
        },
        select: mediaSelect,
      });

      return res.status(201).json(media);
    } catch {
      return errorResponse(res, 400, 'MEDIA_CREATE_FAILED', 'Unable to create media record');
    }
  }
);

// DELETE /api/media/:id
// Removes the Media row and deletes the object from Supabase Storage.
mediaRouter.delete('/media/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;

  const media = await prisma.media.findUnique({
    where: { id },
    select: {
      ...mediaSelect,
      memory: { select: { userId: true } },
    },
  });

  if (!media || media.memory.userId !== authUserId) {
    return errorResponse(res, 404, 'MEDIA_NOT_FOUND', 'Media not found');
  }

  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([media.mediaPath]);

  if (storageError) {
    return errorResponse(res, 500, 'MEDIA_DELETE_FAILED', 'Failed to delete media from storage');
  }

  try {
    await prisma.media.delete({ where: { id } });
    return res.status(200).json({ id });
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'MEDIA_NOT_FOUND', 'Media not found');
    }
    return errorResponse(res, 400, 'MEDIA_DELETE_FAILED', 'Unable to delete media record');
  }
});

// GET /api/memories/:memoryId/media
// Lists all media for a memory with short-lived signed read URLs.
mediaRouter.get('/memories/:memoryId/media', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const memoryId = req.params.memoryId as string;

  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    select: { userId: true },
  });

  if (!memory || memory.userId !== authUserId) {
    return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  const mediaItems = await prisma.media.findMany({
    where: { memoryId },
    select: mediaSelect,
    orderBy: { createdAt: 'asc' },
  });

  if (mediaItems.length === 0) {
    return res.status(200).json([]);
  }

  const paths = mediaItems.map((m) => m.mediaPath);
  const { data: signedUrls, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !signedUrls) {
    return errorResponse(res, 500, 'SIGNED_URL_FAILED', 'Failed to generate signed URLs');
  }

  const signedUrlMap = new Map(signedUrls.map((s) => [s.path, s.signedUrl]));

  const result = mediaItems.map((item) => ({
    ...item,
    signedUrl: signedUrlMap.get(item.mediaPath) ?? null,
  }));

  return res.status(200).json(result);
});
