import express from 'express';
import type { Request, Response } from 'express';
import { Webhook } from 'svix';
import { errorResponse } from '../lib/api-response.js';
import { prisma } from '../lib/prisma.js';

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
  async (req: Request, res: Response) => {
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

    type EmailAddress = { id?: string; email_address?: string };
    type WebhookEvent = {
      type?: string;
      data?: {
        id?: string;
        email_addresses?: EmailAddress[];
        primary_email_address_id?: string;
      };
    };

    let evt: WebhookEvent | undefined;

    try {
      const webhook = new Webhook(signingSecret);
      // Normalize IncomingHttpHeaders (string | string[] | undefined) to Record<string, string>
      const normalizedHeaders = Object.fromEntries(
        Object.entries(req.headers as Record<string, unknown>).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.join(',') : ((v as string) ?? ''),
        ])
      ) as Record<string, string>;

      evt = webhook.verify(payload, normalizedHeaders) as WebhookEvent;
    } catch (err) {
      console.error('Invalid webhook signature:', err);
      return errorResponse(
        res,
        401,
        'INVALID_WEBHOOK_SIGNATURE',
        'Invalid Clerk webhook signature'
      );
    }

    // Process events we care about
    try {
      const eventType = evt?.type ?? '';
      const data = evt?.data;

      if (eventType === 'user.created' || eventType === 'user.updated') {
        const userId = data?.id;

        if (!userId) {
          throw new Error('Missing user id in webhook payload');
        }

        // Pick an email address if provided (prefer primary)
        let email = '';
        if (Array.isArray(data.email_addresses) && data.email_addresses.length > 0) {
          const primaryId = data.primary_email_address_id;
          const primary = data.email_addresses.find((e) => e.id === primaryId);
          const pick = primary ?? data.email_addresses[0];
          email = pick?.email_address ?? '';
        }

        await prisma.user.upsert({
          where: { id: userId },
          create: { id: userId, email },
          update: email ? { email } : {},
        });
      } else if (eventType === 'user.deleted') {
        const userId = data?.id;

        if (!userId) {
          throw new Error('Missing user id in webhook payload');
        }

        // Soft-delete: set deletedAt timestamp so related records remain intact.
        // Use updateMany so a delete webhook for a user that does not exist stays idempotent.
        await prisma.user.updateMany({
          where: {
            id: userId,
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
      }

      return res.sendStatus(204);
    } catch (err) {
      console.error('Webhook processing error:', err);
      return res.status(500).json({ error: 'WEBHOOK_PROCESSING_FAILED' });
    }
  }
);
