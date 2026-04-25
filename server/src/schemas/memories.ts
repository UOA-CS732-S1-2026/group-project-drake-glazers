import { z } from 'zod';

export const createMemoryBodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  visibility: z.enum(['public', 'private']),
});
