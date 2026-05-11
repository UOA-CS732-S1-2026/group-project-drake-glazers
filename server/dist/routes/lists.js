import express from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { createListBodySchema, createListItemBodySchema, updateListBodySchema, updateListItemBodySchema, } from '../schemas/lists.js';
const listItemSelect = {
    id: true,
    listId: true,
    latitude: true,
    longitude: true,
    notes: true,
    createdAt: true,
};
const listSelect = {
    id: true,
    userId: true,
    name: true,
    description: true,
    createdAt: true,
};
export const listsRouter = express.Router();
const getAuthUserId = (req) => {
    return req.authUserId;
};
const getPrismaErrorCode = (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return error.code;
    }
    return null;
};
listsRouter.get('/lists', async (req, res) => {
    const authUserId = getAuthUserId(req);
    const lists = await prisma.list.findMany({
        where: { userId: authUserId },
        select: listSelect,
        orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(lists);
});
listsRouter.get('/lists/:id', async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
    const list = await prisma.list.findUnique({
        where: { id },
        select: listSelect,
    });
    if (!list || list.userId !== authUserId) {
        return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
    }
    return res.status(200).json(list);
});
listsRouter.put('/lists/:id', validateBody(updateListBodySchema), async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
    const body = req.validatedBody;
    const data = {};
    if (body.name !== undefined)
        data.name = body.name;
    if (body.description !== undefined)
        data.description = body.description;
    try {
        const list = await prisma.list.update({
            where: { id, userId: authUserId },
            data,
            select: listSelect,
        });
        return res.status(200).json(list);
    }
    catch (error) {
        if (getPrismaErrorCode(error) === 'P2025') {
            return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
        }
        return errorResponse(res, 400, 'LIST_UPDATE_FAILED', 'Unable to update list');
    }
});
listsRouter.delete('/lists/:id', async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
    try {
        const list = await prisma.list.delete({
            where: { id, userId: authUserId },
            select: listSelect,
        });
        return res.status(200).json(list);
    }
    catch (error) {
        if (getPrismaErrorCode(error) === 'P2025') {
            return errorResponse(res, 404, 'LIST_NOT_FOUND', 'List not found');
        }
        return errorResponse(res, 400, 'LIST_DELETE_FAILED', 'Unable to delete list');
    }
});
listsRouter.get('/lists/:id/items', async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
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
listsRouter.put('/lists/:id/items/:itemId', validateBody(updateListItemBodySchema), async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
    const itemId = req.params.itemId;
    const body = req.validatedBody;
    const data = {};
    if (body.latitude !== undefined)
        data.latitude = body.latitude;
    if (body.longitude !== undefined)
        data.longitude = body.longitude;
    if (body.notes !== undefined)
        data.notes = body.notes;
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
    }
    catch (error) {
        if (getPrismaErrorCode(error) === 'P2025') {
            return errorResponse(res, 404, 'LIST_ITEM_NOT_FOUND', 'List item not found');
        }
        return errorResponse(res, 400, 'LIST_ITEM_UPDATE_FAILED', 'Unable to update list item');
    }
});
listsRouter.delete('/lists/:id/items/:itemId', async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
    const itemId = req.params.itemId;
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
    }
    catch (error) {
        if (getPrismaErrorCode(error) === 'P2025') {
            return errorResponse(res, 404, 'LIST_ITEM_NOT_FOUND', 'List item not found');
        }
        return errorResponse(res, 400, 'LIST_ITEM_DELETE_FAILED', 'Unable to delete list item');
    }
});
listsRouter.post('/lists/:id/items', validateBody(createListItemBodySchema), async (req, res) => {
    const authUserId = getAuthUserId(req);
    const id = req.params.id;
    const body = req.validatedBody;
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
                notes: body.notes ?? null,
            },
            select: listItemSelect,
        });
        return res.status(201).json(item);
    }
    catch {
        return errorResponse(res, 400, 'LIST_ITEM_CREATE_FAILED', 'Unable to create list item');
    }
});
listsRouter.post('/lists', validateBody(createListBodySchema), async (req, res) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody;
    try {
        const list = await prisma.list.create({
            data: {
                user: { connect: { id: authUserId } },
                name: body.name,
                description: body.description ?? null,
            },
            select: listSelect,
        });
        return res.status(201).json(list);
    }
    catch (error) {
        const code = getPrismaErrorCode(error);
        if (code === 'P2003' || code === 'P2025') {
            return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
        }
        return errorResponse(res, 400, 'LIST_CREATE_FAILED', 'Unable to create list');
    }
});
//# sourceMappingURL=lists.js.map