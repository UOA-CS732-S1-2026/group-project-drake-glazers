import express from 'express';
import type { Request, Response } from 'express';
import { Webhook } from 'svix';
import { z } from 'zod';
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

const clerkWebhookEventSchema = z.looseObject({
  type: z.enum(['user.created', 'user.updated', 'user.deleted']),
  data: z.looseObject({
    id: z.string(),
    email_addresses: z
      .array(
        z.looseObject({
          id: z.string().optional(),
          email_address: z.email().optional(),
        })
      )
      .optional(),
    primary_email_address_id: z.string().optional(),
  }),
});

type ClerkWebhookEvent = z.infer<typeof clerkWebhookEventSchema>;

clerkWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!signingSecret) {
      return errorResponse(
        res,
        500,
        'WEBHOOK_SIGNING_SECRET_MISSING',
        'Clerk webhook signing secret is not configured'
      );
    }

    const payload = getRawBodyText(req.body);

    let evt: ClerkWebhookEvent;

    try {
      const webhook = new Webhook(signingSecret);
      // Normalize IncomingHttpHeaders (string | string[] | undefined) to Record<string, string>
      const normalizedHeaders = Object.fromEntries(
        Object.entries(req.headers as Record<string, unknown>).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.join(',') : ((v as string) ?? ''),
        ])
      ) as Record<string, string>;

      const verifiedPayload = webhook.verify(payload, normalizedHeaders);
      const parsedPayload = clerkWebhookEventSchema.safeParse(verifiedPayload);

      if (!parsedPayload.success) {
        return errorResponse(
          res,
          400,
          'INVALID_WEBHOOK_PAYLOAD',
          'Clerk webhook payload has an unexpected shape'
        );
      }

      evt = parsedPayload.data;
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
      const eventType = evt.type;
      const data = evt.data;

      if (eventType === 'user.created' || eventType === 'user.updated') {
        const userId = data.id;

        if (!userId) {
          throw new Error('Missing user id in webhook payload');
        }

        // Pick an email address if provided (prefer primary)
        let email: string | null = null;
        if (Array.isArray(data.email_addresses) && data.email_addresses.length > 0) {
          const primaryId = data.primary_email_address_id;
          const primary = data.email_addresses.find((e) => e.id === primaryId);
          const pick = primary ?? data.email_addresses[0];
          email = pick?.email_address ?? null;
        }

        if (!email) {
          if (eventType === 'user.created') {
            return errorResponse(
              res,
              400,
              'EMAIL_REQUIRED',
              'Clerk webhook user.created event is missing an email address'
            );
          }

          return res.sendStatus(204);
        }

        await prisma.user.upsert({
          where: { id: userId },
          create: { id: userId, email },
          update: email ? { email } : {},
        });
      } else if (eventType === 'user.deleted') {
        const userId = data.id;

        if (!userId) {
          throw new Error('Missing user id in webhook payload');
        }

        // Hard-delete: remove user-owned records first, then delete the user row.
        // Using deleteMany keeps the handler idempotent when Clerk retries or the user is already gone.
        await prisma.$transaction(async (tx) => {
          const lists = await tx.list.findMany({
            where: { userId },
            select: { id: true },
          });

          const listIds = lists.map((list) => list.id);

          await tx.userProfile.deleteMany({
            where: { userId },
          });

          await tx.friendRequest.deleteMany({
            where: {
              OR: [{ fromUserId: userId }, { toUserId: userId }],
            },
          });

          await tx.friendship.deleteMany({
            where: {
              OR: [{ userAId: userId }, { userBId: userId }],
            },
          });

          await tx.block.deleteMany({
            where: {
              OR: [{ blockerId: userId }, { blockedId: userId }],
            },
          });

          if (listIds.length > 0) {
            await tx.listItem.deleteMany({
              where: {
                listId: { in: listIds },
              },
            });
          }

          await tx.list.deleteMany({
            where: { userId },
          });

          await tx.memory.deleteMany({
            where: { userId },
          });

          await tx.user.deleteMany({
            where: { id: userId },
          });
        });
      }

      return res.sendStatus(204);
    } catch (err) {
      console.error('Webhook processing error:', err);
      return errorResponse(
        res,
        500,
        'WEBHOOK_PROCESSING_FAILED',
        'Unable to process Clerk webhook'
      );
    }
  }
);
