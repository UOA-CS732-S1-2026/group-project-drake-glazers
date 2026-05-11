import { z } from 'zod';
export declare const uploadUrlBodySchema: z.ZodObject<{
    mediaType: z.ZodEnum<{
        image: "image";
        video: "video";
        voice_note: "voice_note";
    }>;
    fileExtension: z.ZodString;
}, z.core.$strip>;
export declare const avatarUrlBodySchema: z.ZodObject<{
    fileExtension: z.ZodString;
}, z.core.$strip>;
export declare const confirmUploadBodySchema: z.ZodObject<{
    mediaPath: z.ZodString;
    mediaType: z.ZodEnum<{
        image: "image";
        video: "video";
        voice_note: "voice_note";
    }>;
}, z.core.$strip>;
//# sourceMappingURL=media.d.ts.map