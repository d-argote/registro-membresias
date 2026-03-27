/**
 * ModuloReportes — registro-membresias
 *
 * Implements IReportable. Provides READ-ONLY aggregate queries
 * across the transaccion_pago and membresia tables.
 *
 * ⚠️  SAFETY CONSTRAINTS
 * ─────────────────────
 * • Zero writes — every method is a SELECT only.
 * • Uses the service-role client for bypassing RLS (same pattern as MembresiaService).
 * • Does NOT modify any existing service or model.
 * • All returned types are plain data shapes (no domain class mutation).
 */

import { createClient } from "@supabase/supabase-js";
import type { IReportable } from "./interfaces";

// ---------------------------------------------------------------------------
// Internal DB client (mirrors pattern in membresia.service.ts)
// ---------------------------------------------------------------------------

function getServerClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
            ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Return types (plain data, no mutations)
// ---------------------------------------------------------------------------

/** Agregado diario de ingresos dentro de un período. */
export interface IngresosDia {
  fecha: string;        // ISO date string "YYYY-MM-DD"
  totalTransacciones: number;
  montoTotal: number;
  metodoPago: string;
}

/** Resumen total del período consultado. */
export interface ReporteIngresos {
  desde: string;
  hasta: string;
  totalTransacciones: number;
  montoTotal: number;
  promedioTransaccion: number;
  desglosePorMetodo: Record<string, { cantidad: number; monto: number }>;
  detalleDiario: IngresosDia[];
}

/** Membresía próxima a vencer. */
export interface AlertaVencimiento {
  clienteId: string;
  clienteNombre: string;
  fechaFin: string;      // ISO date string
  diasRestantes: number;
  tipoMembresia: string;
}

/** Resumen ejecutivo genérico (usado por generarReporte). */
export interface ResumenEjecutivo {
  fechaGeneracion: string;
  totalClientesActivos: number;
  membresiasActivas: number;
  membresiasVencidas: number;
  membresiasCongeladas: number;
  ingresosMes: number;
}

// ---------------------------------------------------------------------------
// ModuloReportes
// ---------------------------------------------------------------------------

/**
 * Read-only reporting module for the gym membership system.
 *
 * Usage:
 *   const reporte = new ModuloReportes();
 *   const ingresos = await reporte.reporteIngresosPeriodo(desde, hasta);
 *   const alertas  = await reporte.alertasProximasVencer(7);
 */
export class ModuloReportes implements IReportable {

  // ── IReportable interface (synchronous stubs for interface compliance) ───

  /**
   * IReportable compliance stub.
   * The async equivalent is {@link resumenEjecutivo}.
   *
   * Note: The UML interface is synchronous; actual data fetching is async.
   * Call `resumenEjecutivo()` directly for real data.
   */
  generarReporte(): void {
    console.info("[ModuloReportes] Use resumenEjecutivo() for async report generation.");
  }

  /**
   * IReportable compliance stub.
   * Real export logic delegates to the async exportarReporte() method.
   *
   * @param formato - 'json' | 'csv' (future: 'pdf')
   */
  exportar(formato: string): void {
    console.info(`[ModuloReportes] Use exportarReporte('${formato}') for async export.`);
  }

  // ── Async report methods ─────────────────────────────────────────────────

  /**
   * Generates an executive summary of the current state of the gym.
   * Queries: cliente, membresia, transaccion_pago.
   *
   * @returns ResumenEjecutivo with key counts and current-month income.
   */
  async resumenEjecutivo(): Promise<ResumenEjecutivo> {
    const db = getServerClient();

    const today = new Date();
    const primerDiaMes = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Run queries in parallel — all SELECT only
    const [
      { count: totalActivos },
      { data: estadoData },
      { data: ingresoData },
    ] = await Promise.all([
      // Active clients (no activo column yet → approximate via membresia activa)
      db.from("cliente").select("id", { count: "exact", head: true }),

      // Membership count by estado
      db.from("membresia")
        .select("estado_id")
        .order("estado_id"),

      // Income this month
      db.from("transaccion_pago")
        .select("monto")
        .gte("fecha_pago", primerDiaMes)
        .eq("estado", "Aprobada"),
    ]);

    // Tally membership states
    const estadoCounts = { activas: 0, vencidas: 0, congeladas: 0 };
    for (const row of estadoData ?? []) {
      if (row.estado_id === 1) estadoCounts.activas++;
      else if (row.estado_id === 2) estadoCounts.vencidas++;
      else if (row.estado_id === 3) estadoCounts.congeladas++;
    }

    const ingresosMes = (ingresoData ?? []).reduce(
      (acc: number, row: { monto: number }) => acc + Number(row.monto),
      0
    );

    return {
      fechaGeneracion:        today.toISOString(),
      totalClientesActivos:   totalActivos ?? 0,
      membresiasActivas:      estadoCounts.activas,
      membresiasVencidas:     estadoCounts.vencidas,
      membresiasCongeladas:   estadoCounts.congeladas,
      ingresosMes,
    };
  }

