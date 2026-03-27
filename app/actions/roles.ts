"use server";

import { createClient } from "@supabase/supabase-js";
import { RolUsuario } from "@/lib/models/usuario_sistema.model";
import { isValidEmail, isNonEmpty, sanitizeText } from "@/lib/validators/common.validator";
import { toUserMessage } from "@/lib/errors/AppError";
import type { ActionResponse } from "@/lib/models/ActionResponse";

// ─── Admin Supabase client (service role) ──────────────────────────────────

function getServerAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada. No se pueden realizar acciones administrativas.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getAnonClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateCrearUsuarioDatos(datos: { nombre: string; email: string; password?: string }): string[] {
  const errors: string[] = [];

  const nombre = sanitizeText(datos.nombre ?? "");
  if (!isNonEmpty(nombre)) {
    errors.push("El nombre es obligatorio.");
  } else if (nombre.length < 2 || nombre.length > 100) {
    errors.push("El nombre debe tener entre 2 y 100 caracteres.");
  }

  if (!isNonEmpty(datos.email)) {
    errors.push("El correo electrónico es obligatorio.");
  } else if (!isValidEmail(datos.email)) {
    errors.push("El correo electrónico no tiene un formato válido.");
  }

  if (datos.password !== undefined && datos.password !== "") {
    if (datos.password.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres.");
    }
  }

  return errors;
}

// ─── Server Action ───────────────────────────────────────────────────────────

/**
 * Creates a new system user. Requires the caller to be an authenticated Administrator.
 * Validates input, verifies role, creates the Auth user, then inserts into usuario_sistema.
 * Rolls back the Auth user if the DB insert fails.
 *
 * @param token  - JWT access token of the requesting user
 * @param datos  - New user's name, email, and optional password
 * @param rolId  - Role to assign to the new user
 */
export async function crearUsuarioAdmin(
  token: string,
  datos: { nombre: string; email: string; password?: string },
  rolId: RolUsuario
): Promise<ActionResponse> {
  try {
    // 1. Validate input first
    const errors = validateCrearUsuarioDatos(datos);
    if (errors.length > 0) {
      return { success: false, error: { type: "VALIDATION", message: errors.join(" | ") } };
    }

    // 2. Verify identity of requesting user
    const anonClient = getAnonClient(token);
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return { success: false, error: { type: "AUTH", message: "No autorizado. Sesión inválida." } };
    }

    // 3. Verify the requester has ADMINISTRATOR role
    const adminClient = getServerAdminClient();
    const { data: solicitante, error: solicitanteError } = await adminClient
      .from("usuario_sistema")
      .select("rol_id")
      .eq("id", user.id)
      .single();

    if (solicitanteError || !solicitante) {
      return { success: false, error: { type: "SYSTEM", message: "No se pudo verificar el rol del usuario." } };
    }

    if (solicitante.rol_id !== RolUsuario.ADMINISTRADOR) {
      return { success: false, error: { type: "AUTH", message: "Acceso denegado. Solo los Administradores pueden crear usuarios." } };
    }

    // 4. Create the new Auth user
    const { data: newAuthUser, error: newAuthError } = await adminClient.auth.admin.createUser({
      email: datos.email.trim().toLowerCase(),
      password: datos.password || "Temp123456!",
      email_confirm: true,
      user_metadata: { nombre: sanitizeText(datos.nombre), rol_id: rolId },
    });

    if (newAuthError) {
      console.error("[crearUsuarioAdmin] Auth error:", newAuthError);
      return { success: false, error: { type: "BUSINESS_LOGIC", message: "No se pudo crear el usuario. Verifique que el correo no esté en uso." } };
    }

    const authUserId = newAuthUser.user.id;

    // 5. Insert into usuario_sistema; rollback Auth user if this fails
    const { error: userError } = await adminClient
      .from("usuario_sistema")
      .insert([
        {
          id: authUserId,
          nombre: sanitizeText(datos.nombre),
          email: datos.email.trim().toLowerCase(),
          rol_id: rolId,
          activo: true,
        },
      ]);

    if (userError) {
      console.error("[crearUsuarioAdmin] DB error:", userError);
      await adminClient.auth.admin.deleteUser(authUserId);
      return { success: false, error: { type: "SYSTEM", message: "Error al registrar el usuario en el sistema. La operación fue revertida." } };
    }

    return { success: true, data: undefined };
  } catch (err: unknown) {
    console.error("[crearUsuarioAdmin] Unexpected error:", err);
    return { success: false, error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al crear el usuario.") } };
  }
}
