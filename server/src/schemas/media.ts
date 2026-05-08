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

const ALLOWED_AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const avatarUrlBodySchema = z
  .object({
    fileExtension: z.string().trim().toLowerCase(),
  })
  .superRefine((data, ctx) => {
    if (!ALLOWED_AVATAR_EXTENSIONS.includes(data.fileExtension)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid extension for avatar. Allowed: ${ALLOWED_AVATAR_EXTENSIONS.join(', ')}`,
        path: ['fileExtension'],
      });
    }
  });

export const confirmUploadBodySchema = z.object({
  mediaPath: z.string().trim().min(1),
  mediaType: z.enum(['image', 'video', 'voice_note']),
});
