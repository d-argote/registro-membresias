"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabaseServer";
import { validateClientePayload, sanitizeClientePayload } from "@/lib/utils/validators/cliente.validator";
import { toUserMessage } from "@/lib/errors/AppError";
import { AuthService } from "@/lib/services/auth.service";
import type { ActionResponse } from "@/lib/models/ActionResponse";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ClientePayload {
  numero_identificacion: string;
  tipo_identificacion?: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  tiene_discapacidad: boolean;
  descripcion_discapacidad?: string | null;
}

interface PlantillaPayload {
  dedo: string;
  score: number;
}

interface RegistrarClienteInput {
  cliente: ClientePayload;
  plantillas: PlantillaPayload[];
}

// ─── Server Actions ─────────────────────────────────────────────────────────

/**
 * Verifica si ya existe un cliente con la misma identificación o correo.
 * Utilizado para pre-validar antes del paso de biometría.
 */
export async function verificarClienteExiste(
  identificacion: string,
  email: string
): Promise<ActionResponse<boolean>> {
  const supabase = getServerClient();

  try {
    const { data, error } = await supabase
      .from("cliente")
      .select("id, numero_identificacion, email")
      .or(`numero_identificacion.eq.${identificacion},email.eq.${email}`)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const match = data[0];
      if (match.numero_identificacion === identificacion) {
        return { 
          success: false, 
          error: { type: "BUSINESS_LOGIC", message: "Ya existe un cliente con esta identificación." }
        };
      }
      if (match.email === email) {
        return { 
          success: false, 
          error: { type: "BUSINESS_LOGIC", message: "Ya existe un cliente con este correo electrónico." }
        };
      }
    }

    return { success: true, data: false };
  } catch (err: unknown) {
    console.error("[verificarClienteExiste] Error:", err);
    return { 
      success: false, 
      error: { type: "SYSTEM", message: "Error al verificar datos. Intente de nuevo." }
    };
  }
}

/**
 * Registers a new client along with their biometric templates.
 * Validates and sanitizes all input before writing to the database.
 * Rolls back the client record if biometric insertion fails.
 *
 * @param input - Client data and fingerprint plantillas
 */
export async function registrarCliente(
  input: RegistrarClienteInput
): Promise<ActionResponse<{ clienteId: string; emailWarning?: string }>> {
  const supabase = getServerClient();

  try {
    // 1. Sanitize first, then validate
    const sanitized = sanitizeClientePayload(input.cliente);
    const errors = validateClientePayload(sanitized);

    if (errors.length > 0) {
      return { 
        success: false, 
        error: { type: "VALIDATION", message: errors.join(" | ") } 
      };
    }

    // 2. Insert client
    const { data: clienteData, error: clienteError } = await supabase
      .from("cliente")
      .insert([
        {
          numero_identificacion: sanitized.numero_identificacion,
          nombre: sanitized.nombre,
          email: sanitized.email,
          telefono: sanitized.telefono,
          direccion: sanitized.direccion ?? null,
          fecha_nacimiento: sanitized.fecha_nacimiento ?? null,
          tiene_discapacidad: sanitized.tiene_discapacidad,
          descripcion_discapacidad: sanitized.tiene_discapacidad
            ? (sanitized.descripcion_discapacidad ?? null)
            : null,
        },
      ])
      .select("id")
      .single();

    if (clienteError) {
      console.error("[registrarCliente] DB error:", clienteError);

      // PostgreSQL unique violation — give a specific, actionable message
      if (clienteError.code === "23505") {
        const detail = clienteError.details ?? clienteError.message ?? "";
        if (detail.includes("email")) {
          return { success: false, error: { type: "BUSINESS_LOGIC", message: "Ya existe un cliente registrado con ese correo electrónico.", field: "email" } };
        }
        if (detail.includes("numero_identificacion")) {
          return { success: false, error: { type: "BUSINESS_LOGIC", message: "Ya existe un cliente registrado con ese número de identificación.", field: "numero_identificacion" } };
        }
        return { success: false, error: { type: "BUSINESS_LOGIC", message: "Ya existe un cliente con estos datos (correo o identificación duplicados)." } };
      }

      return { success: false, error: { type: "SYSTEM", message: "No se pudo registrar el cliente debido a un error del sistema." } };
    }

    const clienteId = clienteData.id as string;

    // 3. Insert biometric templates
    const plantillas = input.plantillas.map((p) => ({
      cliente_id: clienteId,
      dedo: p.dedo,
      huella_cifrada: Buffer.from(
        `aes256_mock_${p.dedo}_${Date.now()}_${Math.random().toString(36).slice(2)}`
      ).toString("base64"),
      score_calidad: p.score,
    }));

    const { error: bioError } = await supabase
      .from("plantilla_biometrica")
      .insert(plantillas);

    if (bioError) {
      console.error("[registrarCliente] Biometric error:", bioError);
      // Best-effort rollback
      await supabase.from("cliente").delete().eq("id", clienteId);
      return { success: false, error: { type: "SYSTEM", message: "Error guardando biometría. El registro fue revertido." } };
    }

    let emailWarning: string | undefined;
    try {
      const result = await AuthService.invitarCliente(sanitized.email, sanitized.nombre);

      // Si fue encolado, mostrar mensaje diferente
      if (result && typeof result === 'object' && 'queued' in result && result.queued) {
        emailWarning = "Nota: El email está en cola y se enviará en pocos minutos.";
      } else {
        console.log(`[registrarCliente] Email enviado exitosamente para: ${sanitized.email}`);
      }
    } catch (inviteError: any) {
      const errorMsg = inviteError instanceof Error ? inviteError.message : String(inviteError);
      console.error(`[registrarCliente] Auth invite failed for ${sanitized.email}: ${errorMsg}`);

      // Manejo especial para rate limit
      if (errorMsg.includes("rate limit")) {
        emailWarning = "Nota: El servicio de email está con límite de velocidad. El email se procesará automáticamente en pocos minutos.";
      } else {
        emailWarning = `Aviso: El correo no se envió (${errorMsg}). Usa el botón 'Reenviar' en la lista de clientes.`;
      }
    }

    revalidatePath("/dashboard/clientes");
    return { success: true, data: { clienteId, emailWarning } };
  } catch (err: unknown) {
    console.error("[registrarCliente] Unexpected error:", err);
    return { 
      success: false, 
      error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al registrar el cliente.") } 
    };
  }
}

