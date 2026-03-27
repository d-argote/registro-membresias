"use server";

import { ModuloReportes } from "@/lib/models/domain/ModuloReportes";
import type { ReporteIngresos, AlertaVencimiento, ResumenEjecutivo } from "@/lib/models/domain/ModuloReportes";

const modulo = new ModuloReportes();

/**
 * Fetches the executive summary for the reports dashboard.
 */
export async function getResumenEjecutivoAction(): Promise<
  { success: true; data: ResumenEjecutivo } | { success: false; error: string }
> {
  try {
    const data = await modulo.resumenEjecutivo();
    return { success: true, data };
  } catch (err: unknown) {
    console.error("[getResumenEjecutivoAction]", err);
    return { success: false, error: "No se pudo cargar el resumen ejecutivo." };
  }
}

/**
 * Fetches income aggregates for a given date range.
 * Dates arrive as ISO strings from the form.
 */
export async function getReporteIngresosAction(
  desdeStr: string,
  hastaStr: string
): Promise<
  { success: true; data: ReporteIngresos } | { success: false; error: string }
> {
  try {
    const desde = new Date(desdeStr + "T00:00:00");
    const hasta = new Date(hastaStr + "T00:00:00");

    if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) {
      return { success: false, error: "Rango de fechas inválido." };
    }
    if (desde > hasta) {
      return { success: false, error: "La fecha de inicio no puede ser posterior a la fecha de fin." };
    }

    const data = await modulo.reporteIngresosPeriodo(desde, hasta);
    return { success: true, data };
  } catch (err: unknown) {
    console.error("[getReporteIngresosAction]", err);
    return { success: false, error: "No se pudo cargar el reporte de ingresos." };
  }
}

/**
 * Fetches memberships expiring within the next N days.
 */
export async function getAlertasVencimientoAction(
  dias: number = 15
): Promise<
  { success: true; data: AlertaVencimiento[] } | { success: false; error: string }
> {
  try {
    const data = await modulo.alertasProximasVencer(dias);
    return { success: true, data };
  } catch (err: unknown) {
    console.error("[getAlertasVencimientoAction]", err);
    return { success: false, error: "No se pudo cargar las alertas de vencimiento." };
  }
}
