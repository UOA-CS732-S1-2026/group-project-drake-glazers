const express = require("express") as typeof import("express");
const { Prisma } = require("@prisma/client") as {
  Prisma: typeof import("@prisma/client").Prisma;
};
const { prisma } = require("../lib/prisma") as {
  prisma: import("@prisma/client").PrismaClient;
};
const { validateBody } = require("../middleware/validateBody") as {
  validateBody: (
    schema: import("zod").ZodType,
  ) => import("express").RequestHandler;
};
const {
  createUserBodySchema,
  updateUserBodySchema,
  upsertUserProfileBodySchema,
} = require("../schemas/users") as {
  createUserBodySchema: import("zod").ZodType;
  updateUserBodySchema: import("zod").ZodType;
  upsertUserProfileBodySchema: import("zod").ZodType;
};

type Request = import("express").Request;
type Response = import("express").Response;
type CreateUserBody = { email: string };
type UpdateUserBody = { email?: string };
type UpdateUserProfileBody = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
};

const userSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies import("@prisma/client").Prisma.UserSelect;

const userProfileSelect = {
  id: true,
  userId: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
} satisfies import("@prisma/client").Prisma.UserProfileSelect;

const usersRouter = express.Router();

usersRouter.post(
  "/users",
  validateBody(createUserBodySchema),
  async (req: Request, res: Response) => {
    if (!req.authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.validatedBody as CreateUserBody;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: req.authUserId },
        select: userSelect,
      });

      if (existingUser) {
        if (existingUser.email === body.email) {
          return res.status(200).json(existingUser);
        }

        const updatedUser = await prisma.user.update({
          where: { id: req.authUserId },
          data: { email: body.email },
          select: userSelect,
        });

        return res.status(200).json(updatedUser);
      }

      const createdUser = await prisma.user.create({
        data: {
          id: req.authUserId,
          email: body.email,
        },
        select: userSelect,
      });

      return res.status(201).json(createdUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(400).json({
          error: "User with this email already exists",
        });
      }

      return res.status(400).json({
        error: "Unable to create or sync user",
      });
    }
  },
);

usersRouter.get("/users/me", async (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.authUserId },
    select: userSelect,
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json(user);
});

usersRouter.put(
  "/users/me",
  validateBody(updateUserBodySchema),
  async (req: Request, res: Response) => {
    if (!req.authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.validatedBody as UpdateUserBody;
    const email = body.email;

    if (email === undefined) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.authUserId },
        data: { email },
        select: userSelect,
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return res.status(404).json({ error: "User not found" });
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(400).json({
          error: "User with this email already exists",
        });
      }

      return res.status(400).json({
        error: "Unable to update user",
      });
    }
  },
);

usersRouter.delete("/users/me", async (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const deletedUser = await prisma.user.delete({
      where: { id: req.authUserId },
      select: userSelect,
    });

    return res.status(200).json(deletedUser);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2014")
    ) {
      return res.status(400).json({
        error: "Cannot delete user with related records",
      });
    }

    return res.status(400).json({
      error: "Unable to delete user",
    });
  }
});

usersRouter.get("/users/me/profile", async (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.authUserId },
    select: userProfileSelect,
  });

  if (!profile) {
    return res.status(404).json({ error: "User profile not found" });
  }

  return res.status(200).json(profile);
});

usersRouter.put(
  "/users/me/profile",
  validateBody(upsertUserProfileBodySchema),
  async (req: Request, res: Response) => {
    if (!req.authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.validatedBody as UpdateUserProfileBody;
    const data: import("@prisma/client").Prisma.UserProfileUpdateInput = {};

    if (body.displayName !== undefined) {
      data.displayName = body.displayName;
    }

    if (body.bio !== undefined) {
      data.bio = body.bio;
    }

    if (body.avatarUrl !== undefined) {
      data.avatarUrl = body.avatarUrl;
    }

    try {
      const updatedProfile = await prisma.userProfile.update({
        where: { userId: req.authUserId },
        data,
        select: userProfileSelect,
      });

      return res.status(200).json(updatedProfile);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return res.status(404).json({ error: "User profile not found" });
      }

      return res.status(400).json({
        error: "Unable to update user profile",
      });
    }
  },
);

module.exports = { usersRouter };
