import express, { type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import { sendFriendRequestBodySchema } from '../schemas/friendRequests.js';

type SendFriendRequestBody = { toUserId: string };

const friendRequestSelect = {
  id: true,
  fromUserId: true,
  toUserId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies import('@prisma/client').Prisma.FriendRequestSelect;

const friendRequestsRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const getPrismaErrorCode = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  return null;
};

// POST /friend-requests - Send a friend request
friendRequestsRouter.post(
  '/friend-requests',
  validateBody(sendFriendRequestBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const { toUserId } = req.validatedBody as SendFriendRequestBody;

    if (toUserId === authUserId) {
      return errorResponse(
        res,
        400,
        'CANNOT_SEND_TO_SELF',
        'Cannot send a friend request to yourself'
      );
    }

    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });

    if (!recipient) {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'Recipient user not found');
    }

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: authUserId, blockedId: toUserId },
          { blockerId: toUserId, blockedId: authUserId },
        ],
      },
      select: { id: true },
    });

    if (block) {
      return errorResponse(res, 400, 'BLOCKED', 'Cannot send a friend request to this user');
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        status: 'pending',
        OR: [
          { fromUserId: authUserId, toUserId },
          { fromUserId: toUserId, toUserId: authUserId },
        ],
      },
    });

    if (existingRequest) {
      return errorResponse(
        res,
        400,
        'FRIEND_REQUEST_ALREADY_EXISTS',
        'A pending friend request already exists between these users'
      );
    }

    try {
      const friendRequest = await prisma.friendRequest.create({
        data: {
          fromUserId: authUserId,
          toUserId,
          status: 'pending',
        },
        select: friendRequestSelect,
      });

      return res.status(201).json(friendRequest);
    } catch {
      return errorResponse(
        res,
        400,
        'FRIEND_REQUEST_CREATE_FAILED',
        'Unable to send friend request'
      );
    }
  }
);

// GET /friend-requests - List incoming and outgoing pending requests
friendRequestsRouter.get('/friend-requests', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { toUserId: authUserId, status: 'pending' },
      select: friendRequestSelect,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { fromUserId: authUserId, status: 'pending' },
      select: friendRequestSelect,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return res.status(200).json({ incoming, outgoing });
});

// PUT /friend-requests/:id/accept - Accept a friend request (recipient only)
friendRequestsRouter.put('/friend-requests/:id/accept', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params['id'] as string;

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id },
    select: friendRequestSelect,
  });

  if (!friendRequest) {
    return errorResponse(res, 404, 'FRIEND_REQUEST_NOT_FOUND', 'Friend request not found');
  }

  if (friendRequest.toUserId !== authUserId) {
    return errorResponse(
      res,
      400,
      'NOT_RECIPIENT',
      'Only the recipient can accept a friend request'
    );
  }

  if (friendRequest.status !== 'pending') {
    return errorResponse(
      res,
      400,
      'FRIEND_REQUEST_NOT_PENDING',
      'Only pending friend requests can be accepted'
    );
  }

  try {
    const [userA, userB] = [authUserId, friendRequest.fromUserId].sort();
    const [updated] = await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id },
        data: { status: 'accepted' },
        select: friendRequestSelect,
      }),
      prisma.friendship.create({
        data: { userAId: userA, userBId: userB },
      }),
    ]);

    return res.status(200).json(updated);
  } catch {
    return errorResponse(
      res,
      400,
      'FRIEND_REQUEST_ACCEPT_FAILED',
      'Unable to accept friend request'
    );
  }
});

// PUT /friend-requests/:id/decline - Decline a friend request (recipient only)
friendRequestsRouter.put('/friend-requests/:id/decline', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params['id'] as string;

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id },
    select: friendRequestSelect,
  });

  if (!friendRequest) {
    return errorResponse(res, 404, 'FRIEND_REQUEST_NOT_FOUND', 'Friend request not found');
  }

  if (friendRequest.toUserId !== authUserId) {
    return errorResponse(
      res,
      400,
      'NOT_RECIPIENT',
      'Only the recipient can decline a friend request'
    );
  }

  if (friendRequest.status !== 'pending') {
    return errorResponse(
      res,
      400,
      'FRIEND_REQUEST_NOT_PENDING',
      'Only pending friend requests can be declined'
    );
  }

  try {
    const updated = await prisma.friendRequest.update({
      where: { id },
      data: { status: 'rejected' },
      select: friendRequestSelect,
    });

    return res.status(200).json(updated);
  } catch {
    return errorResponse(
      res,
      400,
      'FRIEND_REQUEST_DECLINE_FAILED',
      'Unable to decline friend request'
    );
  }
});

// DELETE /friend-requests/:id - Cancel a sent friend request (sender only)
friendRequestsRouter.delete('/friend-requests/:id', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const id = req.params['id'] as string;

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id },
    select: friendRequestSelect,
  });

  if (!friendRequest) {
    return errorResponse(res, 404, 'FRIEND_REQUEST_NOT_FOUND', 'Friend request not found');
  }

  if (friendRequest.fromUserId !== authUserId) {
    return errorResponse(res, 400, 'NOT_SENDER', 'Only the sender can cancel a friend request');
  }

  if (friendRequest.status !== 'pending') {
    return errorResponse(
      res,
      400,
      'FRIEND_REQUEST_NOT_PENDING',
      'Only pending friend requests can be cancelled'
    );
  }

  try {
    const deleted = await prisma.friendRequest.delete({
      where: { id },
      select: friendRequestSelect,
    });

    return res.status(200).json(deleted);
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return errorResponse(res, 404, 'FRIEND_REQUEST_NOT_FOUND', 'Friend request not found');
    }

    return errorResponse(
      res,
      400,
      'FRIEND_REQUEST_CANCEL_FAILED',
      'Unable to cancel friend request'
    );
  }
});

export { friendRequestsRouter };
