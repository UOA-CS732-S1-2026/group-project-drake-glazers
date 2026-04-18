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

const userSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies import("@prisma/client").Prisma.UserSelect;

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

usersRouter.get("/users/me", (req: Request, res: Response) => {
  return res.status(200).json({
    message:
      "Scaffolded endpoint. User retrieval logic will be implemented in the next step.",
    userId: req.authUserId,
  });
});

usersRouter.put(
  "/users/me",
  validateBody(updateUserBodySchema),
  (req: Request, res: Response) => {
    return res.status(200).json({
      message:
        "Scaffolded endpoint. User update logic will be implemented in the next step.",
      userId: req.authUserId,
      body: req.validatedBody,
    });
  },
);

usersRouter.delete("/users/me", (req: Request, res: Response) => {
  return res.status(200).json({
    message:
      "Scaffolded endpoint. User deletion logic will be implemented in the next step.",
    userId: req.authUserId,
  });
});

usersRouter.get("/users/me/profile", (req: Request, res: Response) => {
  return res.status(200).json({
    message:
      "Scaffolded endpoint. Profile retrieval logic will be implemented in the next step.",
    userId: req.authUserId,
  });
});

usersRouter.put(
  "/users/me/profile",
  validateBody(upsertUserProfileBodySchema),
  (req: Request, res: Response) => {
    return res.status(200).json({
      message:
        "Scaffolded endpoint. Profile update logic will be implemented in the next step.",
      userId: req.authUserId,
      body: req.validatedBody,
    });
  },
);

module.exports = { usersRouter };
