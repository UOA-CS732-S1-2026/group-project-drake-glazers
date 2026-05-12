import { z } from 'zod';
export declare const clerkWebhookEventSchema: z.ZodObject<{
    type: z.ZodEnum<{
        "user.created": "user.created";
        "user.updated": "user.updated";
        "user.deleted": "user.deleted";
    }>;
    data: z.ZodObject<{
        id: z.ZodString;
        email_addresses: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            email_address: z.ZodOptional<z.ZodEmail>;
        }, z.core.$loose>>>;
        primary_email_address_id: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$loose>;
export type ClerkWebhookEvent = z.infer<typeof clerkWebhookEventSchema>;
//# sourceMappingURL=webhooks.d.ts.map