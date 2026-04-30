import express from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { errorResponse } from '../lib/api-response.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createUserBodySchema,
  updateUserBodySchema,
  upsertUserProfileBodySchema,
} from '../schemas/users.js';

type CreateUserBody = { email: string };
type UpdateUserBody = { email?: string };
type UpdateUserProfileBody = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
};

const userSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const userProfileSelect = {
  id: true,
  userId: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
} satisfies Prisma.UserProfileSelect;

export const usersRouter = express.Router();

const getAuthUserId = (req: Request): string => {
  return req.authUserId as string;
};

const getPrismaErrorCode = (error: unknown): string | null => {
  // Normalize Prisma error access so handlers can map codes consistently.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }

  return null;
};

usersRouter.post(
  '/users',
  validateBody(createUserBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as CreateUserBody;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: authUserId },
        select: userSelect,
      });

      // First sign-in creates a record; repeat sign-ins sync the latest email.
      if (existingUser) {
        if (existingUser.email === body.email) {
          return res.status(200).json(existingUser);
        }

        const updatedUser = await prisma.user.update({
          where: { id: authUserId },
          data: { email: body.email },
          select: userSelect,
        });

        return res.status(200).json(updatedUser);
      }

      const createdUser = await prisma.user.create({
        data: {
          id: authUserId,
          email: body.email,
        },
        select: userSelect,
      });

      return res.status(201).json(createdUser);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2002') {
        return errorResponse(res, 400, 'EMAIL_CONFLICT', 'User with this email already exists');
      }

      return errorResponse(res, 400, 'USER_CREATE_OR_SYNC_FAILED', 'Unable to create or sync user');
    }
  }
);

usersRouter.get('/users/me', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: authUserId },
    select: userSelect,
  });

  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  return res.status(200).json(user);
});

usersRouter.put(
  '/users/me',
  validateBody(updateUserBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    const body = req.validatedBody as UpdateUserBody;
    const email = body.email;

    if (email === undefined) {
      return errorResponse(res, 400, 'EMAIL_REQUIRED', 'Email is required');
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: authUserId },
        data: { email },
        select: userSelect,
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      const code = getPrismaErrorCode(error);

      if (code === 'P2025') {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      if (code === 'P2002') {
        return errorResponse(res, 400, 'EMAIL_CONFLICT', 'User with this email already exists');
      }

      return errorResponse(res, 400, 'USER_UPDATE_FAILED', 'Unable to update user');
    }
  }
);

usersRouter.delete('/users/me', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  try {
    const deletedUser = await prisma.user.delete({
      where: { id: authUserId },
      select: userSelect,
    });

    return res.status(200).json(deletedUser);
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === 'P2025') {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    if (code === 'P2003' || code === 'P2014') {
      // Keep a safe 400 when related data prevents deletion.
      return errorResponse(
        res,
        400,
        'USER_DELETE_CONSTRAINT',
        'Cannot delete user with related records'
      );
    }

    return errorResponse(res, 400, 'USER_DELETE_FAILED', 'Unable to delete user');
  }
});

// GET /users/search?q=... - Search users by display name or email (excludes self and blocked users)
usersRouter.get('/users/search', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';

  if (!q) {
    return errorResponse(res, 400, 'QUERY_REQUIRED', 'Search query is required');
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: authUserId } },
        // Exclude any user who has blocked the auth user or been blocked by them
        { blocksGiven: { none: { blockedId: authUserId } } },
        { blocksReceived: { none: { blockerId: authUserId } } },
        {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { profile: { is: { displayName: { contains: q, mode: 'insensitive' } } } },
          ],
        },
      ],
    },
    select: {
      id: true,
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    take: 20,
  });

  return res.status(200).json(users);
});

// GET /users/:userId/relationship - Relationship state between auth user and target
usersRouter.get('/users/:userId/relationship', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);
  const userId = req.params['userId'] as string;

  if (userId === authUserId) {
    return errorResponse(res, 400, 'CANNOT_CHECK_SELF', 'Cannot check relationship with yourself');
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!target) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  const [userAId, userBId] = [authUserId, userId].sort();

  const [blockedByMe, blockedByThem, friendship, pendingRequest] = await Promise.all([
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: authUserId, blockedId: userId } },
      select: { id: true },
    }),
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: authUserId } },
      select: { id: true },
    }),
    prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true },
    }),
    prisma.friendRequest.findFirst({
      where: {
        status: 'pending',
        OR: [
          { fromUserId: authUserId, toUserId: userId },
          { fromUserId: userId, toUserId: authUserId },
        ],
      },
      select: { fromUserId: true },
    }),
  ]);

  let status: string;
  if (blockedByMe) {
    status = 'blocked_by_me';
  } else if (blockedByThem) {
    status = 'blocked_by_them';
  } else if (friendship) {
    status = 'friends';
  } else if (pendingRequest) {
    status = pendingRequest.fromUserId === authUserId ? 'pending_outgoing' : 'pending_incoming';
  } else {
    status = 'none';
  }

  return res.status(200).json({ status });
});

usersRouter.get('/users/me/profile', async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req);

  const profile = await prisma.userProfile.findUnique({
    where: { userId: authUserId },
    select: userProfileSelect,
  });

  if (!profile) {
    return errorResponse(res, 404, 'USER_PROFILE_NOT_FOUND', 'User profile not found');
  }

  return res.status(200).json(profile);
});

usersRouter.put(
  '/users/me/profile',
  validateBody(upsertUserProfileBodySchema),
  async (req: Request, res: Response) => {
    const authUserId = getAuthUserId(req);
    // Validation already limits this payload to allowed profile fields.
    const data = req.validatedBody as UpdateUserProfileBody;

    try {
      const updatedProfile = await prisma.userProfile.update({
        where: { userId: authUserId },
        data,
        select: userProfileSelect,
      });

      return res.status(200).json(updatedProfile);
    } catch (error) {
      if (getPrismaErrorCode(error) === 'P2025') {
        return errorResponse(res, 404, 'USER_PROFILE_NOT_FOUND', 'User profile not found');
      }

      return errorResponse(res, 400, 'USER_PROFILE_UPDATE_FAILED', 'Unable to update user profile');
    }
  }
);
