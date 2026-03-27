import { ValidationError } from "../errors/AppError";

// ─── Regex Patterns ──────────────────────────────────────────────────────────

/** Standard email with TLD of 2–63 chars. Rejects single-char TLDs. */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,63}$/;

/**
 * Phone: optional country code (+1–3 digits) then 7–10 digits.
 * Digits only — no letters, no plain spaces accepted in the core number.
 * Accepts: 3001234567 | +573001234567 | +1 8005551234
 */
const PHONE_REGEX = /^(\+?[0-9]{1,3}[\s]?)?[0-9]{7,10}$/;

/**
 * Nombre: letters (including Spanish accented chars), single spaces,
 * single hyphens and periods between words. No digits, no double separators.
 * Min 2 alpha chars total.
 */
export const NOMBRE_REGEX =
  /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+([\s\-\.][a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+)*$/;

/** CC / TI: digits only, 6–12 digits. */
export const ID_CC_TI_REGEX = /^[0-9]{6,12}$/;

/** CE: alphanumeric, 6–15 chars. */
export const ID_CE_REGEX = /^[0-9A-Za-z]{6,15}$/;

/** PAS: alphanumeric + hyphens, 6–20 chars. */
export const ID_PAS_REGEX = /^[0-9A-Za-z\-]{6,20}$/;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Sanitization ────────────────────────────────────────────────────────────

/**
 * Strips HTML/script tags and trims surrounding whitespace.
 * Prevents XSS payloads from being stored raw in the database.
 *
 * @param value - Raw input string from user
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")     // strip HTML tags
    .replace(/&[a-z]+;/gi, " ")  // decode common HTML entities to space
    .trim();
}

/**
 * Sanitizes and truncates a string to a maximum character count.
 *
 * @param value - Input string
 * @param max   - Maximum character count
 */
export function clampString(value: string, max: number): string {
  return sanitizeText(value).slice(0, max);
}

// ─── Format Validators ───────────────────────────────────────────────────────

/**
 * Returns true for a properly-formed email address with a TLD of ≥ 2 chars.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Returns true for phone numbers that are digits-only (with optional country
 * code prefix). Rejects inputs containing letters or excessive punctuation.
 *
 * @param phone - Raw phone input
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Returns true for a person's name: letters + single spaces/hyphens/periods.
 * Rejects digits, consecutive separators, and leading/trailing separators.
 *
 * @param name - Full name input
 */
export function isValidNombre(name: string): boolean {
  return NOMBRE_REGEX.test(name.trim());
}

/**
 * Returns true for a Cédula de Ciudadanía or Tarjeta de Identidad.
 * Rule: digits only, 6–12 digits.
 */
export function isValidIdCC(id: string): boolean {
  return ID_CC_TI_REGEX.test(id.trim());
}

/**
 * Returns true for a Cédula de Extranjería.
 * Rule: alphanumeric, 6–15 chars.
 */
export function isValidIdCE(id: string): boolean {
  return ID_CE_REGEX.test(id.trim());
}

/**
 * Returns true for a Passport (Pasaporte).
 * Rule: alphanumeric + hyphens, 6–20 chars.
 */
export function isValidIdPasaporte(id: string): boolean {
  return ID_PAS_REGEX.test(id.trim());
}

/** Returns true for a valid UUID v4 string. */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

// ─── Presence Validators ─────────────────────────────────────────────────────

/** Returns true if the value is a non-null, non-empty string after trimming. */
export function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// ─── Aggregate Throw Helper ───────────────────────────────────────────────────

/**
 * Throws a ValidationError joining all messages if any errors exist.
 *
 * @param errors - Array of collected error message strings
 */
export function assertNoErrors(errors: string[]): void {
  if (errors.length > 0) {
    throw new ValidationError(errors.join(" | "));
  }
}
