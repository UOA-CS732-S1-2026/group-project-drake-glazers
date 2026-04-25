import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMemoryBodySchema } from '../schemas/memories.js';

type CreateMemoryBody = {
  title: string;
  latitude: number;
  longitude: number;
  visibility: 'public' | 'private';
};

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
  const { id } = req.params;

  const memory = await prisma.memory.findUnique({
    where: { id },
    select: memorySelect,
  });

  if (!memory || memory.userId !== authUserId) {
    return errorResponse(res, 404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  return res.status(200).json(memory);
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
