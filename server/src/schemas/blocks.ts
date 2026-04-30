import { z } from 'zod';

export const blockUserBodySchema = z.object({
  blockedId: z.string().min(1),
});
