"use server";

import { Entrenador } from "@/lib/models/Entrenador";
import { Ejercicio } from "@/lib/models/Entrenamiento";
import { revalidatePath } from "next/cache";

export async function crearPlanAction(data: {
  nombre: string;
  objetivo: string;
  entrenadorId: string;
  ejercicios: Array<{ nombre: string; series: number; repeticiones: number; descanso: number; orden: number; instrucciones?: string }>;
}) {
  try {
    // Instanciamos el modelo Entrenador como un orquestador del dominio (DAO-like model)
    const entrenador = new Entrenador(data.entrenadorId, "Admin", "", "", "", "", "", "Coach", "Cert", new Date(), true);
    
    // Llamamos al método del dominio para crear el plan
    const plan = await entrenador.crearPlan(data.nombre, data.objetivo);
    const planId = plan.getId();

    if (!planId) throw new Error("Plan ID no generado correctamente");

    // Iteramos los ejercicios e instanciamos la clase Ejercicio y usamos su método OOP (actualizar)
    let orden = 1;
    for (const ejData of data.ejercicios) {
      const ejercicio = new Ejercicio(null, planId, ejData.nombre, ejData.series, ejData.repeticiones, ejData.descanso, orden, ejData.instrucciones || null);
      // actualizar procesa un INSERT si el Id es null internamente
      await ejercicio.actualizar();
      orden++;
    }

    revalidatePath("/dashboard/entrenamiento");
    return { success: true, planId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function actualizarPlanAction(planId: string, data: {
  nombre: string;
  objetivo: string;
  entrenadorId: string;
  ejercicios: Array<{ id?: string; nombre: string; series: number; repeticiones: number; descanso: number; orden: number; instrucciones?: string }>;
}) {
  try {
    const { PlanEntrenamiento } = await import('@/lib/models/Entrenamiento');
    const plan = await PlanEntrenamiento.fetchById(planId);
    if (!plan) throw new Error("Plan no encontrado");

    await plan.modificar(data.nombre, data.objetivo);

    for (const ejData of data.ejercicios) {
      if (ejData.id && ejData.id !== "") {
        const ejercicio = new Ejercicio(ejData.id, planId, ejData.nombre, ejData.series, ejData.repeticiones, ejData.descanso, ejData.orden, ejData.instrucciones || null);
        await ejercicio.actualizar();
      } else {
        const ejercicio = new Ejercicio(null, planId, ejData.nombre, ejData.series, ejData.repeticiones, ejData.descanso, ejData.orden, ejData.instrucciones || null);
        await ejercicio.actualizar();
      }
    }

    revalidatePath("/dashboard/entrenamiento");
    revalidatePath(`/dashboard/entrenamiento/${planId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function obtenerMisPlanesAction(entrenadorId: string) {
  try {
    const { PlanEntrenamiento } = await import('@/lib/models/Entrenamiento');
    // We fetch all plans so the Library contains all available templates in the DB
    const planes = await PlanEntrenamiento.fetchAll();

    
    // Convert to plain objects with exercises length
    const planesData = await Promise.all(planes.map(async (p) => {
      const ejercs = await p.getEjercicios();
      return {
        id: p.getId() as string,
        nombre: p.getNombre(),
        objetivo: p.getObjetivo(),
        activo: p.isActivo(),
        ejerciciosCount: ejercs.length,
        estimatedTimeMin: ejercs.length * 5,
      };
    }));

    return { success: true, planes: planesData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

