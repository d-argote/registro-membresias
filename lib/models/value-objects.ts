/**
 * Value Objects — registro-membresias
 *
 * Value Objects (VOs) are small, immutable objects that encapsulate a concept
 * along with its validation and behavior. They have no identity of their own —
 * two VOs with the same data are considered equal.
 *
 * ⚠️  THESE ARE ADDITIVE ONLY.
 * Existing code using raw numbers for metodo_pago_id, string roles, etc.
 * is NOT broken. These VOs provide richer typing for new code going forward.
 *
 * Maps to DB lookup tables:
 *   MetodoPago        → metodo_pago        (id, nombre)
 *   Rol               → rol_usuario        (id, nombre)
 *   TipoDispositivo   → (no dedicated table — logical VO only)
 *   MotivoDenegacion  → (no dedicated table — used in log_auditoria_acceso)
 */

// ---------------------------------------------------------------------------
// MetodoPago
// DB table: metodo_pago (currently 4 rows: Efectivo, Débito/Crédito, etc.)
// ---------------------------------------------------------------------------

/** Known payment method IDs as stored in the DB. */
export const METODO_PAGO_IDS = {
  EFECTIVO:             1,
  TARJETA_DEBITO_CREDITO: 2,
  TRANSFERENCIA:        3,
} as const;

/**
 * Represents a payment method with its identifier, display name, and validity.
 * Replaces raw `metodoPagoId: number` usage in TransaccionPago.
 */
export class MetodoPago {
  public readonly id: number;
  public readonly nombre: string;

  constructor(id: number, nombre: string) {
    this.id = id;
    this.nombre = nombre;
  }

  /**
   * Returns true when this method maps to a known, accepted payment type.
   * Extend this list as new methods are added to the DB.
   */
  esValido(): boolean {
    return Object.values(METODO_PAGO_IDS).includes(
      this.id as (typeof METODO_PAGO_IDS)[keyof typeof METODO_PAGO_IDS]
    );
  }

  toString(): string {
    return this.nombre;
  }

  /** Factory: build from a raw DB row `{ id, nombre }`. */
  static fromRow(row: { id: number; nombre: string }): MetodoPago {
    return new MetodoPago(row.id, row.nombre);
  }

  /** Factory: build from a known ID using the built-in label map. */
  static fromId(id: number): MetodoPago {
    const labels: Record<number, string> = {
      [METODO_PAGO_IDS.EFECTIVO]:               "Efectivo",
      [METODO_PAGO_IDS.TARJETA_DEBITO_CREDITO]: "Tarjeta Débito/Crédito",
      [METODO_PAGO_IDS.TRANSFERENCIA]:           "Transferencia Bancaria",
    };
    return new MetodoPago(id, labels[id] ?? "Otro");
  }
}

// ---------------------------------------------------------------------------
// TipoDispositivo
// Logical VO — classifies devices that interact with access control.
// ---------------------------------------------------------------------------

/** Supported device categories in the access control system. */
export type NombreTipoDispositivo = "LECTOR_BIOMETRICO" | "TORNIQUETE" | "PANEL_CONTROL";

/**
 * Describes the role a physical device plays in the access control flow.
 * A device is either a biometric reader, a turnstile, or a control panel.
 */
export class TipoDispositivo {
  public readonly nombre: NombreTipoDispositivo;

  constructor(nombre: NombreTipoDispositivo) {
    this.nombre = nombre;
  }

  /**
   * Returns true if this device reads biometric data (fingerprint scanner).
   */
  esLector(): boolean {
    return this.nombre === "LECTOR_BIOMETRICO";
  }

  /**
   * Returns true if this device controls physical entry (turnstile gate).
   */
  esTorniquete(): boolean {
    return this.nombre === "TORNIQUETE";
  }

  toString(): string {
    return this.nombre;
  }

  /** Pre-built singleton instances for convenience. */
  static readonly LECTOR   = new TipoDispositivo("LECTOR_BIOMETRICO");
  static readonly TORNIQUETE = new TipoDispositivo("TORNIQUETE");
  static readonly PANEL    = new TipoDispositivo("PANEL_CONTROL");
}

