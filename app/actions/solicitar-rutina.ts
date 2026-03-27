"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { NotificadorService } from "@/lib/services/notificador.service";
import { ActionResponse } from "@/lib/models/ActionResponse";

export async function solicitarRutinaAction(): Promise<ActionResponse<void>> {
  const supabase = getServerClient();

  try {
    const { data: { user }, error: sessError } = await supabase.auth.getUser();

    if (sessError || !user || !user.email) {
      return { success: false, error: { type: "AUTH", message: "Debes iniciar sesión." } };
    }

    // 1. Obtener el cliente actual
    const { data: cliente, error: cliError } = await supabase
      .from("cliente")
      .select("id, nombre")
      .eq("email", user.email)
      .single();

    if (cliError || !cliente) {
      return { success: false, error: { type: "BUSINESS_LOGIC", message: "No se pudo identificar tu cuenta de cliente." } };
    }

    // 2. Obtener los IDs de Entrenadores y Administradores
    // Asumimos que la tabla de roles nos permite filtrar
    const { data: rolesPersonal, error: rolesError } = await supabase
      .from("usuario_rol")
      .select("usuario_id, rol_id(nombre)")
      // Aquí el filtro podría variar si la relación rol_id no permite nombre
      // Filtramos en JS para mayor seguridad en la consulta genérica:
    
    let personalIds: string[] = [];
    if (!rolesError && rolesPersonal) {
      // @ts-ignore (Tipado complejo de supabase con join)
      personalIds = rolesPersonal
        .filter((r: any) => r.rol_id?.nombre === 'Administrador' || r.rol_id?.nombre === 'Entrenador')
        .map((r: any) => r.usuario_id);
    }

    // Si la tabla no lo soporta de forma directa, buscamos los usuarios:
    if (personalIds.length === 0) {
      const { data: allUsers } = await supabase.from("usuario_rol").select("usuario_id");
      if (allUsers) personalIds = allUsers.map((u: any) => u.usuario_id);
    }

    // Asegurarse de que eliminamos duplicados
    personalIds = Array.from(new Set(personalIds));

    if (personalIds.length === 0) {
      return { success: false, error: { type: "SYSTEM", message: "No hay personal disponible para recibir la solicitud." } };
    }

    // 3. Notificar
    await NotificadorService.notificarSolicitudRutina(cliente.nombre, personalIds);

    return { success: true, data: undefined };
  } catch (error: any) {
    console.error("[solicitarRutinaAction] Error:", error);
    return { success: false, error: { type: "SYSTEM", message: "Hubo un error al enviar tu solicitud. Inténtalo más tarde." } };
  }
}
