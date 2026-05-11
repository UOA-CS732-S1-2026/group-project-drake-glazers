import { z } from 'zod';
import { errorResponse } from '../lib/api-response.js';
export const validateBody = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid request body', z.flattenError(result.error));
        }
        req.validatedBody = result.data;
        return next();
    };
};
//# sourceMappingURL=validateBody.js.map