const { z } = require("zod") as typeof import("zod");

const sendFriendRequestBodySchema = z.object({
  toUserId: z.string().min(1),
});

module.exports = {
  sendFriendRequestBodySchema,
};
