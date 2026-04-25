const express = require("express") as typeof import("express");
const { Prisma } = require("@prisma/client") as {
  Prisma: typeof import("@prisma/client").Prisma;
};
const { prisma } = require("../lib/prisma") as {
  prisma: import("@prisma/client").PrismaClient;
};
const { errorResponse } = require("../lib/api-response") as {
  errorResponse: (
    res: import("express").Response,
    status: 400 | 401 | 404,
    code: string,
    message: string,
    details?: unknown,
  ) => import("express").Response;
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

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const getPrismaErrorCode = (error: unknown): string | null => {
  // Normalize Prisma error access so handlers can map codes consistently.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }

  return null;
};

usersRouter.post(
  "/users",
  validateBody(createUserBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as CreateUserBody;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: authUserId },
        select: userSelect,
      });

      // First sign-in creates a record; repeat sign-ins sync the latest email.
      if (existingUser) {
        if (existingUser.email === body.email) {
          return res.status(200).json(existingUser);
        }

        const updatedUser = await prisma.user.update({
          where: { id: authUserId },
          data: { email: body.email },
          select: userSelect,
        });

        return res.status(200).json(updatedUser);
      }

      const createdUser = await prisma.user.create({
        data: {
          id: authUserId,
          email: body.email,
        },
        select: userSelect,
      });

      return res.status(201).json(createdUser);
    } catch (error) {
      if (getPrismaErrorCode(error) === "P2002") {
        return errorResponse(
          res,
          400,
          "EMAIL_CONFLICT",
          "User with this email already exists",
        );
      }

      return errorResponse(
        res,
        400,
        "USER_CREATE_OR_SYNC_FAILED",
        "Unable to create or sync user",
      );
    }
  },
);

usersRouter.get("/users/me", async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: authUserId },
    select: userSelect,
  });

  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User not found");
  }

  return res.status(200).json(user);
});

usersRouter.put(
  "/users/me",
  validateBody(updateUserBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as UpdateUserBody;
    const email = body.email;

    if (email === undefined) {
      return errorResponse(res, 400, "EMAIL_REQUIRED", "Email is required");
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: authUserId },
        data: { email },
        select: userSelect,
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      const code = getPrismaErrorCode(error);

      if (code === "P2025") {
        return errorResponse(res, 404, "USER_NOT_FOUND", "User not found");
      }

      if (code === "P2002") {
        return errorResponse(
          res,
          400,
          "EMAIL_CONFLICT",
          "User with this email already exists",
        );
      }

      return errorResponse(
        res,
        400,
        "USER_UPDATE_FAILED",
        "Unable to update user",
      );
    }
  },
);

usersRouter.delete("/users/me", async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  try {
    const deletedUser = await prisma.user.delete({
      where: { id: authUserId },
      select: userSelect,
    });

    return res.status(200).json(deletedUser);
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2025") {
      return errorResponse(res, 404, "USER_NOT_FOUND", "User not found");
    }

    if (code === "P2003" || code === "P2014") {
      // Keep a safe 400 when related data prevents deletion.
      return errorResponse(
        res,
        400,
        "USER_DELETE_CONSTRAINT",
        "Cannot delete user with related records",
      );
    }

    return errorResponse(
      res,
      400,
      "USER_DELETE_FAILED",
      "Unable to delete user",
    );
  }
});

usersRouter.get("/users/me/profile", async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const profile = await prisma.userProfile.findUnique({
    where: { userId: authUserId },
    select: userProfileSelect,
  });

  if (!profile) {
    return errorResponse(
      res,
      404,
      "USER_PROFILE_NOT_FOUND",
      "User profile not found",
    );
  }

  return res.status(200).json(profile);
});

usersRouter.put(
  "/users/me/profile",
  validateBody(upsertUserProfileBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    // Validation already limits this payload to allowed profile fields.
    const data = req.validatedBody as UpdateUserProfileBody;

    try {
      const updatedProfile = await prisma.userProfile.update({
        where: { userId: authUserId },
        data,
        select: userProfileSelect,
      });

      return res.status(200).json(updatedProfile);
    } catch (error) {
      if (getPrismaErrorCode(error) === "P2025") {
        return errorResponse(
          res,
          404,
          "USER_PROFILE_NOT_FOUND",
          "User profile not found",
        );
      }

      return errorResponse(
        res,
        400,
        "USER_PROFILE_UPDATE_FAILED",
        "Unable to update user profile",
      );
    }
  },
);

module.exports = { usersRouter };
