import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { upsertDeviceTokenBodySchema } from '../schemas/deviceTokens.js';
const deviceTokenSelect = {
    id: true,
    token: true,
    platform: true,
    timeZone: true,
    lastSeenAt: true,
    createdAt: true,
    updatedAt: true,
};
export const deviceTokensRouter = express.Router();
const getAuthUserId = (req) => {
    return req.authUserId;
};
deviceTokensRouter.post('/device-tokens', validateBody(upsertDeviceTokenBodySchema), async (req, res) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody;
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
    }
    catch {
        return errorResponse(res, 400, 'DEVICE_TOKEN_UPSERT_FAILED', 'Unable to save device token');
    }
});
//# sourceMappingURL=deviceTokens.js.map