/**
 * Reenvía el correo de invitación a un cliente existente.
 * Útil si el primer envío falló.
 *
 * @param clienteId - UUID del cliente
 */
export async function reenviarInvitacionCliente(clienteId: string): Promise<ActionResponse> {
  const supabase = getServerClient();

  try {
    // Obtener datos del cliente
    const { data: clienteData, error: fetchError } = await supabase
      .from("cliente")
      .select("id, email, nombre")
      .eq("id", clienteId)
      .single();

    if (fetchError || !clienteData) {
      return { success: false, error: { type: "BUSINESS_LOGIC", message: "Cliente no encontrado." } };
    }

    // Reenviar invitación
    try {
      await AuthService.invitarCliente(clienteData.email, clienteData.nombre);
      console.log(`[reenviarInvitacionCliente] Invitación reenviada exitosamente a: ${clienteData.email}`);
      return { success: true, data: undefined };
    } catch (inviteError: any) {
      const errorMsg = inviteError instanceof Error ? inviteError.message : String(inviteError);

      // Si es rate limit, sugerir esperar
      if (errorMsg.includes("rate limit")) {
        console.error(`[reenviarInvitacionCliente] Rate limit hit: ${errorMsg}`);
        return {
          success: false,
          error: {
            type: "SYSTEM",
            message: "Demasiados reintentos. Por favor espera 5 minutos antes de intentar de nuevo."
          }
        };
      }

      console.error(`[reenviarInvitacionCliente] Error reenviando invitación: ${errorMsg}`);
      return {
        success: false,
        error: {
          type: "SYSTEM",
          message: `No se pudo reenviar el correo: ${errorMsg}`
        }
      };
    }
  } catch (err: unknown) {
    console.error("[reenviarInvitacionCliente] Unexpected error:", err);
    return {
      success: false,
      error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al reenviar invitación.") }
    };
  }
}

/**
 * Elimina un cliente completamente del sistema (BD y Auth).
 * Solo administradores pueden ejecutar esto.
 *
 * @param clienteId - UUID del cliente a eliminar
 */