// ---------------------------------------------------------------------------
// Rol
// DB table: rol_usuario (id, nombre)
// Currently 4 rows: ADMINISTRADOR, RECEPCIONISTA, ENTRENADOR, SOPORTE_TECNICO
// ---------------------------------------------------------------------------

/** Permission tokens that can be checked via `Rol.tienePermiso()`. */
export type Permiso =
  | "GESTIONAR_CLIENTES"
  | "GESTIONAR_MEMBRESIAS"
  | "GESTIONAR_USUARIOS"
  | "VER_REPORTES"
  | "GESTIONAR_ENTRENAMIENTOS"
  | "SOPORTE_SISTEMA";

/** Static permission map — defines what each role is authorized to do. */
const PERMISOS_POR_ROL: Record<string, Permiso[]> = {
  ADMINISTRADOR: [
    "GESTIONAR_CLIENTES",
    "GESTIONAR_MEMBRESIAS",
    "GESTIONAR_USUARIOS",
    "VER_REPORTES",
    "GESTIONAR_ENTRENAMIENTOS",
    "SOPORTE_SISTEMA",
  ],
  RECEPCIONISTA: [
    "GESTIONAR_CLIENTES",
    "GESTIONAR_MEMBRESIAS",
  ],
  ENTRENADOR: [
    "GESTIONAR_ENTRENAMIENTOS",
  ],
  SOPORTE_TECNICO: [
    "SOPORTE_SISTEMA",
    "VER_REPORTES",
  ],
};

/**
 * Represents a system role with its display name, description, and permissions.
 * Wraps the `rol_usuario` DB lookup table.
 */
export class Rol {
  public readonly id: number;
  public readonly nombre: string;
  public readonly descripcion: string;

  constructor(id: number, nombre: string, descripcion: string) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  /**
   * Returns true if this role includes the requested permission.
   * Permission checking is done against a static map — no DB call needed.
   */
  tienePermiso(permiso: Permiso): boolean {
    const permisos = PERMISOS_POR_ROL[this.nombre.toUpperCase()] ?? [];
    return permisos.includes(permiso);
  }

  toString(): string {
    return this.nombre;
  }

  /** Factory: build from a DB row `{ id, nombre }`. */
  static fromRow(row: { id: number; nombre: string }): Rol {
    const descripciones: Record<string, string> = {
      ADMINISTRADOR:   "Acceso total al sistema",
      RECEPCIONISTA:   "Gestión de clientes y membresías",
      ENTRENADOR:      "Gestión de planes de entrenamiento",
      SOPORTE_TECNICO: "Mantenimiento del sistema y dispositivos",
    };
    const key = row.nombre.toUpperCase();
    return new Rol(row.id, row.nombre, descripciones[key] ?? "Sin descripción");
  }
}

// ---------------------------------------------------------------------------
// MotivoDenegacion
// Logical VO — wraps the denial reason stored in log_auditoria_acceso.
// ---------------------------------------------------------------------------

/**
 * Encapsulates the human-readable description of why access was denied.
 * Provides a typed wrapper over the raw `motivo_denegacion` varchar in DB.
 */
export class MotivoDenegacion {
  public readonly descripcion: string;

  constructor(descripcion: string) {
    if (!descripcion || descripcion.trim().length === 0) {
      throw new Error("MotivoDenegacion: descripcion cannot be empty.");
    }
    this.descripcion = descripcion.trim();
  }

  toString(): string {
    return this.descripcion;
  }

  /** Pre-built common denial reasons for use at access control points. */
  static readonly MEMBRESIA_VENCIDA    = new MotivoDenegacion("Membresía vencida");
  static readonly MEMBRESIA_CONGELADA  = new MotivoDenegacion("Membresía congelada");
  static readonly SIN_MEMBRESIA        = new MotivoDenegacion("Cliente sin membresía registrada");
  static readonly NO_RECONOCIDO        = new MotivoDenegacion("Huella dactilar no reconocida");
}
