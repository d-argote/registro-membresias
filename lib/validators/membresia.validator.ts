import { isNonEmpty, isValidUUID } from "./common.validator";

const VALID_TIPO_MEMBRESIA = new Set([1, 2]);
const VALID_METODO_PAGO = new Set([1, 2, 3]);
const MONTO_MAX = 10_000_000;

/**
 * Validates the payload for registering a payment.
 * Returns an array of user-facing error messages (empty = valid).
 *
 * @param data - Payment registration data
 */
export function validatePagoPayload(data: {
  cliente_id: string;
  tipo_membresia_id: number;
  metodo_pago_id: number;
  monto: number;
}): string[] {
  const errors: string[] = [];

  if (!isNonEmpty(data.cliente_id) || !isValidUUID(data.cliente_id)) {
    errors.push("El identificador de cliente no es válido.");
  }

  if (!VALID_TIPO_MEMBRESIA.has(data.tipo_membresia_id)) {
    errors.push("El tipo de membresía no es válido (use 1 = Mensual, 2 = Anual).");
  }

  if (!VALID_METODO_PAGO.has(data.metodo_pago_id)) {
    errors.push("El método de pago no es válido.");
  }

  if (typeof data.monto !== "number" || isNaN(data.monto)) {
    errors.push("El monto debe ser un número.");
  } else if (data.monto <= 0) {
    errors.push("El monto debe ser mayor que cero.");
  } else if (data.monto > MONTO_MAX) {
    errors.push(`El monto no puede superar ${MONTO_MAX.toLocaleString("es-CO")}.`);
  }

  return errors;
}

/**
 * Validates the identifiers required to freeze or reactivate a membership.
 * Returns an array of error messages (empty = valid).
 *
 * @param membresia_id - UUID of the membership record
 * @param cliente_id   - UUID of the client owning the membership
 */
export function validateMembresiaIds(
  membresia_id: string,
  cliente_id: string
): string[] {
  const errors: string[] = [];

  if (!isNonEmpty(membresia_id) || !isValidUUID(membresia_id)) {
    errors.push("El identificador de membresía no es válido.");
  }

  if (!isNonEmpty(cliente_id) || !isValidUUID(cliente_id)) {
    errors.push("El identificador de cliente no es válido.");
  }

  return errors;
}
