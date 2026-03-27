"use server";

import { createClient } from "@/utils/supabase/server";
import { ActionResponse } from "../../lib/models/ActionResponse";

export interface MasterDetailData {
  clientes: ClienteAsignacionDTO[];
  planesDisponibles: PlanDTO[];
}

export interface ClienteAsignacionDTO {
  id: string;
  nombre: string;
  tieneDiscapacidad: boolean;
  descripcionDiscapacidad: string | null;
  planActivoNombre: string | null;
  planActivoId: string | null;
  solicitaRutina: boolean;
}

export interface PlanDTO {
  id: string;
  nombre: string;
  objetivo: string | null;
}

export async function obtenerDatosMasterDetail(): Promise<ActionResponse<MasterDetailData>> {
  try {
    const supabase = await createClient();

    // 1. Obtener todos los clientes
    const { data: clientesRaw, error: clientesError } = await supabase
      .from("cliente")
      .select("id, nombre, tiene_discapacidad, descripcion_discapacidad");
    if (clientesError) throw clientesError;

    // 2. Obtener asignaciones activas
    const { data: asignacionesActivas, error: asigError } = await supabase
      .from("asignacion_plan")
      .select("cliente_id, plan_id, plan_entrenamiento(nombre)")
      .eq("activo", true);
    if (asigError) throw asigError;

    // 3. Obtener solicitudes pendientes
    const { data: notificacionesPendientes, error: notifError } = await supabase
      .from("notificacion")
      .select("referencia_id")
      .eq("tipo", "SOLICITUD_RUTINA")
      .eq("leida", false);
    if (notifError) throw notifError;

    const clientesUnicosSolicitando = new Set(
      notificacionesPendientes.map((n: any) => n.referencia_id).filter(Boolean)
    );

    const mapAsignaciones = new Map();
    asignacionesActivas?.forEach((a: any) => {
      mapAsignaciones.set(a.cliente_id, {
        planId: a.plan_id,
        planNombre: a.plan_entrenamiento?.nombre || "Plan Desconocido",
      });
    });

    const clientes: ClienteAsignacionDTO[] = (clientesRaw || []).map((c: any) => {
      const asignacion = mapAsignaciones.get(c.id);
      return {
        id: c.id,
        nombre: c.nombre,
        tieneDiscapacidad: c.tiene_discapacidad,
        descripcionDiscapacidad: c.descripcion_discapacidad,
        planActivoNombre: asignacion?.planNombre || null,
        planActivoId: asignacion?.planId || null,
        solicitaRutina: clientesUnicosSolicitando.has(c.id),
      };
    });

    // 4. Obtener planes disponibles
    const { data: planesRaw, error: planesError } = await supabase
      .from("plan_entrenamiento")
      .select("id, nombre, objetivo")
      .eq("activo", true)
      .order("fecha_creacion", { ascending: false });
    if (planesError) throw planesError;

    const planesDisponibles: PlanDTO[] = planesRaw.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      objetivo: p.objetivo,
    }));

    return {
      success: true,
      data: {
        clientes,
        planesDisponibles,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        type: "SYSTEM",
        message: error.message || "Error al obtener los datos de asignación"
      }
    };
  }
}

export async function asignarPlanAction(
  clienteId: string,
  planId: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    
    // Auth context (entrenador actual)
    const { data: userAuth, error: authError } = await supabase.auth.getUser();
    
    const { AsignacionPlan } = await import("../../lib/models/Entrenamiento");

    await AsignacionPlan.asignarNuevo(clienteId, planId, userAuth?.user?.id || null);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
         type: "BUSINESS_LOGIC",
         message: error.message || "Error al asignar el plan"
      }
    };
  }
}
