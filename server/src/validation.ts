import { badRequest } from './middleware/errorHandler.js';

/**
 * Deliberately loose. Strict email regexes reject valid addresses, and the
 * only real proof an address works is sending mail to it.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pulls a required, trimmed string out of a request body.
 *
 * `maxLength` is not cosmetic: the columns are unbounded TEXT, so without
 * a ceiling a single request could write an arbitrarily large row.
 */
export function requiredString(
  value: unknown,
  field: string,
  maxLength = 200
): string {
  if (typeof value !== 'string') {
    throw badRequest(`${field} is required`);
  }

  const trimmed = value.trim();

  if (trimmed === '') {
    throw badRequest(`${field} is required`);
  }

  if (trimmed.length > maxLength) {
    throw badRequest(`${field} must be ${maxLength} characters or fewer`);
  }

  return trimmed;
}
