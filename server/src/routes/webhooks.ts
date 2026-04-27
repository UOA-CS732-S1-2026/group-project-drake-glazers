import express from 'express';
import type { Request, Response } from 'express';
import { Webhook } from 'svix';
import { errorResponse } from '../lib/api-response.js';

export const clerkWebhookRouter = express.Router();

const getRawBodyText = (body: Request['body']): string => {
  if (body instanceof Uint8Array) {
    return new TextDecoder('utf-8').decode(body);
  }

  if (typeof body === 'string') {
    return body;
  }

  return '';
};

clerkWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!signingSecret) {
      return errorResponse(
        res,
        401,
        'WEBHOOK_SIGNING_SECRET_MISSING',
        'Clerk webhook signing secret is not configured'
      );
    }

    const payload = getRawBodyText(req.body);

    try {
      const webhook = new Webhook(signingSecret);
      webhook.verify(payload, req.headers);
    } catch {
      return errorResponse(
        res,
        401,
        'INVALID_WEBHOOK_SIGNATURE',
        'Invalid Clerk webhook signature'
      );
    }

    return res.sendStatus(204);
  }
);
