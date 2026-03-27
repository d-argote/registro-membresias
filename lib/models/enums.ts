/**
 * Canonical Enums — registro-membresias
 *
 * This file is the SINGLE SOURCE OF TRUTH for all domain enums.
 *
 * ⚠️  BACKWARD COMPATIBILITY NOTICE
 * ─────────────────────────────────
 * The `EstadoMembresia` enum in `Membresia.ts` is preserved as-is.
 * New code SHOULD import from this file instead.
 * The numeric values (1=ACTIVA, 2=VENCIDA, 3=CONGELADA) are intentionally
 * identical to ensure the two definitions are interchangeable until
 * `Membresia.ts` is migrated.
 *
 * ADDED: SIN_MEMBRESIA = 0 (was missing from original enum).
 */

// ---------------------------------------------------------------------------
// EstadoMembresia
// Maps to DB table: estado_membresia (4 rows)
// ---------------------------------------------------------------------------

/**
 * Represents every possible membership state a client can be in.
 *
 * | Value | DB id | Meaning                                   |
 * |-------|-------|-------------------------------------------|
 * | 0     | 0     | Client has never had a membership         |
 * | 1     | 1     | Membership is active and within date      |
 * | 2     | 2     | Membership period has expired             |
 * | 3     | 3     | Membership is frozen (days preserved)     |
 */
export enum EstadoMembresia {
  SIN_MEMBRESIA = 0, // ← ADDED — was missing from original definition
  ACTIVA        = 1,
  VENCIDA       = 2,
  CONGELADA     = 3,
}

// ---------------------------------------------------------------------------
// ResultadoAcceso
// Maps to: log_auditoria_acceso.resultado (varchar) in DB
// ---------------------------------------------------------------------------

/**
 * All possible outcomes of a biometric access validation attempt.
 * These values MUST match whatever strings are stored in
 * `log_auditoria_acceso.resultado`.
 *
 * | Value                   | Meaning                                      |
 * |-------------------------|----------------------------------------------|
 * | AUTORIZADO              | Identity confirmed + membership active       |
 * | DENEGADO_VENCIDA        | Identity confirmed, membership expired       |
 * | DENEGADO_CONGELADA      | Identity confirmed, membership frozen        |
 * | DENEGADO_SIN_MEMBRESIA  | Identity confirmed, no membership on record  |
 * | NO_RECONOCIDO           | Biometric template did not match any client  |
 */
export enum ResultadoAcceso {
  AUTORIZADO             = "AUTORIZADO",
  DENEGADO_VENCIDA       = "DENEGADO_VENCIDA",
  DENEGADO_CONGELADA     = "DENEGADO_CONGELADA",
  DENEGADO_SIN_MEMBRESIA = "DENEGADO_SIN_MEMBRESIA",
  NO_RECONOCIDO          = "NO_RECONOCIDO",
}

/**
 * Convenience helper: returns true for any denied outcome.
 */
export function esResultadoDenegado(resultado: ResultadoAcceso): boolean {
  return resultado !== ResultadoAcceso.AUTORIZADO;
}
