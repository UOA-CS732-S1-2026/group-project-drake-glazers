const express = require("express") as typeof import("express");
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

const usersRouter = express.Router();

usersRouter.post(
  "/users",
  validateBody(createUserBodySchema),
  (req: Request, res: Response) => {
    return res.status(201).json({
      message:
        "Scaffolded endpoint. User creation logic will be implemented in the next step.",
      userId: req.authUserId,
      body: req.validatedBody,
    });
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
