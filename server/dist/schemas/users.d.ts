import { z } from 'zod';
export declare const createUserBodySchema: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
export declare const updateUserBodySchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodEmail>;
}, z.core.$strip>;
export declare const upsertUserProfileBodySchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodURL>;
}, z.core.$strip>;
//# sourceMappingURL=users.d.ts.map