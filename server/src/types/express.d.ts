declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      validatedBody?: unknown;
    }
  }
}

export {};
