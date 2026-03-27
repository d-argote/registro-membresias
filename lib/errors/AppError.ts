/**
 * Base application error. Carries a machine-readable code
 * so callers can distinguish error categories without string matching.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Input did not pass format, range, or business-rule checks. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

/** Requested resource was not found in the database. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/** Caller does not have permission to perform the operation. */
export class AuthorizationError extends AppError {
  constructor(message: string) {
    super("AUTHORIZATION_ERROR", message);
    this.name = "AuthorizationError";
  }
}

/** A database operation failed unexpectedly. */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super("DATABASE_ERROR", message);
    this.name = "DatabaseError";
  }
}

/**
 * Converts any caught value to a safe, user-facing message.
 * Technical details are stripped; callers should log the original error separately.
 *
 * @param err  - The caught value from a catch block
 * @param fallback - Generic fallback message shown to end users
 */
export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof ValidationError) return err.message;
  if (err instanceof NotFoundError) return err.message;
  if (err instanceof AuthorizationError) return err.message;
  // DatabaseError and unknown errors get the generic fallback
  return fallback;
}
