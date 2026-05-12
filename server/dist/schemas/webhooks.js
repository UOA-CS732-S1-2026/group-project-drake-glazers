import { z } from 'zod';
export const clerkWebhookEventSchema = z.looseObject({
    type: z.enum(['user.created', 'user.updated', 'user.deleted']),
    data: z.looseObject({
        id: z.string(),
        email_addresses: z
            .array(z.looseObject({
            id: z.string().optional(),
            email_address: z.email().optional(),
        }))
            .optional(),
        primary_email_address_id: z.string().optional(),
    }),
});
//# sourceMappingURL=webhooks.js.map