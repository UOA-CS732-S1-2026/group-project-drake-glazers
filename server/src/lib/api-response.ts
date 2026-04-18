type Response = import("express").Response;

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

const errorResponse = (
  res: Response,
  status: 400 | 401 | 404,
  code: string,
  message: string,
  details?: unknown,
) => {
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

module.exports = { errorResponse };
