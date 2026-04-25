import { z } from 'zod';

const sendFriendRequestBodySchema = z.object({
  toUserId: z.string().min(1),
});

export { sendFriendRequestBodySchema };
