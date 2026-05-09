import express, { type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { blockUserBodySchema } from '../schemas/blocks.js';

type BlockUserBody = { blockedId: string };

const blocksRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const blockedUserSelect = {
  id: true,
  profile: {
    select: {
      displayName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.UserSelect;

// POST /blocks - Block a user; atomically removes any friendship and pending requests
blocksRouter.post(
  '/blocks',
  validateBody(blockUserBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const { blockedId } = req.validatedBody as BlockUserBody;

    if (blockedId === authUserId) {
      return errorResponse(res, 400, 'CANNOT_BLOCK_SELF', 'Cannot block yourself');
    }

    const target = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });

    if (!target) {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: authUserId, blockedId } },
      select: { id: true },
    });

    if (existing) {
      return errorResponse(res, 400, 'ALREADY_BLOCKED', 'You have already blocked this user');
    }

    const [userAId, userBId] = [authUserId, blockedId].sort() as [string, string];

    try {
      const [block] = await prisma.$transaction([
        prisma.block.create({
          data: {
            blocker: { connect: { id: authUserId } },
            blocked: { connect: { id: blockedId } },
          },
          select: { id: true, blockerId: true, blockedId: true, createdAt: true },
        }),
        // Remove friendship if one exists (deleteMany avoids errors when absent)
        prisma.friendship.deleteMany({
          where: { userAId, userBId },
        }),
        // Cancel pending requests in either direction
        prisma.friendRequest.deleteMany({
          where: {
            status: 'pending',
            OR: [
              { fromUserId: authUserId, toUserId: blockedId },
              { fromUserId: blockedId, toUserId: authUserId },
            ],
          },
        }),
      ]);

      return res.status(201).json(block);
    } catch {
      return errorResponse(res, 400, 'BLOCK_FAILED', 'Unable to block user');
    }
  }
);

// GET /blocks - List users the current user has blocked
blocksRouter.get('/blocks', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const blocks = await prisma.block.findMany({
    where: { blockerId: authUserId },
    select: {
      id: true,
      createdAt: true,
      blocked: { select: blockedUserSelect },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(blocks);
});

// DELETE /blocks/:userId - Unblock a user
blocksRouter.delete('/blocks/:userId', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const userId = req.params['userId'] as string;

  try {
    await prisma.block.delete({
      where: { blockerId_blockedId: { blockerId: authUserId, blockedId: userId } },
    });

    return res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return errorResponse(res, 404, 'BLOCK_NOT_FOUND', 'Block not found');
    }

    return errorResponse(res, 400, 'UNBLOCK_FAILED', 'Unable to unblock user');
  }
});

export { blocksRouter };
