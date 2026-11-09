import bcrypt from 'bcrypt';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import pool from '../db/pool.js';
import { regenerateSession, requireAuth } from '../middleware/auth.js';
import {
  asyncHandler,
  badRequest,
  HttpError,
} from '../middleware/errorHandler.js';
import type { PublicUser, User } from '../types.js';
import { EMAIL_PATTERN } from '../validation.js';

const router = Router();

/**
 * 12 rounds rather than the 10 the plan suggested: both are above the
 * OWASP floor, and the extra round costs a few hundred milliseconds on a
 * login while roughly quadrupling the cost of an offline cracking run.
 */
const BCRYPT_ROUNDS = 12;

const MIN_PASSWORD_LENGTH = 8;


/**
 * Compared against when no user exists, so a request for an unknown email
 * costs the same as one for a known email. Without it, response time
 * reveals which addresses have accounts.
 */
const DUMMY_HASH = bcrypt.hashSync('placeholder-for-timing-parity', BCRYPT_ROUNDS);

/** Same message either way — see the note in the login handler. */
const INVALID_CREDENTIALS = 'Email or password is incorrect';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

interface Credentials {
  email: string;
  password: string;
}

/**
 * Emails are stored and compared lowercased: without it, Test@x.com and
 * test@x.com become two accounts, and the UNIQUE constraint won't object.
 */
function parseCredentials(body: unknown): Credentials {
  const { email, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw badRequest('Email and password are required');
  }

  const normalized = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalized)) {
    throw badRequest('Enter a valid email address');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

  return { email: normalized, password };
}

const toPublicUser = (user: Pick<User, 'id' | 'email'>): PublicUser => ({
  id: user.id,
  email: user.email,
});

// POST /api/auth/signup
router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = parseCredentials(req.body);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // ON CONFLICT rather than a SELECT-then-INSERT: checking first leaves a
    // window where two concurrent signups both pass the check, and the
    // UNIQUE constraint then raises a 500 instead of a clean 409.
    const { rows } = await pool.query<Pick<User, 'id' | 'email'>>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      [email, passwordHash]
    );

    if (rows.length === 0) {
      throw new HttpError(409, 'An account with that email already exists');
    }

    await regenerateSession(req, rows[0].id);
    res.status(201).json(toPublicUser(rows[0]));
  })
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = parseCredentials(req.body);

    const { rows } = await pool.query<Pick<User, 'id' | 'email' | 'password_hash'>>(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];

    // Always run a comparison, even with no user, so the response time
    // doesn't disclose whether the address is registered. The message is
    // identical for "no such user" and "wrong password" for the same reason.
    const matches = await bcrypt.compare(
      password,
      user?.password_hash ?? DUMMY_HASH
    );

    if (!user || !matches) {
      throw new HttpError(401, INVALID_CREDENTIALS);
    }

    await regenerateSession(req, user.id);
    res.json(toPublicUser(user));
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const cookieName = 'footylab.sid';

    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });

    // Destroying the store row isn't enough — without clearing the cookie
    // the browser keeps sending a sid that no longer resolves.
    res.clearCookie(cookieName);
    res.status(204).end();
  })
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<Pick<User, 'id' | 'email'>>(
      'SELECT id, email FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (rows.length === 0) {
      // The account was deleted while the session lived on.
      await new Promise<void>((resolve) => {
        req.session.destroy(() => resolve());
      });
      throw new HttpError(401, 'You must be signed in to do that');
    }

    res.json(toPublicUser(rows[0]));
  })
);

export default router;
