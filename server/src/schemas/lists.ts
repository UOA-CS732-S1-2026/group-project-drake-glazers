import { z } from 'zod';

export const createListBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).optional(),
});

export const createListItemBodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().trim().max(1000).optional(),
});

export const updateListBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    error: 'At least one field must be provided',
  });
