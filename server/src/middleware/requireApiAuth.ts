const { getAuth } =
  require("@clerk/express") as typeof import("@clerk/express");
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

const requireApiAuth = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return errorResponse(res, 401, "UNAUTHORIZED", "Unauthorized");
  }

  req.authUserId = userId;
  return next();
};

module.exports = { requireApiAuth };
