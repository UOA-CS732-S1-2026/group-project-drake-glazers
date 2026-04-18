const { getAuth } =
  require("@clerk/express") as typeof import("@clerk/express");

type Request = import("express").Request;
type Response = import("express").Response;
type NextFunction = import("express").NextFunction;

const requireApiAuth = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.authUserId = userId;
  return next();
};

module.exports = { requireApiAuth };
