import express from 'express';
import type { Request, Response } from 'express';
import cors, { type CorsOptions } from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { requireApiAuth } from './middleware/requireApiAuth.js';
import { clerkWebhookRouter } from './routes/webhooks.js';
import { usersRouter } from './routes/users.js';
import { memoriesRouter } from './routes/memories.js';
import { listsRouter } from './routes/lists.js';
import { friendRequestsRouter } from './routes/friendRequests.js';
import { friendsRouter } from './routes/friends.js';
import { blocksRouter } from './routes/blocks.js';
import { mediaRouter } from './routes/media.js';
import { errorResponse } from './lib/api-response.js';

const app = express();

const defaultAllowedOrigins = [
  'https://memoriezz.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const envAllowedOrigins =
  process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-Id'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use('/api/webhooks/clerk', clerkWebhookRouter);
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api', requireApiAuth);
app.use('/api', usersRouter);
app.use('/api', memoriesRouter);
app.use('/api', listsRouter);
app.use('/api', friendRequestsRouter);
app.use('/api', friendsRouter);
app.use('/api', blocksRouter);
app.use('/api', mediaRouter);

app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  if (!req.authUserId) {
    return errorResponse(res, 401, 'UNAUTHORIZED', 'Unauthorized');
  }
  return res.status(200).json({ userId: req.authUserId });
});

export { app };
