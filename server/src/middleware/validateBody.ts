import { z } from 'zod';
import type { ZodType } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../lib/api-response.js';

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return errorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid request body',
        z.flattenError(result.error)
      );
    }

    req.validatedBody = result.data;
    return next();
  };
};