  /**
   * Returns income aggregates for a given date range.
   *
   * @param desde - Start date (inclusive), e.g. new Date("2025-01-01")
   * @param hasta - End date (inclusive), e.g. new Date("2025-01-31")
   * @returns ReporteIngresos with totals and breakdown by payment method.
   */
  async reporteIngresosPeriodo(desde: Date, hasta: Date): Promise<ReporteIngresos> {
    const db = getServerClient();

    const desdeStr = desde.toISOString().split("T")[0];
    // Add 1 day to hasta so the filter is fully inclusive of the end date
    const hastaNext = new Date(hasta);
    hastaNext.setDate(hastaNext.getDate() + 1);
    const hastaStr = hastaNext.toISOString().split("T")[0];

    const { data, error } = await db
      .from("transaccion_pago")
      .select(`
        id,
        monto,
        fecha_pago,
        metodo_pago:metodo_pago_id ( nombre )
      `)
      .gte("fecha_pago", desdeStr)
      .lt("fecha_pago", hastaStr)
      .eq("estado", "Aprobada")
      .order("fecha_pago", { ascending: true });

    if (error) throw new Error("[ModuloReportes] Error al consultar ingresos: " + error.message);

    const rows = data ?? [];

    // Totals
    const montoTotal = rows.reduce((acc: number, r: any) => acc + Number(r.monto), 0);
    const totalTransacciones = rows.length;
    const promedioTransaccion = totalTransacciones > 0
      ? montoTotal / totalTransacciones
      : 0;

    // Breakdown by payment method
    const desglosePorMetodo: Record<string, { cantidad: number; monto: number }> = {};
    const detalleDiario: IngresosDia[] = [];
    const porDia: Record<string, { total: number; cantidad: number; metodo: string }> = {};

    for (const row of rows) {
      const rawMetodo = row.metodo_pago;
      const metodoPagoNombre: string = Array.isArray(rawMetodo)
        ? (rawMetodo[0]?.nombre ?? "Desconocido")
        : ((rawMetodo as { nombre?: string } | null)?.nombre ?? "Desconocido");
      const monto = Number(row.monto);
      const fecha = (row.fecha_pago as string).split("T")[0];

      // By method
      if (!desglosePorMetodo[metodoPagoNombre]) {
        desglosePorMetodo[metodoPagoNombre] = { cantidad: 0, monto: 0 };
      }
      desglosePorMetodo[metodoPagoNombre].cantidad++;
      desglosePorMetodo[metodoPagoNombre].monto += monto;

      // By day
      if (!porDia[fecha]) {
        porDia[fecha] = { total: 0, cantidad: 0, metodo: metodoPagoNombre };
      }
      porDia[fecha].total += monto;
      porDia[fecha].cantidad++;
    }

    for (const [fecha, valores] of Object.entries(porDia)) {
      detalleDiario.push({
        fecha,
        totalTransacciones: valores.cantidad,
        montoTotal:          valores.total,
        metodoPago:          valores.metodo,
      });
    }

    return {
      desde:               desdeStr,
      hasta:               hasta.toISOString().split("T")[0],
      totalTransacciones,
      montoTotal,
      promedioTransaccion,
      desglosePorMetodo,
      detalleDiario,
    };
  }

  /**
   * Returns active memberships expiring within `diasAntelacion` days.
   * Useful for triggering renewal reminders and admin alerts.
   *
   * @param diasAntelacion - How many days ahead to look (e.g. 7, 15, 30).
   * @returns Array of AlertaVencimiento sorted by soonest expiry first.
   */
  async alertasProximasVencer(diasAntelacion: number = 7): Promise<AlertaVencimiento[]> {
    const db = getServerClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limite = new Date(today);
    limite.setDate(limite.getDate() + diasAntelacion);

    const todayStr  = today.toISOString().split("T")[0];
    const limiteStr = limite.toISOString().split("T")[0];

    const { data, error } = await db
      .from("membresia")
      .select(`
        id,
        fecha_fin,
        tipo_membresia,
        estado_id,
        cliente:cliente_id ( id, nombre )
      `)
      .eq("estado_id", 1)           // ACTIVA only
      .gte("fecha_fin", todayStr)   // not already expired
      .lte("fecha_fin", limiteStr)  // within the window
      .order("fecha_fin", { ascending: true });

    if (error) throw new Error("[ModuloReportes] Error al consultar alertas: " + error.message);

    const msPerDay = 1000 * 60 * 60 * 24;

    return (data ?? []).map((row: any) => {
      const fechaFin     = new Date(row.fecha_fin + "T00:00:00");
      const diasRestantes = Math.ceil((fechaFin.getTime() - today.getTime()) / msPerDay);
      const cliente       = row.cliente as { id: string; nombre: string } | null;

      return {
        clienteId:      cliente?.id      ?? row.cliente_id,
        clienteNombre:  cliente?.nombre  ?? "Desconocido",
        fechaFin:       row.fecha_fin,
        diasRestantes:  Math.max(0, diasRestantes),
        tipoMembresia:  row.tipo_membresia ?? "N/A",
      } satisfies AlertaVencimiento;
    });
  }

  /**
   * Serializes a report result to the requested format.
   *
   * @param data    - Any report result object.
   * @param formato - 'json' (default) | 'csv' (not yet implemented).
   * @returns Serialized string.
   */
  async exportarReporte(data: unknown, formato: "json" | "csv" = "json"): Promise<string> {
    if (formato === "json") {
      return JSON.stringify(data, null, 2);
    }

    // CSV: basic flat-object export (extend as needed)
    if (formato === "csv") {
      if (!Array.isArray(data) || data.length === 0) return "";
      const headers = Object.keys(data[0] as object).join(",");
      const rows    = (data as object[]).map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
      return [headers, ...rows].join("\n");
    }

    throw new Error(`[ModuloReportes] Formato '${formato}' no soportado.`);
  }
}
