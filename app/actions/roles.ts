"use server";

import { createClient } from "@supabase/supabase-js";
import { RolUsuario } from "@/lib/models/domain/UsuarioSistema";
import { isValidEmail, isNonEmpty, sanitizeText } from "@/lib/utils/validators/common.validator";
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

// ─── Edit User Info ──────────────────────────────────────────────────────────

/**
 * Updates user information (name, email, active status).
 * Requires the caller to be an Administrator.
 * Updates both Auth and usuario_sistema tables.
 *
 * @param token  - JWT access token of the requesting user
 * @param userId - ID of user to update
 * @param datos  - Fields to update (nombre, email, activo)
 */
export async function editarUsuario(
  token: string,
  userId: string,
  datos: { nombre?: string; email?: string; activo?: boolean }
): Promise<ActionResponse> {
  try {
    // 1. Verify requesting user is an Administrator
    const anonClient = getAnonClient(token);
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return { success: false, error: { type: "AUTH", message: "No autorizado. Sesión inválida." } };
    }

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
      return { success: false, error: { type: "AUTH", message: "Acceso denegado. Solo los Administradores pueden editar usuarios." } };
    }

    // 2. Validate input data
    const updateData: any = {};
    const errors: string[] = [];

    if (datos.nombre !== undefined) {
      const nombre = sanitizeText(datos.nombre);
      if (!isNonEmpty(nombre)) {
        errors.push("El nombre no puede estar vacío.");
      } else if (nombre.length < 2 || nombre.length > 100) {
        errors.push("El nombre debe tener entre 2 y 100 caracteres.");
      } else {
        updateData.nombre = nombre;
      }
    }

    if (datos.email !== undefined) {
      if (!isNonEmpty(datos.email)) {
        errors.push("El correo electrónico no puede estar vacío.");
      } else if (!isValidEmail(datos.email)) {
        errors.push("El correo electrónico no tiene un formato válido.");
      } else {
        updateData.email = datos.email.trim().toLowerCase();
      }
    }

    if (datos.activo !== undefined) {
      updateData.activo = datos.activo;
    }

    if (errors.length > 0) {
      return { success: false, error: { type: "VALIDATION", message: errors.join(" | ") } };
    }

    // 3. Update usuario_sistema
    const { error: updateError } = await adminClient
      .from("usuario_sistema")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("[editarUsuario] DB error:", updateError);
      return { success: false, error: { type: "SYSTEM", message: "Error al actualizar el usuario. Intente nuevamente." } };
    }

    // 4. If email changed, update Auth user
    if (updateData.email) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        email: updateData.email,
      });

      if (authUpdateError) {
        console.error("[editarUsuario] Auth update error:", authUpdateError);
        return { success: false, error: { type: "SYSTEM", message: "Error al actualizar el email en autenticación." } };
      }
    }

    return { success: true, data: undefined };
  } catch (err: unknown) {
    console.error("[editarUsuario] Unexpected error:", err);
    return { success: false, error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al editar el usuario.") } };
  }
}

// ─── Change User Role ────────────────────────────────────────────────────────

/**
 * Changes a user's role. ONLY ADMINISTRATORS can perform this action.
 * Updates the usuario_sistema table with the new role.
 *
 * @param token  - JWT access token of the requesting user
 * @param userId - ID of user whose role will be changed
 * @param nuevoRol - New role to assign
 */
export async function cambiarRolUsuario(
  token: string,
  userId: string,
  nuevoRol: RolUsuario
): Promise<ActionResponse> {
  try {
    // 1. Verify requesting user is an Administrator
    const anonClient = getAnonClient(token);
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return { success: false, error: { type: "AUTH", message: "No autorizado. Sesión inválida." } };
    }

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
      return { success: false, error: { type: "AUTH", message: "Acceso denegado. Solo los Administradores pueden cambiar roles." } };
    }

    // 2. Validate new role
    const rolesValidos = Object.values(RolUsuario).filter(v => typeof v === 'number');
    if (!rolesValidos.includes(nuevoRol)) {
      return { success: false, error: { type: "VALIDATION", message: "El rol especificado no es válido." } };
    }

    // 3. Prevent changing own role
    if (userId === user.id) {
      return { success: false, error: { type: "BUSINESS_LOGIC", message: "No puedes cambiar tu propio rol." } };
    }

    // 4. Update user role
    const { error: updateError } = await adminClient
      .from("usuario_sistema")
      .update({ rol_id: nuevoRol })
      .eq("id", userId);

    if (updateError) {
      console.error("[cambiarRolUsuario] DB error:", updateError);
      return { success: false, error: { type: "SYSTEM", message: "Error al cambiar el rol. Intente nuevamente." } };
    }

    return { success: true, data: undefined };
  } catch (err: unknown) {
    console.error("[cambiarRolUsuario] Unexpected error:", err);
    return { success: false, error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al cambiar el rol.") } };
  }
}

// ─── Delete User Permanently ──────────────────────────────────────────────────

/**
 * Permanently deletes a user from both usuario_sistema and auth.users tables.
 * ONLY ADMINISTRATORS can perform this action.
 * Cannot delete yourself.
 *
 * @param token  - JWT access token of the requesting user
 * @param userId - ID of user to delete
 */
export async function eliminarUsuarioPermanentemente(
  token: string,
  userId: string
): Promise<ActionResponse> {
  try {
    // 1. Verify requesting user is an Administrator
    const anonClient = getAnonClient(token);
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return { success: false, error: { type: "AUTH", message: "No autorizado. Sesión inválida." } };
    }

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
      return { success: false, error: { type: "AUTH", message: "Acceso denegado. Solo los Administradores pueden eliminar usuarios." } };
    }

    // 2. Prevent deleting yourself
    if (userId === user.id) {
      return { success: false, error: { type: "BUSINESS_LOGIC", message: "No puedes eliminar tu propia cuenta." } };
    }

    // 3. Delete from usuario_sistema first (foreign key might exist)
    const { error: dbDeleteError } = await adminClient
      .from("usuario_sistema")
      .delete()
      .eq("id", userId);

    if (dbDeleteError) {
      console.error("[eliminarUsuarioPermanentemente] DB delete error:", dbDeleteError);
      return { success: false, error: { type: "SYSTEM", message: "Error al eliminar el usuario de la base de datos." } };
    }

    // 4. Delete from auth.users
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("[eliminarUsuarioPermanentemente] Auth delete error:", authDeleteError);
      // Log but don't fail completely - user is already removed from usuario_sistema
      // This is informational only
      return { 
        success: true, 
        data: undefined,
        // Could add warning here if ActionResponse supported it
      };
    }

    return { success: true, data: undefined };
  } catch (err: unknown) {
    console.error("[eliminarUsuarioPermanentemente] Unexpected error:", err);
    return { success: false, error: { type: "SYSTEM", message: toUserMessage(err, "Error inesperado al eliminar el usuario.") } };
  }
}
