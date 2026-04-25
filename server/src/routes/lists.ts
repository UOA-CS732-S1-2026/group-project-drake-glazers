import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { createListBodySchema } from '../schemas/lists.js';

type CreateListBody = {
  name: string;
  description?: string;
};

const listSelect = {
  id: true,
  userId: true,
  name: true,
  description: true,
  createdAt: true,
} satisfies Prisma.ListSelect;

export const listsRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const getPrismaErrorCode = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  return null;
};

listsRouter.get('/lists', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const lists = await prisma.list.findMany({
    where: { userId: authUserId },
    select: listSelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(lists);
});

listsRouter.get('/lists/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const { id } = req.params;

  const list = await prisma.list.findUnique({
    where: { id },
    select: listSelect,
  });

  if (!list || list.userId !== authUserId) {
    return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
  }

  return res.status(200).json(list);
});

listsRouter.post(
  '/lists',
  validateBody(createListBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as CreateListBody;

    try {
      const list = await prisma.list.create({
        data: {
          userId: authUserId,
          name: body.name,
          description: body.description,
        },
        select: listSelect,
      });

      return res.status(201).json(list);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2003') {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      return errorResponse(res, 400, 'LIST_CREATE_FAILED', 'Unable to create list');
    }
  }
);
