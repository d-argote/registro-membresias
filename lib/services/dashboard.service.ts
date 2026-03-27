import { getServerClient } from "../supabaseServer";
import { EstadoMembresia } from "../models/Membresia";

export interface MembershipAlertDTO {
  id: string;
  clientName: string;
  clientEmail?: string;
  endDate: string;
  daysLeft: number;
}

export interface DashboardMetricsDTO {
  ingresos: {
    total: number;
    totalFormato: string;
    variacion: number;
    variacionFormato: string;
  };
  accesos: {
    total: number;
    capacidadPorcentaje: number;
    accesoVariacion: number;
  };
  membresias: {
    vigentes: number;
    variacSemana: number;
  };
}

/**
 * DashboardService — Provides real-time metrics for the gym dashboard
 * All methods are read-only and optimized for performance
 */
export class DashboardService {
  // ─────────────────────────────────────────────────────────────
  // Configuration constants
  // ─────────────────────────────────────────────────────────────
  
  private static readonly MAX_CAPACITY = 200; // Aforo máximo del recinto
  private static readonly ALERT_WINDOW_DAYS = 3; // Días para alertas de vencimiento

  // ─────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Formatea un número como moneda local (COP)
   */
  public static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Formatea un porcentaje con signo y decimales
   */
  public static formatPercentage(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Calcula las fechas de inicio y fin de día para queries
   */
  private static getDateStrings(date?: Date) {
    const d = date ? new Date(date) : new Date();
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0];
    const startTime = `${dateStr}T00:00:00`;
    const endTime = `${dateStr}T23:59:59`;
    return { dateStr, startTime, endTime };
  }

