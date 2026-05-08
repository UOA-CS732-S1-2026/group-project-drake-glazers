import express, { type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';

const friendsRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const friendUserSelect = {
  id: true,
  profile: {
    select: {
      displayName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.UserSelect;

// GET /friends - List current user's accepted friends
friendsRouter.get('/friends', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: authUserId }, { userBId: authUserId }],
    },
    select: {
      id: true,
      createdAt: true,
      userA: { select: friendUserSelect },
      userB: { select: friendUserSelect },
    },
    orderBy: { createdAt: 'desc' },
  });

  const friends = friendships.map(({ id, createdAt, userA, userB }) => ({
    id,
    createdAt,
    friend: userA.id === authUserId ? userB : userA,
  }));

  return res.status(200).json(friends);
});

// DELETE /friends/:userId - Remove a friendship
friendsRouter.delete('/friends/:userId', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const userId = req.params['userId'] as string;

  if (userId === authUserId) {
    return errorResponse(res, 400, 'CANNOT_UNFRIEND_SELF', 'Cannot unfriend yourself');
  }

  const [userAId, userBId] = [authUserId, userId].sort() as [string, string];

  try {
    await prisma.friendship.delete({
      where: { userAId_userBId: { userAId, userBId } },
    });

    return res.status(200).json({ message: 'Friend removed' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return errorResponse(res, 404, 'FRIENDSHIP_NOT_FOUND', 'Friendship not found');
    }

    return errorResponse(res, 400, 'FRIEND_REMOVE_FAILED', 'Unable to remove friend');
  }
});

export { friendsRouter };
