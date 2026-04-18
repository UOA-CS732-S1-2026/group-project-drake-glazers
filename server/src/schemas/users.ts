const { z } = require("zod") as typeof import("zod");

const createUserBodySchema = z.object({
  email: z.email().max(255),
});

const updateUserBodySchema = z
  .object({
    email: z.email().max(255).optional(),
  })
  .refine((data) => data.email !== undefined, {
    error: "At least one field must be provided",
  });

const upsertUserProfileBodySchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    bio: z.string().trim().max(500).optional(),
    avatarUrl: z.url().max(2048).optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.bio !== undefined ||
      data.avatarUrl !== undefined,
    {
      error: "At least one field must be provided",
    },
  );

module.exports = {
  createUserBodySchema,
  updateUserBodySchema,
  upsertUserProfileBodySchema,
};
