import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import { requireApiAuth } from './middleware/requireApiAuth.js';
import { usersRouter } from './routes/users.js';
import { friendRequestsRouter } from './routes/friendRequests.js';
import { errorResponse } from './lib/api-response.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
// Clerk middleware parses auth context from incoming requests.
app.use(clerkMiddleware());

// Keep auth enforcement at the /api boundary so routes stay focused on business logic.
app.use('/api', requireApiAuth);
app.use('/api', usersRouter);
app.use('/api', friendRequestsRouter);

app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  // Simple auth probe endpoint used to verify token wiring quickly.
  if (!req.authUserId) {
    return errorResponse(res, 401, 'UNAUTHORIZED', 'Unauthorized');
  }

  return res.status(200).json({ userId: req.authUserId });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
