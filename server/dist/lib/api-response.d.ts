import type { Response } from 'express';
export declare const errorResponse: (res: Response, status: 400 | 401 | 403 | 404 | 409 | 500, code: string, message: string, details?: unknown) => Response<any, Record<string, any>>;
//# sourceMappingURL=api-response.d.ts.map