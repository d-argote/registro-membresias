/**
 * Domain Interfaces — registro-membresias
 *
 * These interfaces define the behavioral contracts established in the UML model.
 * They are declared here as pure TypeScript interfaces and applied progressively.
 *
 * Existing classes are NOT modified. New classes SHOULD implement these.
 */

// ---------------------------------------------------------------------------
// IAccesible
// Implemented by: Cliente (future), any entity requiring physical access gates.
// ---------------------------------------------------------------------------

/**
 * Contract for entities that can be validated for physical access.
 * The implementation checks membership status, biometric identity, or both.
 */
export interface IAccesible {
  /**
   * Returns true if the entity is currently authorized to enter.
   * Must evaluate active membership, freeze status, and identity.
   */
  validarAcceso(): boolean;
}

// ---------------------------------------------------------------------------
// IAutenticable
// Implemented by: UsuarioSistema (future).
// ---------------------------------------------------------------------------

/**
 * Contract for system actors that can open and close authenticated sessions.
 */
export interface IAutenticable {
  /**
   * Initiates an authenticated session.
   * @returns true on success, false on invalid credentials.
   */
  iniciarSesion(): boolean;

  /**
   * Terminates the current authenticated session and clears credentials.
   */
  cerrarSesion(): void;
}

// ---------------------------------------------------------------------------
// IReportable
// Implemented by: ModuloReportes.
// ---------------------------------------------------------------------------

/**
 * Contract for any module capable of generating and exporting domain reports.
 */
export interface IReportable {
  /**
   * Generates the primary report for this module.
   * Implementations decide what "primary" means in context.
   */
  generarReporte(): void;

  /**
   * Exports data in the requested format.
   * @param formato - Target format identifier, e.g. 'pdf', 'csv', 'json'.
   */
  exportar(formato: string): void;
}
