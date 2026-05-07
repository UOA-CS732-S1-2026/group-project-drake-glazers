import { z } from 'zod';

export const createMemoryBodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).optional(),
  relativeArea: z.string().trim().max(255).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  visibility: z.enum(['public', 'friends_only', 'private']),
});

export const updateMemoryBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).nullish(),
    relativeArea: z.string().trim().max(255).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    visibility: z.enum(['public', 'friends_only', 'private']).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.relativeArea !== undefined ||
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.visibility !== undefined,
    { error: 'At least one field must be provided' }
  );
