const express = require("express") as typeof import("express");
const cors = require("cors") as typeof import("cors");
const dotenv = require("dotenv") as typeof import("dotenv");
const { clerkMiddleware } =
  require("@clerk/express") as typeof import("@clerk/express");
const { requireApiAuth } = require("./middleware/requireApiAuth") as {
  requireApiAuth: import("express").RequestHandler;
};

type Request = import("express").Request;
type Response = import("express").Response;

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use("/api", requireApiAuth);

app.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({ status: "ok" });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  if (!req.authUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.status(200).json({ userId: req.authUserId });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
