/**
 * Regular Expression Constants
 *
 * Centralized regular expression patterns used across validation schemas.
 */

export const REGEX = {
	UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
	PHONE: /^\+?[0-9\s-]{7,20}$/,
} as const;

export default REGEX;
