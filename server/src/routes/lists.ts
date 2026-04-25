import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createListBodySchema,
  createListItemBodySchema,
  updateListBodySchema,
  updateListItemBodySchema,
} from '../schemas/lists.js';

type UpdateListItemBody = {
  latitude?: number;
  longitude?: number;
  notes?: string;
};

type CreateListItemBody = {
  latitude: number;
  longitude: number;
  notes?: string;
};

type UpdateListBody = {
  name?: string;
  description?: string;
};

type CreateListBody = {
  name: string;
  description?: string;
};

const listItemSelect = {
  id: true,
  listId: true,
  latitude: true,
  longitude: true,
  notes: true,
  createdAt: true,
} satisfies Prisma.ListItemSelect;

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

listsRouter.put(
  '/lists/:id',
  validateBody(updateListBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const { id } = req.params;
    const data = req.validatedBody as UpdateListBody;

    try {
      const list = await prisma.list.update({
        where: { id, userId: authUserId },
        data,
        select: listSelect,
      });

      return res.status(200).json(list);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2025') {
        return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
      }

      return errorResponse(res, 400, 'LIST_UPDATE_FAILED', 'Unable to update list');
    }
  }
);

listsRouter.delete('/lists/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const { id } = req.params;

  try {
    const list = await prisma.list.delete({
      where: { id, userId: authUserId },
      select: listSelect,
    });

    return res.status(200).json(list);
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
    }

    return errorResponse(res, 400, 'LIST_DELETE_FAILED', 'Unable to delete list');
  }
});

listsRouter.get('/lists/:id/items', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const { id } = req.params;

  const list = await prisma.list.findUnique({
    where: { id, userId: authUserId },
    select: { id: true },
  });

  if (!list) {
    return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
  }

  const items = await prisma.listItem.findMany({
    where: { listId: id },
    select: listItemSelect,
    orderBy: { createdAt: 'asc' },
  });

  return res.status(200).json(items);
});

listsRouter.put(
  '/lists/:id/items/:itemId',
  validateBody(updateListItemBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const { id, itemId } = req.params;
    const data = req.validatedBody as UpdateListItemBody;

    const list = await prisma.list.findUnique({
      where: { id, userId: authUserId },
      select: { id: true },
    });

    if (!list) {
      return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
    }

    try {
      const item = await prisma.listItem.update({
        where: { id: itemId, listId: id },
        data,
        select: listItemSelect,
      });

      return res.status(200).json(item);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2025') {
        return errorResponse(res, 404, 'LIST_ITEM_NOT_FOUND', 'List item not found');
      }

      return errorResponse(res, 400, 'LIST_ITEM_UPDATE_FAILED', 'Unable to update list item');
    }
  }
);

listsRouter.delete('/lists/:id/items/:itemId', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const { id, itemId } = req.params;

  const list = await prisma.list.findUnique({
    where: { id, userId: authUserId },
    select: { id: true },
  });

  if (!list) {
    return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
  }

  try {
    const item = await prisma.listItem.delete({
      where: { id: itemId, listId: id },
      select: listItemSelect,
    });

    return res.status(200).json(item);
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'LIST_ITEM_NOT_FOUND', 'List item not found');
    }

    return errorResponse(res, 400, 'LIST_ITEM_DELETE_FAILED', 'Unable to delete list item');
  }
});

listsRouter.post(
  '/lists/:id/items',
  validateBody(createListItemBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const { id } = req.params;
    const body = req.validatedBody as CreateListItemBody;

    const list = await prisma.list.findUnique({
      where: { id, userId: authUserId },
      select: { id: true },
    });

    if (!list) {
      return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
    }

    try {
      const item = await prisma.listItem.create({
        data: {
          listId: id,
          latitude: body.latitude,
          longitude: body.longitude,
          notes: body.notes,
        },
        select: listItemSelect,
      });

      return res.status(201).json(item);
    } catch {
      return errorResponse(res, 400, 'LIST_ITEM_CREATE_FAILED', 'Unable to create list item');
    }
  }
);

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
