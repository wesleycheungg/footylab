import connectPgSimple from 'connect-pg-simple';
import type { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import pool from '../db/pool.js';
import { HttpError } from './errorHandler.js';

// Everything the session cookie carries. Only the user id: anything else
// would be a second copy of data the database already owns, and stale the
// moment the row changes.
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const PgStore = connectPgSimple(session);

/** One week. Long enough to stay signed in, short enough to expire. */
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    // Fail fast in production rather than silently signing cookies with a
    // predictable key — anyone who guesses it can forge a session.
    if (isProduction) {
      throw new Error('SESSION_SECRET must be set in production');
    }
    console.warn(
      'SESSION_SECRET is not set — using an insecure development default.'
    );
  }

  return session({
    name: 'footylab.sid',
    store: new PgStore({
      pool,
      tableName: 'session',
      // The table is created by schema.sql so it stays in one place.
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 15,
    }),
    secret: secret ?? 'insecure-development-secret',
    resave: false,
    // Don't persist empty sessions: without this every anonymous request
    // writes a row, and the table fills with sessions nobody is using.
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}

/** Rejects anonymous requests. Routes behind this can trust req.session.userId. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.userId) {
    next(new HttpError(401, 'You must be signed in to do that'));
    return;
  }
  next();
}

/**
 * Swaps in a fresh session id while keeping the data, so a session id
 * captured before sign-in can't be reused afterwards (session fixation).
 * Must run on every privilege change — signup and login both.
 */
export function regenerateSession(req: Request, userId: number) {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.userId = userId;

      // Save explicitly so the row exists before we respond; otherwise a
      // fast follow-up request can arrive before the store has written.
      req.session.save((saveError) => {
        if (saveError) reject(saveError);
        else resolve();
      });
    });
  });
}
