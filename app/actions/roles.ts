"use server";

import { createClient } from "@supabase/supabase-js";
import { RolUsuario } from "@/lib/models/usuario_sistema.model";

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
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function crearUsuarioAdmin(
  token: string,
  datos: { nombre: string; email: string; password?: string },
  rolId: RolUsuario
) {
  // 1. Verificar identidad del usuario que hace la solicitud
  const anonClient = getAnonClient(token);
  const { data: { user }, error: authError } = await anonClient.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Sesión inválida.");
  }

  // 2. Verificar rol del usuario solicitante (debe ser ADMINISTRADOR)
  const adminClient = getServerAdminClient();
  const { data: solicitante, error: solicitanteError } = await adminClient
    .from("usuario_sistema")
    .select("rol_id")
    .eq("id", user.id)
    .single();

  if (solicitanteError || !solicitante) {
    throw new Error("No se pudo verificar el rol del usuario.");
  }

  if (solicitante.rol_id !== RolUsuario.ADMINISTRADOR) {
    throw new Error("Acceso denegado. Solo los Administradores pueden crear usuarios.");
  }

  // 3. Crear el nuevo usuario en Supabase Auth
  const { data: newAuthUser, error: newAuthError } = await adminClient.auth.admin.createUser({
    email: datos.email,
    password: datos.password || "Temp123456!",
    email_confirm: true,
    user_metadata: { nombre: datos.nombre, rol_id: rolId }
  });

  if (newAuthError) {
    // Return custom error message if it's a supabase auth error
    throw new Error(`Error Auth: ${newAuthError.message}`);
  }

  const authUserId = newAuthUser.user.id;

  // 4. Insertar en la tabla usuario_sistema
  const { error: userError } = await adminClient
    .from("usuario_sistema")
    .insert([
      {
        id: authUserId,
        nombre: datos.nombre,
        email: datos.email,
        rol_id: rolId,
        activo: true
      }
    ]);

  if (userError) {
    // Revertir si falla la inserción
    await adminClient.auth.admin.deleteUser(authUserId);
    throw new Error(`Error BD: ${userError.message}`);
  }

  return { success: true };
}
