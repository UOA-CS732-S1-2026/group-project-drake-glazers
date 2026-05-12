import type { Response } from 'express';

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const errorResponse = (
  res: Response,
  status: 400 | 401 | 403 | 404 | 409 | 500,
  code: string,
  message: string,
  details?: unknown
) => {
  // One shared error shape keeps API responses predictable for clients.
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
};
