import { z } from 'zod';

const ALLOWED_EXTENSIONS: Record<'image' | 'video' | 'voice_note', string[]> = {
  image: ['jpg', 'jpeg', 'png', 'heic', 'webp'],
  video: ['mp4', 'mov'],
  voice_note: ['m4a', 'mp3', 'wav'],
};

export const uploadUrlBodySchema = z
  .object({
    mediaType: z.enum(['image', 'video', 'voice_note']),
    fileExtension: z.string().trim().toLowerCase(),
  })
  .superRefine((data, ctx) => {
    const allowed = ALLOWED_EXTENSIONS[data.mediaType];
    if (!allowed.includes(data.fileExtension)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid extension for ${data.mediaType}. Allowed: ${allowed.join(', ')}`,
        path: ['fileExtension'],
      });
    }
  });

export const confirmUploadBodySchema = z.object({
  mediaPath: z.string().trim().min(1),
  mediaType: z.enum(['image', 'video', 'voice_note']),
});
