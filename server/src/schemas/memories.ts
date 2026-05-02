import { z } from 'zod';

export const createMemoryBodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  visibility: z.enum(['public', 'friends_only', 'private']),
});

export const createMemoryItemBodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).optional(),
  mediaType: z.enum(['image', 'video', 'voice_note']),
  mediaUrl: z.url().max(2048).optional(),
  sortOrder: z.int().min(0),
});

export const updateMemoryItemBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).optional(),
    mediaType: z.enum(['image', 'video', 'voice_note']).optional(),
    mediaUrl: z.url().max(2048).optional(),
    sortOrder: z.int().min(0).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.mediaType !== undefined ||
      data.mediaUrl !== undefined ||
      data.sortOrder !== undefined,
    { error: 'At least one field must be provided' }
  );

export const updateMemoryBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    visibility: z.enum(['public', 'friends_only', 'private']).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.visibility !== undefined,
    { error: 'At least one field must be provided' }
  );
