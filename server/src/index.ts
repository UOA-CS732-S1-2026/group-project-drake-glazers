const express = require("express") as typeof import("express");
const cors = require("cors") as typeof import("cors");
const dotenv = require("dotenv") as typeof import("dotenv");
const { clerkMiddleware } = require("@clerk/express") as typeof import("@clerk/express");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get("/health", (_req: import("express").Request, res: import("express").Response) => {
	return res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
	console.log(`Server listening at http://localhost:${PORT}`);
});
