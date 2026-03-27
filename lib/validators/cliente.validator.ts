import {
  isNonEmpty,
  isValidEmail,
  isValidPhone,
  isValidNombre,
  isValidIdCC,
  isValidIdCE,
  isValidIdPasaporte,
  sanitizeText,
  clampString,
} from "./common.validator";

// ─── Valid ID type values ─────────────────────────────────────────────────────

export type TipoIdentificacion = "CC" | "CE" | "PAS" | "TI";

interface ClientePayload {
  nombre: string;
  email: string;
  telefono: string;
  numero_identificacion: string;
  /** Document type — required for type-aware ID validation */
  tipo_identificacion?: TipoIdentificacion | string;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  tiene_discapacidad: boolean;
  descripcion_discapacidad?: string | null;
}

// ─── Year limits for birth date ───────────────────────────────────────────────

const MIN_BIRTH_YEAR = 1900;

/**
 * Returns an ID validation error message for the given document type,
 * or null if the value is valid.
 *
 * @param tipo - Document type (CC, TI, CE, PAS)
 * @param id   - Raw ID string to validate
 */
function validateIdByType(
  tipo: string | undefined,
  id: string
): string | null {
  const normalized = (tipo ?? "CC").toUpperCase();

  switch (normalized) {
    case "CC":
    case "TI":
      if (!isValidIdCC(id)) {
        return "La Cédula / Tarjeta de Identidad debe contener solo dígitos (6–12 números).";
      }
      return null;

    case "CE":
      if (!isValidIdCE(id)) {
        return "La Cédula de Extranjería debe tener 6–15 caracteres alfanuméricos.";
      }
      return null;

    case "PAS":
      if (!isValidIdPasaporte(id)) {
        return "El Pasaporte debe tener 6–20 caracteres alfanuméricos o guiones.";
      }
      return null;

    default:
      // Unknown type — fall back to safest rule (digits only)
      if (!isValidIdCC(id)) {
        return "El número de identificación no tiene un formato válido.";
      }
      return null;
  }
}

/**
 * Validates a ClientePayload before any database write.
 * Returns an array of user-facing error messages (empty = valid).
 *
 * @param data - Incoming payload from a form or API call
 */
export function validateClientePayload(data: ClientePayload): string[] {
  const errors: string[] = [];

  // ── Nombre ───────────────────────────────────────────────────────────────
  if (!isNonEmpty(data.nombre)) {
    errors.push("El nombre es obligatorio.");
  } else {
    const nombre = data.nombre.trim();
    if (nombre.length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres.");
    } else if (nombre.length > 100) {
      errors.push("El nombre no puede superar 100 caracteres.");
    } else if (!isValidNombre(nombre)) {
      errors.push(
        "El nombre solo puede contener letras, espacios, guiones y puntos (sin números ni caracteres especiales)."
      );
    }
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (!isNonEmpty(data.email)) {
    errors.push("El correo electrónico es obligatorio.");
  } else if (!isValidEmail(data.email)) {
    errors.push("El correo electrónico no tiene un formato válido (ej. nombre@dominio.com).");
  }

  // ── Teléfono ──────────────────────────────────────────────────────────────
  if (!isNonEmpty(data.telefono)) {
    errors.push("El teléfono es obligatorio.");
  } else if (!isValidPhone(data.telefono)) {
    errors.push("El teléfono debe contener solo números (ej. 3001234567 o +57 3001234567).");
  }

  // ── Número de identificación (type-aware) ─────────────────────────────────
  if (!isNonEmpty(data.numero_identificacion)) {
    errors.push("El número de identificación es obligatorio.");
  } else {
    const idError = validateIdByType(
      data.tipo_identificacion,
      data.numero_identificacion.trim()
    );
    if (idError) errors.push(idError);
  }

  // ── Fecha de nacimiento (opcional) ────────────────────────────────────────
  if (isNonEmpty(data.fecha_nacimiento)) {
    const birthDate = new Date(data.fecha_nacimiento + "T00:00:00");

    if (isNaN(birthDate.getTime())) {
      errors.push("La fecha de nacimiento no es válida.");
    } else if (birthDate.getFullYear() < MIN_BIRTH_YEAR) {
      errors.push(`El año de nacimiento no puede ser anterior a ${MIN_BIRTH_YEAR}.`);
    } else if (birthDate >= new Date()) {
      errors.push("La fecha de nacimiento debe ser una fecha pasada.");
    } else {
      const ageMs = Date.now() - birthDate.getTime();
      const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 5) {
        errors.push("La edad mínima para registrarse es de 5 años.");
      }
    }
  }

  // ── Descripción discapacidad (condicional) ────────────────────────────────
  if (data.tiene_discapacidad) {
    const desc = data.descripcion_discapacidad ?? "";
    if (desc.length > 500) {
      errors.push("La descripción de discapacidad no puede superar 500 caracteres.");
    }
  }

  return errors;
}

/**
 * Sanitizes all mutable string fields in a ClientePayload.
 * Call before validateClientePayload to strip XSS payloads.
 *
 * @param data - Payload to sanitize (returns new object)
 */
export function sanitizeClientePayload(data: ClientePayload): ClientePayload {
  return {
    ...data,
    nombre: clampString(data.nombre, 100),
    email: data.email.trim().toLowerCase().slice(0, 254),
    telefono: data.telefono.trim().replace(/\s/g, "").slice(0, 15),
    numero_identificacion: sanitizeText(data.numero_identificacion).slice(0, 20),
    direccion: data.direccion ? clampString(data.direccion, 200) : null,
    descripcion_discapacidad: data.descripcion_discapacidad
      ? clampString(data.descripcion_discapacidad, 500)
      : null,
  };
}
