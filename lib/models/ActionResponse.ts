/**
 * Types of errors that can occur generically across server actions.
 * - VALIDATION: User input failed schema or business rules.
 * - BUSINESS_LOGIC: State constraints, e.g. "Email already exists", "Membership inactive".
 * - SYSTEM: Database connection loss, unexpected crashes.
 * - AUTH: Current user is not authenticated or lacks permission.
 */
export type ErrorType = "VALIDATION" | "BUSINESS_LOGIC" | "SYSTEM" | "AUTH";

/**
 * Standardized error structure returned by all server actions.
 */
export interface StandardError {
  type: ErrorType;
  /** Human-friendly message safe for the UI */
  message: string;
  /** Optional field name this error relates to (e.g., 'email') */
  field?: string;
  /** Optional machine-readable code (e.g., 'DUP_EMAIL', 'DB_TIMEOUT') */
  code?: string;
}

/**
 * Standardized return type for all Next.js Server Actions.
 * Replaces `{ success: boolean; error: string }`.
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: StandardError };
