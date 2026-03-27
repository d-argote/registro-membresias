"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { createClient } from "@/utils/supabase/server";

export async function validarCorreoCliente(email: string): Promise<boolean> {
  const supabase = getServerClient();
  try {
    const { data, error } = await supabase
      .from("cliente")
      .select("id")
      .eq("email", email)
      .single();

    if (error || !data) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error al validar correo de cliente:", error);
    return false;
  }
}

/**
 * Autentica al cliente en el servidor y establece las cookies de sesión (HTTP-only)
 * Esto es necesario para que el layout.tsx del cliente, que es un Server Component, 
 * pueda leer la sesión correctamente y no rebote al usuario.
 */
export async function iniciarSesionCliente(email: string, password: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[iniciarSesionCliente] Error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[iniciarSesionCliente] Excepción:", err);
    return false;
  }
}
