import type { NextFunction, Request, Response } from 'express';

/**
 * An error with an intended HTTP status. Throw this from a route when the
 * client is at fault; anything else is treated as a 500.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Shorthand for the two client errors the products routes need. */
export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message = 'Not found') => new HttpError(404, message);

/**
 * Wraps an async route handler so a rejected promise reaches the error
 * handler. Express 4 does not do this itself — without it, a failed query
 * hangs the request instead of returning 500.
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  handler: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<unknown>
) {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    handler(req, res, next).catch(next);
  };
}

/**
 * 404 for any unmatched /api route, so clients get JSON rather than HTML.
 * Uses `originalUrl` because mounting under /api strips the prefix from
 * `req.path`, which would report "/nope" for a request to "/api/nope".
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl.split('?')[0]}`,
  });
}

/**
 * Terminal error handler. Must take four arguments or Express will not
 * recognise it as an error handler.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Unexpected: log the real error server-side, return something opaque.
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
