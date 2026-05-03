import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { upsertDeviceTokenBodySchema } from '../schemas/deviceTokens.js';

type UpsertDeviceTokenBody = {
  token: string;
  platform?: 'ios' | 'android' | 'web';
  timeZone?: string;
};

const deviceTokenSelect = {
  id: true,
  token: true,
  platform: true,
  timeZone: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DeviceTokenSelect;

export const deviceTokensRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

deviceTokensRouter.post(
  '/device-tokens',
  validateBody(upsertDeviceTokenBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as UpsertDeviceTokenBody;

    try {
      const deviceToken = await prisma.deviceToken.upsert({
        where: { token: body.token },
        create: {
          userId: authUserId,
          token: body.token,
          platform: body.platform ?? null,
          timeZone: body.timeZone ?? null,
          lastSeenAt: new Date(),
        },
        update: {
          userId: authUserId,
          platform: body.platform ?? null,
          timeZone: body.timeZone ?? null,
          lastSeenAt: new Date(),
        },
        select: deviceTokenSelect,
      });

      return res.status(200).json(deviceToken);
    } catch {
      return errorResponse(res, 400, 'DEVICE_TOKEN_UPSERT_FAILED', 'Unable to save device token');
    }
  }
);
