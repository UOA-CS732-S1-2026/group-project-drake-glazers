import { z } from 'zod';
import type { ZodType } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../lib/api-response.js';

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Flatten errors to a predictable client-facing shape.
      return errorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid request body',
        z.flattenError(result.error)
      );
    }

    // Attach the parsed payload for route handlers.
    req.validatedBody = result.data;
    return next();
  };
};
