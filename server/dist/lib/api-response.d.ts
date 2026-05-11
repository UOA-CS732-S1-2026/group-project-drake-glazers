import type { Response } from 'express';
export declare const errorResponse: (res: Response, status: 400 | 401 | 404 | 500, code: string, message: string, details?: unknown) => Response<any, Record<string, any>>;
//# sourceMappingURL=api-response.d.ts.map