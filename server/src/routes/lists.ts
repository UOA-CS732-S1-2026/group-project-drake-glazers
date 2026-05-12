import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { supabase, MEDIA_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '../lib/supabase.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createListBodySchema,
  createListItemBodySchema,
  updateListBodySchema,
  updateListItemBodySchema,
} from '../schemas/lists.js';

type CreateListBody = z.infer<typeof createListBodySchema>;
type UpdateListBody = z.infer<typeof updateListBodySchema>;
type CreateListItemBody = z.infer<typeof createListItemBodySchema>;
type UpdateListItemBody = z.infer<typeof updateListItemBodySchema>;

const listItemSelect = {
  id: true,
  listId: true,
  latitude: true,
  longitude: true,
  placeName: true,
  notes: true,
  imagePath: true,
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

const getAuthUserId = (req: Request): string => req.authUserId as string;

const getPrismaErrorCode = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  return null;
};

async function signItemImagePaths<T extends { imagePath: string | null }>(
  items: T[]
): Promise<(Omit<T, 'imagePath'> & { imageUrl: string | null })[]> {
  const paths = items.map((i) => i.imagePath).filter((p): p is string => p !== null);

  let signedUrlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);
    signedUrlMap = new Map(
      (data ?? [])
        .filter((s) => s.path != null && s.signedUrl != null)
        .map((s) => [s.path as string, s.signedUrl as string])
    );
  }

  return items.map(({ imagePath, ...rest }) => ({
    ...rest,
    imageUrl: imagePath ? (signedUrlMap.get(imagePath) ?? null) : null,
  }));
}

listsRouter.get('/lists', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const lists = await prisma.list.findMany({
    where: { userId: authUserId },
    select: {
      ...listSelect,
      items: {
        where: { imagePath: { not: null } },
        select: { imagePath: true },
        orderBy: { createdAt: 'desc' },
        take: 4,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const allPaths = lists.flatMap((l) => l.items.map((i) => i.imagePath!));
  let signedUrlMap = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(allPaths, SIGNED_URL_EXPIRY_SECONDS);
    signedUrlMap = new Map(
      (data ?? [])
        .filter((s) => s.path != null && s.signedUrl != null)
        .map((s) => [s.path as string, s.signedUrl as string])
    );
  }

  return res.status(200).json(
    lists.map(({ items, ...list }) => ({
      ...list,
      coverImages: items.map((i) => signedUrlMap.get(i.imagePath!) ?? null).filter(Boolean),
    }))
  );
});

listsRouter.get('/lists/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params.id as string;

  const list = await prisma.list.findUnique({
    where: { id },
    select: {
      ...listSelect,
      items: {
        where: { imagePath: { not: null } },
        select: { imagePath: true },
        orderBy: { createdAt: 'desc' },
        take: 4,
      },
    },
  });

  if (!list || list.userId !== authUserId) {
    return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
  }

  const paths = list.items.map((i) => i.imagePath!);
  let signedUrlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);
    signedUrlMap = new Map(
      (data ?? [])
        .filter((s) => s.path != null && s.signedUrl != null)
        .map((s) => [s.path as string, s.signedUrl as string])
    );
  }

  const { items, ...listData } = list;
  return res.status(200).json({
    ...listData,
    coverImages: items.map((i) => signedUrlMap.get(i.imagePath!) ?? null).filter(Boolean),
  });
});

listsRouter.put(
  '/lists/:id',
  validateBody(updateListBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
    const body = req.validatedBody as UpdateListBody;
    const data: Prisma.ListUpdateInput = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;

    try {
      const list = await prisma.list.update({
        where: { id, userId: authUserId },
        data,
        select: listSelect,
      });

      return res.status(200).json({ ...list, coverImages: [] });
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
  const id = req.params.id as string;

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
  const id = req.params.id as string;

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

  return res.status(200).json(await signItemImagePaths(items));
});

listsRouter.post(
  '/lists/:id/items',
  validateBody(createListItemBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
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
          list: { connect: { id } },
          latitude: body.latitude,
          longitude: body.longitude,
          placeName: body.placeName ?? null,
          notes: body.notes ?? null,
          imagePath: body.imagePath ?? null,
        },
        select: listItemSelect,
      });

      const [signed] = await signItemImagePaths([item]);
      return res.status(201).json(signed);
    } catch {
      return errorResponse(res, 400, 'LIST_ITEM_CREATE_FAILED', 'Unable to create list item');
    }
  }
);

listsRouter.put(
  '/lists/:id/items/:itemId',
  validateBody(updateListItemBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    const body = req.validatedBody as UpdateListItemBody;
    const data: Prisma.ListItemUpdateInput = {};

    if (body.latitude !== undefined) data.latitude = body.latitude;
    if (body.longitude !== undefined) data.longitude = body.longitude;
    if (body.placeName !== undefined) data.placeName = body.placeName;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.imagePath !== undefined) data.imagePath = body.imagePath;

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

      const [signed] = await signItemImagePaths([item]);
      return res.status(200).json(signed);
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
  const id = req.params.id as string;
  const itemId = req.params.itemId as string;

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
  '/lists',
  validateBody(createListBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as CreateListBody;

    try {
      const list = await prisma.list.create({
        data: {
          user: { connect: { id: authUserId } },
          name: body.name,
          description: body.description ?? null,
        },
        select: listSelect,
      });

      return res.status(201).json({ ...list, coverImages: [] });
    } catch (error) {
      const code = getPrismaErrorCode(error);
      if (code === 'P2003' || code === 'P2025') {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }
      return errorResponse(res, 400, 'LIST_CREATE_FAILED', 'Unable to create list');
    }
  }
);
