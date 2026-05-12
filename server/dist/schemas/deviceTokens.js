import { z } from 'zod';
export const upsertDeviceTokenBodySchema = z.object({
    token: z.string().trim().min(1),
    platform: z.enum(['ios', 'android', 'web']).optional(),
    timeZone: z.string().trim().min(1).optional(),
});
//# sourceMappingURL=deviceTokens.js.map