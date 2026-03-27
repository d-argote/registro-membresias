"use server";

import { Entrenador } from "@/lib/models/domain/Entrenador";
import { Ejercicio } from "@/lib/models/domain/Entrenamiento";
import { revalidatePath } from "next/cache";
import { isNonEmpty, sanitizeText, clampString } from "@/lib/utils/validators/common.validator";
import { toUserMessage } from "@/lib/errors/AppError";

// ─── Validation helpers ──────────────────────────────────────────────────────

interface EjercicioInput {
  id?: string;
  nombre: string;
  series: number;
  repeticiones: number;
  descanso: number;
  orden: number;
  instrucciones?: string;
}

function validatePlanInput(data: { nombre: string; objetivo: string }): string[] {
  const errors: string[] = [];

  if (!isNonEmpty(data.nombre)) {
    errors.push("El nombre del plan es obligatorio.");
  } else if (data.nombre.length > 100) {
    errors.push("El nombre del plan no puede superar 100 caracteres.");
  }

  if (!isNonEmpty(data.objetivo)) {
    errors.push("El objetivo del plan es obligatorio.");
  } else if (data.objetivo.length > 500) {
    errors.push("El objetivo no puede superar 500 caracteres.");
  }

  return errors;
}

function validateEjerciciosInput(ejercicios: EjercicioInput[]): string[] {
  const errors: string[] = [];

  ejercicios.forEach((ej, idx) => {
    const label = `Ejercicio ${idx + 1}`;

    if (!isNonEmpty(ej.nombre)) {
      errors.push(`${label}: el nombre es obligatorio.`);
    }

    if (!Number.isInteger(ej.series) || ej.series < 1 || ej.series > 20) {
      errors.push(`${label}: las series deben ser un entero entre 1 y 20.`);
    }

    if (!Number.isInteger(ej.repeticiones) || ej.repeticiones < 1 || ej.repeticiones > 100) {
      errors.push(`${label}: las repeticiones deben ser un entero entre 1 y 100.`);
    }

    if (!Number.isInteger(ej.descanso) || ej.descanso < 0 || ej.descanso > 300) {
      errors.push(`${label}: el descanso debe ser un entero entre 0 y 300 segundos.`);
    }
  });

  return errors;
}

// ─── Server Actions ──────────────────────────────────────────────────────────

/**
 * Creates a new training plan with the provided exercises.
 * Validates all fields before any DB operation.
 *
 * @param data - Plan metadata and list of exercises
 */
export async function crearPlanAction(data: {
  nombre: string;
  objetivo: string;
  entrenadorId: string;
  ejercicios: EjercicioInput[];
}) {
  try {
    const planErrors = validatePlanInput(data);
    const ejErrors = validateEjerciciosInput(data.ejercicios);
    const allErrors = [...planErrors, ...ejErrors];

    if (allErrors.length > 0) {
      return { success: false, error: allErrors.join(" | ") };
    }

    const entrenador = new Entrenador(
      data.entrenadorId, "Admin", "", "", "", "", "", "Coach", "Cert", new Date(), true
    );

    const plan = await entrenador.crearPlan(
      clampString(data.nombre, 100),
      clampString(data.objetivo, 500)
    );
    const planId = plan.getId();

    if (!planId) throw new Error("Plan ID no generado correctamente");

    let orden = 1;
    for (const ejData of data.ejercicios) {
      const ejercicio = new Ejercicio(
        null, planId,
        sanitizeText(ejData.nombre),
        ejData.series,
        ejData.repeticiones,
        ejData.descanso,
        orden,
        ejData.instrucciones ? clampString(ejData.instrucciones, 500) : null
      );
      await ejercicio.actualizar();
      orden++;
    }

    revalidatePath("/dashboard/entrenamiento");
    return { success: true, planId };
  } catch (err: unknown) {
    console.error("[crearPlanAction] Error:", err);
    return { success: false, error: toUserMessage(err, "No se pudo crear el plan. Intente de nuevo.") };
  }
}

/**
 * Updates an existing training plan's metadata and exercises.
 * Validates all fields before any DB operation.
 *
 * @param planId - UUID of the plan to modify
 * @param data   - Updated plan metadata and exercises
 */
export async function actualizarPlanAction(planId: string, data: {
  nombre: string;
  objetivo: string;
  entrenadorId: string;
  ejercicios: EjercicioInput[];
}) {
  try {
    const planErrors = validatePlanInput(data);
    const ejErrors = validateEjerciciosInput(data.ejercicios);
    const allErrors = [...planErrors, ...ejErrors];

    if (allErrors.length > 0) {
      return { success: false, error: allErrors.join(" | ") };
    }

    const { PlanEntrenamiento } = await import("@/lib/models/Entrenamiento");
    const plan = await PlanEntrenamiento.fetchById(planId);
    if (!plan) throw new Error("Plan no encontrado");

    await plan.modificar(
      clampString(data.nombre, 100),
      clampString(data.objetivo, 500)
    );

    for (const ejData of data.ejercicios) {
      const ejercicio = new Ejercicio(
        ejData.id && ejData.id !== "" ? ejData.id : null,
        planId,
        sanitizeText(ejData.nombre),
        ejData.series,
        ejData.repeticiones,
        ejData.descanso,
        ejData.orden,
        ejData.instrucciones ? clampString(ejData.instrucciones, 500) : null
      );
      await ejercicio.actualizar();
    }

    revalidatePath("/dashboard/entrenamiento");
    revalidatePath(`/dashboard/entrenamiento/${planId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("[actualizarPlanAction] Error:", err);
    return { success: false, error: toUserMessage(err, "No se pudo actualizar el plan. Intente de nuevo.") };
  }
}

/**
 * Fetches all available training plans with their exercise counts.
 *
 * @param entrenadorId - UUID of the requesting trainer (currently unused — returns all plans)
 */
export async function obtenerMisPlanesAction(entrenadorId: string) {
  try {
    const { PlanEntrenamiento } = await import("@/lib/models/Entrenamiento");
    const planes = await PlanEntrenamiento.fetchAll();

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
  } catch (err: unknown) {
    console.error("[obtenerMisPlanesAction] Error:", err);
    return { success: false, error: toUserMessage(err, "No se pudieron cargar los planes.") };
  }
}
