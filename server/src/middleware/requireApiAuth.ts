import { getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../lib/api-response.js';

export const requireApiAuth = (req: Request, res: Response, next: NextFunction) => {
  const allowDevBypass = process.env.DEV_BYPASS_AUTH === 'true';

  if (allowDevBypass) {
    const headerValue = req.header('x-dev-user-id');

    if (!headerValue) {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'Missing x-dev-user-id header');
    }

    req.authUserId = headerValue;
    return next();
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return errorResponse(res, 401, 'UNAUTHORIZED', 'Unauthorized');
  }

  // Store the authenticated Clerk user id for downstream handlers.
  req.authUserId = userId;
  return next();
};
