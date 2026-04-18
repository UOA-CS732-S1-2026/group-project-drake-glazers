const { z } = require("zod") as typeof import("zod");
const { errorResponse } = require("../lib/api-response") as {
  errorResponse: (
    res: import("express").Response,
    status: 400 | 401 | 404,
    code: string,
    message: string,
    details?: unknown,
  ) => import("express").Response;
};

type Request = import("express").Request;
type Response = import("express").Response;
type NextFunction = import("express").NextFunction;
type ZodType = import("zod").ZodType;

const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return errorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid request body",
        z.flattenError(result.error),
      );
    }

    req.validatedBody = result.data;
    return next();
  };
};

module.exports = { validateBody };
