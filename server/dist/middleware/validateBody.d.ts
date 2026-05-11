import type { ZodType } from 'zod';
import type { Request, Response, NextFunction } from 'express';
export declare const validateBody: (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=validateBody.d.ts.map