"use server";

import { Entrenador } from "@/lib/models/Entrenador";
import { Ejercicio } from "@/lib/models/Entrenamiento";
import { revalidatePath } from "next/cache";

export async function crearPlanAction(data: {
  nombre: string;
  objetivo: string;
  entrenadorId: string;
  ejercicios: Array<{ nombre: string; series: number; repeticiones: number; descanso: number; orden: number }>;
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
      const ejercicio = new Ejercicio(null, planId, ejData.nombre, ejData.series, ejData.repeticiones, ejData.descanso, orden);
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
