import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createMemoryBodySchema,
  createMemoryItemBodySchema,
  updateMemoryBodySchema,
  updateMemoryItemBodySchema,
} from '../schemas/memories.js';

type CreateMemoryBody = z.infer<typeof createMemoryBodySchema>;
type UpdateMemoryBody = z.infer<typeof updateMemoryBodySchema>;
type CreateMemoryItemBody = z.infer<typeof createMemoryItemBodySchema>;
type UpdateMemoryItemBody = z.infer<typeof updateMemoryItemBodySchema>;

const memorySelect = {
  id: true,
  userId: true,
  title: true,
  latitude: true,
  longitude: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MemorySelect;

const memoryItemSelect = {
  id: true,
  memoryId: true,
  title: true,
  description: true,
  mediaType: true,
  mediaUrl: true,
  sortOrder: true,
  createdAt: true,
} satisfies Prisma.MemoryItemSelect;

export const memoriesRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const getPrismaErrorCode = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  return null;
};

memoriesRouter.get('/memories', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const memories = await prisma.memory.findMany({
    where: { userId: authUserId },
    select: memorySelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(memories);
});

memoriesRouter.get('/memories/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;

  const memory = await prisma.memory.findUnique({
    where: { id },
    select: memorySelect,
  });

  if (!memory || memory.userId !== authUserId) {
    return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  return res.status(200).json(memory);
});

memoriesRouter.put(
  '/memories/:id',
  validateBody(updateMemoryBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
    const data = req.validatedBody as UpdateMemoryBody;

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

  try {
    const memory = await prisma.memory.delete({
      where: { id, userId: authUserId },
      select: memorySelect,
    });

    return res.status(200).json(memory);
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }

    return errorResponse(res, 400, 'MEMORY_DELETE_FAILED', 'Unable to delete memory');
  }
});

memoriesRouter.get('/memories/:id/items', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;

  const memory = await prisma.memory.findUnique({
    where: { id, userId: authUserId },
    select: { id: true },
  });

  if (!memory) {
    return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  const items = await prisma.memoryItem.findMany({
    where: { memoryId: id },
    select: memoryItemSelect,
    orderBy: { sortOrder: 'asc' },
  });

  return res.status(200).json(items);
});

memoriesRouter.put(
  '/memories/:id/items/:itemId',
  validateBody(updateMemoryItemBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    const data = req.validatedBody as UpdateMemoryItemBody;

    const memory = await prisma.memory.findUnique({
      where: { id, userId: authUserId },
      select: { id: true },
    });

    if (!memory) {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }

    try {
      const item = await prisma.memoryItem.update({
        where: { id: itemId, memoryId: id },
        data,
        select: memoryItemSelect,
      });

      return res.status(200).json(item);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2025') {
        return errorResponse(res, 404, 'MEMORY_ITEM_NOT_FOUND', 'Memory item not found');
      }

      return errorResponse(res, 400, 'MEMORY_ITEM_UPDATE_FAILED', 'Unable to update memory item');
    }
  }
);

memoriesRouter.delete('/memories/:id/items/:itemId', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;
  const itemId = req.params.itemId as string;

  const memory = await prisma.memory.findUnique({
    where: { id, userId: authUserId },
    select: { id: true },
  });

  if (!memory) {
    return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  try {
    const item = await prisma.memoryItem.delete({
      where: { id: itemId, memoryId: id },
      select: memoryItemSelect,
    });

    return res.status(200).json(item);
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'MEMORY_ITEM_NOT_FOUND', 'Memory item not found');
    }

    return errorResponse(res, 400, 'MEMORY_ITEM_DELETE_FAILED', 'Unable to delete memory item');
  }
});

memoriesRouter.post(
  '/memories/:id/items',
  validateBody(createMemoryItemBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
    const body = req.validatedBody as CreateMemoryItemBody;

    const memory = await prisma.memory.findUnique({
      where: { id, userId: authUserId },
      select: { id: true },
    });

    if (!memory) {
      return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }

    try {
      const item = await prisma.memoryItem.create({
        data: {
          memoryId: id,
          title: body.title,
          description: body.description ?? null,
          mediaType: body.mediaType,
          mediaUrl: body.mediaUrl ?? null,
          sortOrder: body.sortOrder,
        },
        select: memoryItemSelect,
      });

      return res.status(201).json(item);
    } catch {
      return errorResponse(res, 400, 'MEMORY_ITEM_CREATE_FAILED', 'Unable to create memory item');
    }
  }
);

memoriesRouter.post(
  '/memories',
  validateBody(createMemoryBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as CreateMemoryBody;

    try {
      const memory = await prisma.memory.create({
        data: {
          userId: authUserId,
          title: body.title,
          latitude: body.latitude,
          longitude: body.longitude,
          visibility: body.visibility,
        },
        select: memorySelect,
      });

      return res.status(201).json(memory);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2003') {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      return errorResponse(res, 400, 'MEMORY_CREATE_FAILED', 'Unable to create memory');
    }
  }
);
