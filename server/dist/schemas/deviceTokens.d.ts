import { z } from 'zod';
export declare const upsertDeviceTokenBodySchema: z.ZodObject<{
    token: z.ZodString;
    platform: z.ZodOptional<z.ZodEnum<{
        ios: "ios";
        android: "android";
        web: "web";
    }>>;
    timeZone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=deviceTokens.d.ts.map