const { z } = require("zod") as typeof import("zod");

type Request = import("express").Request;
type Response = import("express").Response;
type NextFunction = import("express").NextFunction;
type ZodType = import("zod").ZodType;

const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: z.flattenError(result.error),
      });
    }

    req.validatedBody = result.data;
    return next();
  };
};

module.exports = { validateBody };