  // ─────────────────────────────────────────────────────────────
  // Income Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Obtiene los ingresos de hoy con estado "Aprobada"
   * y calcula la variación respecto al día anterior
   */
  public static async getIngresosHoyYVariacion() {
    const db = getServerClient();

    const today = this.getDateStrings();
    const yesterday = this.getDateStrings(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    try {
      // Fetch today's income
      const { data: hoyData, error: hoyError } = await db
        .from("transaccion_pago")
        .select("monto")
        .eq("estado", "Aprobada")
        .gte("fecha_pago", today.startTime)
        .lte("fecha_pago", today.endTime);

      // Fetch yesterday's income
      const { data: ayerData, error: ayerError } = await db
        .from("transaccion_pago")
        .select("monto")
        .eq("estado", "Aprobada")
        .gte("fecha_pago", yesterday.startTime)
        .lte("fecha_pago", yesterday.endTime);

      if (hoyError) {
        console.warn("Warning fetching ingresos hoy:", hoyError?.message || hoyError);
      }
      if (ayerError) {
        console.warn("Warning fetching ingresos ayer:", ayerError?.message || ayerError);
      }

      const totalHoy =
        hoyData?.reduce((acc, row) => acc + (Number(row.monto) || 0), 0) || 0;
      const totalAyer =
        ayerData?.reduce((acc, row) => acc + (Number(row.monto) || 0), 0) || 0;

      let variacion = 0;
      if (totalAyer > 0) {
        variacion = ((totalHoy - totalAyer) / totalAyer) * 100;
      } else if (totalHoy > 0) {
        variacion = 100;
      }

      return {
        total: totalHoy,
        totalFormato: this.formatCurrency(totalHoy),
        variacion: variacion,
        variacionFormato: this.formatPercentage(variacion),
      };
    } catch (error) {
      console.error("Unexpected error in getIngresosHoyYVariacion:", error);
      return {
        total: 0,
        totalFormato: this.formatCurrency(0),
        variacion: 0,
        variacionFormato: this.formatPercentage(0),
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Access Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Obtiene los accesos exitosos de hoy y de ayer para calcular variación
   * Si la tabla no existe, retorna valores por defecto
   */
  public static async getAccesosHoyYVariacion() {
    const db = getServerClient();

    const today = this.getDateStrings();
    const yesterday = this.getDateStrings(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    try {
      // Fetch today's accesses - NOTA: columna se llama "fecha_hora" no "fecha_acceso"
      const { count: countHoy, error: errorHoy } = await db
        .from("log_auditoria_acceso")
        .select("*", { count: "exact", head: true })
        .eq("resultado", "Autorizado")
        .gte("fecha_hora", today.startTime)
        .lte("fecha_hora", today.endTime);

      if (errorHoy) {
        console.warn("Warning fetching accesos hoy:", errorHoy?.message || errorHoy);
        return {
          total: 0,
          capacidadPorcentaje: 0,
          capacidadFormato: "0% capacidad",
          accesoVariacion: 0,
          accesoVariacionFormato: "+0%",
        };
      }

      // Fetch yesterday's accesses
      const { count: countAyer, error: errorAyer } = await db
        .from("log_auditoria_acceso")
        .select("*", { count: "exact", head: true })
        .eq("resultado", "Autorizado")
        .gte("fecha_hora", yesterday.startTime)
        .lte("fecha_hora", yesterday.endTime);

      if (errorAyer) {
        console.warn("Warning fetching accesos ayer:", errorAyer?.message || errorAyer);
      }

      const totalHoy = countHoy || 0;
      const totalAyer = countAyer || 0;

      let variacion = 0;
      if (totalAyer > 0) {
        variacion = ((totalHoy - totalAyer) / totalAyer) * 100;
      } else if (totalHoy > 0) {
        variacion = 100;
      }

      const capacidadPorcentaje = Math.round(
        (totalHoy / this.MAX_CAPACITY) * 100
      );

      return {
        total: totalHoy,
        capacidadPorcentaje: Math.min(capacidadPorcentaje, 100),
        capacidadFormato: `${capacidadPorcentaje}% capacidad`,
        accesoVariacion: variacion,
        accesoVariacionFormato: this.formatPercentage(variacion),
      };
    } catch (error) {
      console.error("Unexpected error in getAccesosHoyYVariacion:", error);
      return {
        total: 0,
        capacidadPorcentaje: 0,
        capacidadFormato: "0% capacidad",
        accesoVariacion: 0,
        accesoVariacionFormato: "+0%",
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Membership Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Obtiene la cantidad de membresías que están activas y no vencidas
   */
  public static async getMembresiasVigentes() {
    const db = getServerClient();
    const today = this.getDateStrings();

    try {
      const { count, error } = await db
        .from("membresia")
        .select("*", { count: "exact", head: true })
        .eq("estado_id", EstadoMembresia.ACTIVA)
        .gte("fecha_fin", today.dateStr);

      if (error) {
        console.warn("Warning fetching membresias vigentes:", error?.message || error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Unexpected error in getMembresiasVigentes:", error);
      return 0;
    }
  }

  /**
   * Obtiene la variación de membresías en la última semana
   * Cuenta membresías que iniciaron en los últimos 7 días
   */
  public static async getMembresiasVariacionSemana() {
    const db = getServerClient();
    const today = this.getDateStrings();

    const weekAgo = this.getDateStrings(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Count memberships that started this week (using fecha_inicio)
    const { count: newThisWeek, error: errorWeek } = await db
      .from("membresia")
      .select("*", { count: "exact", head: true })
      .eq("estado_id", EstadoMembresia.ACTIVA)
      .gte("fecha_inicio", weekAgo.dateStr)
      .lte("fecha_inicio", today.dateStr);

    if (errorWeek) {
      console.error("Error fetching variación semanal:", errorWeek);
      return 0;
    }

    return newThisWeek || 0;
  }

  // ─────────────────────────────────────────────────────────────
  // Alert Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Obtiene membresías que vencen en los próximos 3 días
   * Incluye datos del cliente para enviar recordatorios
   */
  public static async getAlertasVencimientos(): Promise<MembershipAlertDTO[]> {
    const db = getServerClient();

    try {
      const today = this.getDateStrings();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + this.ALERT_WINDOW_DAYS);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data, error } = await db
        .from("membresia")
        .select(
          `
          id,
          fecha_fin,
          cliente:cliente_id (
            id,
            nombre,
            email
          )
        `
        )
        .eq("estado_id", EstadoMembresia.ACTIVA)
        .gte("fecha_fin", today.dateStr)
        .lte("fecha_fin", tomorrowStr)
        .order("fecha_fin", { ascending: true });

      if (error) {
        console.warn("Warning fetching alertas vencimiento:", error?.message || error);
        return [];
      }

      const baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);

      return (
        data
          ?.map((row: any) => {
            const end = new Date(row.fecha_fin + "T00:00:00");
            const diffTime = end.getTime() - baseDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const clientData = Array.isArray(row.cliente)
              ? row.cliente[0]
              : row.cliente;

            return {
              id: row.id,
              clientName: clientData?.nombre || "Cliente Desconocido",
              clientEmail: clientData?.email || undefined,
              endDate: end.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              daysLeft: diffDays >= 0 ? diffDays : 0,
            };
          })
          .sort((a: MembershipAlertDTO, b: MembershipAlertDTO) => a.daysLeft - b.daysLeft)
      );
    } catch (error) {
      console.error("Unexpected error in getAlertasVencimientos:", error);
      return [];
    }
  }

  /**
   * Obtiene todos los datos del dashboard en una llamada (optimizado)
   */
  public static async getDashboardMetrics(): Promise<DashboardMetricsDTO> {
    const [ingresos, accesos, membresias, variacSemana] = await Promise.all([
      this.getIngresosHoyYVariacion(),
      this.getAccesosHoyYVariacion(),
      this.getMembresiasVigentes(),
      this.getMembresiasVariacionSemana(),
    ]);

    return {
      ingresos,
      accesos,
      membresias: {
        vigentes: membresias,
        variacSemana,
      },
    };
  }
}
