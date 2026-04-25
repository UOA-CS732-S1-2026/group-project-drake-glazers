import { z } from 'zod';

export const createMemoryBodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  visibility: z.enum(['public', 'private']),
});

export const updateMemoryBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    visibility: z.enum(['public', 'private']).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.visibility !== undefined,
    { error: 'At least one field must be provided' }
  );