export async function eliminarCliente(clienteId: string): Promise<ActionResponse> {
  const supabase = getServerClient();

  try {
    // 1. Obtener el ID de auth del cliente (que es el mismo que el ID del cliente en la tabla)
    const { data: clienteData, error: fetchError } = await supabase
      .from("cliente")
      .select("id, email")
      .eq("id", clienteId)
      .single();

    if (fetchError || !clienteData) {
      return { success: false, error: { type: "BUSINESS_LOGIC", message: "Cliente no encontrado." } };
    }

    // 2. Eliminar plantillas biométricas primero (por FK)
    const { error: bioError } = await supabase
      .from("plantilla_biometrica")
      .delete()
      .eq("cliente_id", clienteId);

    if (bioError) {
      console.error("[eliminarCliente] Error eliminando plantillas:", bioError);
      return { success: false, error: { type: "SYSTEM", message: "Error al eliminar registros asociados." } };
    }

    // 3. Eliminar cliente de la tabla
    const { error: deleteError } = await supabase
      .from("cliente")
      .delete()
      .eq("id", clienteId);

    if (deleteError) {
      console.error("[eliminarCliente] Error eliminando cliente de BD:", deleteError);
      return { success: false, error: { type: "SYSTEM", message: "Error al eliminar el cliente." } };
    }

    // 4. Intentar eliminar de Auth (si existe)
    try {
      await AuthService.eliminarUsuarioAuth(clienteId);
      console.log(`[eliminarCliente] Usuario eliminado correctamente de Auth: ${clienteId}`);
    } catch (authError: any) {
      const errorMsg = authError instanceof Error ? authError.message : String(authError);
      console.warn(`[eliminarCliente] No se pudo eliminar de Auth ${clienteId}: ${errorMsg}`);
      // Continuar de todas formas - lo importante es que se eliminó de BD
    }

    // 5. Limpiar cache
    revalidatePath("/dashboard/clientes");

    console.log(`[eliminarCliente] Cliente ${clienteId} (${clienteData.email}) eliminado exitosamente`);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    console.error("[eliminarCliente] Unexpected error:", err);
    return {
      success: false,
      error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al eliminar el cliente.") }
    };
  }
}

/**
 * Updates mutable fields of an existing client record.
 * Validates and sanitizes all provided fields before writing.
 *
 * @param id   - UUID of the client to update
 * @param data - Partial payload with fields to update
 */
export async function actualizarCliente(
  id: string,
  data: Partial<ClientePayload>
): Promise<ActionResponse> {
  const supabase = getServerClient();

  try {
    // Merge partial payload into a full payload for validation
    const merged: ClientePayload = {
      nombre: data.nombre ?? "",
      email: data.email ?? "",
      telefono: data.telefono ?? "",
      numero_identificacion: data.numero_identificacion ?? "",
      direccion: data.direccion,
      fecha_nacimiento: data.fecha_nacimiento,
      tiene_discapacidad: data.tiene_discapacidad ?? false,
      descripcion_discapacidad: data.descripcion_discapacidad,
    };

    const sanitized = sanitizeClientePayload(merged);
    const errors = validateClientePayload(sanitized);

    if (errors.length > 0) {
      return { success: false, error: { type: "VALIDATION", message: errors.join(" | ") } };
    }

    const { error } = await supabase
      .from("cliente")
      .update({
        numero_identificacion: sanitized.numero_identificacion,
        nombre: sanitized.nombre,
        email: sanitized.email,
        telefono: sanitized.telefono,
        direccion: sanitized.direccion,
        fecha_nacimiento: sanitized.fecha_nacimiento,
        tiene_discapacidad: sanitized.tiene_discapacidad,
        descripcion_discapacidad: sanitized.tiene_discapacidad
          ? sanitized.descripcion_discapacidad
          : null,
      })
      .eq("id", id);

    if (error) {
      console.error("[actualizarCliente] DB error:", error);
      if (error.code === "23505") {
        return { success: false, error: { type: "BUSINESS_LOGIC", message: "Ya existe un cliente con esta identificación o correo." } };
      }
      return { success: false, error: { type: "SYSTEM", message: "No se pudo actualizar el cliente debido a un error del sistema." } };
    }

    revalidatePath(`/dashboard/clientes/${id}`);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    console.error("[actualizarCliente] Unexpected error:", err);
    return { success: false, error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al actualizar el cliente.") } };
  }
}
