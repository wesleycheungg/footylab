import type { Product, ProductFilters, PublicUser } from './types';

/**
 * All requests use relative /api/... paths. In dev the Vite proxy forwards
 * them to the Express server on :3000, so the browser sees a single origin
 * and session cookies work without CORS. Don't reintroduce VITE_API_URL
 * here — a cross-origin base URL silently breaks cookies from Phase 6 on.
 */
const API_BASE = '/api';

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;

  // Declared and assigned explicitly rather than as a constructor parameter
  // property: the client tsconfig sets `erasableSyntaxOnly`, which rejects
  // syntax that needs more than type-stripping to compile.
  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Single place that talks to the network: adds credentials, throws a typed
 * error on non-2xx, and parses JSON. Pages should never call fetch directly,
 * or each one ends up with its own slightly different error handling.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      // Needed for express-session cookies from Phase 6 onward.
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
  } catch (cause) {
    // fetch only rejects on network failure, not on HTTP error statuses.
    throw new ApiError(0, 'Network error — is the API server running?', {
      cause,
    });
  }

  if (!response.ok) {
    // The API returns {error: string}; fall back if the body isn't JSON
    // (e.g. a proxy error page).
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // keep the default message
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** Drops empty and undefined filters so the URL stays clean. */
function toQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const trimmed = String(value).trim();
    if (trimmed === '') continue;
    params.set(key, trimmed);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  return request<Product[]>(`/products${toQueryString(filters)}`);
}

export function getProduct(id: number | string): Promise<Product> {
  return request<Product>(`/products/${id}`);
}

export function getHealth(): Promise<{ ok: boolean; db: boolean }> {
  return request<{ ok: boolean; db: boolean }>('/health');
}

/* Auth ------------------------------------------------------------------- */

export function signup(
  email: string,
  password: string
): Promise<PublicUser> {
  return request<PublicUser>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<PublicUser> {
  return request<PublicUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function getCurrentUser(): Promise<PublicUser> {
  return request<PublicUser>('/auth/me');
}
