"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getResumenEjecutivoAction,
  getReporteIngresosAction,
  getAlertasVencimientoAction,
} from "@/app/actions/reportes";
import type {
  ResumenEjecutivo,
  ReporteIngresos,
  AlertaVencimiento,
} from "@/lib/models/ModuloReportes";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function isoToDisplay(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 flex flex-col gap-3 shadow-sm border ${
        accent
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface border-outline-variant/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-black uppercase tracking-widest ${accent ? "opacity-70" : "text-on-surface-variant"}`}>
          {label}
        </span>
        <span className={`material-symbols-outlined text-xl ${accent ? "opacity-80" : "text-primary"}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-extrabold tracking-tighter">{value}</p>
      {sub && (
        <p className={`text-xs ${accent ? "opacity-60" : "text-on-surface-variant"}`}>{sub}</p>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
      <div>
        <h2 className="text-lg font-black tracking-tight text-on-background uppercase">{title}</h2>
        {sub && <p className="text-xs text-on-surface-variant font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function Badge({ dias }: { dias: number }) {
  if (dias <= 3)
    return (
      <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-error-container text-on-error-container">
        Crítico
      </span>
    );
  if (dias <= 7)
    return (
      <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
        Urgente
      </span>
    );
  return (
    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-surface-container-high text-on-surface-variant">
      Próximo
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [isPending, startTransition] = useTransition();

  // Resumen ejecutivo
  const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null);
  const [resumenError, setResumenError] = useState<string | null>(null);

  // Reporte ingresos
  const [desde, setDesde] = useState(daysAgo(30));
  const [hasta, setHasta] = useState(today());
  const [reporte, setReporte] = useState<ReporteIngresos | null>(null);
  const [reporteError, setReporteError] = useState<string | null>(null);

  // Alertas vencimiento
  const [diasAlerta, setDiasAlerta] = useState(15);
  const [alertas, setAlertas] = useState<AlertaVencimiento[] | null>(null);
  const [alertasError, setAlertasError] = useState<string | null>(null);

  // Load all on mount
  useEffect(() => {
    loadResumen();
    loadReporte(desde, hasta);
    loadAlertas(diasAlerta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadResumen() {
    startTransition(async () => {
      const res = await getResumenEjecutivoAction();
      if (res.success) {
        setResumen(res.data);
        setResumenError(null);
      } else {
        setResumenError(res.error);
      }
    });
  }

  function loadReporte(d: string, h: string) {
    startTransition(async () => {
      const res = await getReporteIngresosAction(d, h);
      if (res.success) {
        setReporte(res.data);
        setReporteError(null);
      } else {
        setReporteError(res.error);
      }
    });
  }

  function loadAlertas(dias: number) {
    startTransition(async () => {
      const res = await getAlertasVencimientoAction(dias);
      if (res.success) {
        setAlertas(res.data);
        setAlertasError(null);
      } else {
        setAlertasError(res.error);
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-background uppercase">
            Reportes
          </h1>
          <p className="text-on-surface-variant text-sm tracking-wide font-medium">
            Análisis financiero y alertas operativas en tiempo real
          </p>
        </div>
        <button
          onClick={() => {
            loadResumen();
            loadReporte(desde, hasta);
            loadAlertas(diasAlerta);
          }}
          disabled={isPending}
          className="bg-surface-container-high text-primary px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-surface-container-highest transition-all active:scale-95 shadow-sm disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${isPending ? "animate-spin" : ""}`}>
            refresh
          </span>
          {isPending ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {/* ── Resumen Ejecutivo ── */}
      <section>
        <SectionHeader
          icon="monitoring"
          title="Resumen Ejecutivo"
          sub={
            resumen
              ? `Generado el ${new Date(resumen.fechaGeneracion).toLocaleString("es-CO")}`
              : "Cargando..."
          }
        />

        {resumenError && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm font-medium mb-4">
            ⚠️ {resumenError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon="payments"
            label="Ingresos del mes"
            value={resumen ? formatCOP(resumen.ingresosMes) : "—"}
            accent
          />
          <StatCard
            icon="group"
            label="Total clientes"
            value={resumen?.totalClientesActivos ?? "—"}
            sub="registros activos en BD"
          />
          <StatCard
            icon="verified"
            label="Membresías activas"
            value={resumen?.membresiasActivas ?? "—"}
            sub="estado_id = 1"
          />
          <StatCard
            icon="event_busy"
            label="Vencidas"
            value={resumen?.membresiasVencidas ?? "—"}
            sub="requieren renovación"
          />
          <StatCard
            icon="pause_circle"
            label="Congeladas"
            value={resumen?.membresiasCongeladas ?? "—"}
            sub="días preservados"
          />
        </div>
      </section>

      {/* ── Reporte de Ingresos ── */}
      <section>
        <SectionHeader icon="bar_chart" title="Reporte de Ingresos" sub="Filtrar por rango de fechas" />

        {/* Date filter */}
        <div className="flex flex-wrap gap-3 items-end mb-6 bg-surface rounded-2xl p-4 border border-outline-variant/20 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Desde
            </label>
            <input
              id="reportes-desde"
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Hasta
            </label>
            <input
              id="reportes-hasta"
              type="date"
              value={hasta}
              min={desde}
              max={today()}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            id="reportes-filtrar-btn"
            onClick={() => loadReporte(desde, hasta)}
            disabled={isPending}
            className="bg-primary text-on-primary px-5 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            Filtrar
          </button>
        </div>

        {reporteError && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm font-medium mb-4">
            ⚠️ {reporteError}
          </div>
        )}

        {reporte && (
          <div className="space-y-6">
            {/* Totals row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-surface border border-outline-variant/20 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">
                  Total recaudado
                </p>
                <p className="text-2xl font-extrabold tracking-tight">{formatCOP(reporte.montoTotal)}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {isoToDisplay(reporte.desde)} → {isoToDisplay(reporte.hasta)}
                </p>
              </div>
              <div className="rounded-2xl bg-surface border border-outline-variant/20 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">
                  Transacciones
                </p>
                <p className="text-2xl font-extrabold tracking-tight">{reporte.totalTransacciones}</p>
                <p className="text-xs text-on-surface-variant mt-1">pagos aprobados en el período</p>
              </div>
              <div className="rounded-2xl bg-surface border border-outline-variant/20 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">
                  Ticket promedio
                </p>
                <p className="text-2xl font-extrabold tracking-tight">{formatCOP(reporte.promedioTransaccion)}</p>
                <p className="text-xs text-on-surface-variant mt-1">por transacción</p>
              </div>
            </div>

            {/* Breakdown by method */}
            {Object.keys(reporte.desglosePorMetodo).length > 0 && (
              <div className="rounded-2xl bg-surface border border-outline-variant/20 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">
                  Desglose por método de pago
                </p>
                <div className="space-y-3">
                  {Object.entries(reporte.desglosePorMetodo).map(([metodo, vals]) => {
                    const pct = reporte.montoTotal > 0
                      ? Math.round((vals.monto / reporte.montoTotal) * 100)
                      : 0;
                    return (
                      <div key={metodo}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold">{metodo}</span>
                          <span className="text-xs text-on-surface-variant">
                            {vals.cantidad} pago{vals.cantidad !== 1 ? "s" : ""} ·{" "}
                            <strong>{formatCOP(vals.monto)}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily detail table */}
            {reporte.detalleDiario.length > 0 && (
              <div className="rounded-2xl bg-surface border border-outline-variant/20 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-outline-variant/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Detalle diario
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Fecha
                        </th>
                        <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Transacciones
                        </th>
                        <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Monto
                        </th>
                        <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Método
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {reporte.detalleDiario.map((row) => (
                        <tr key={row.fecha} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-5 py-3 font-medium">{isoToDisplay(row.fecha)}</td>
                          <td className="px-5 py-3 text-right text-on-surface-variant">
                            {row.totalTransacciones}
                          </td>
                          <td className="px-5 py-3 text-right font-bold">{formatCOP(row.montoTotal)}</td>
                          <td className="px-5 py-3 text-right text-xs text-on-surface-variant">
                            {row.metodoPago}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reporte.totalTransacciones === 0 && (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">
                  receipt_long
                </span>
                <p className="font-medium">Sin transacciones en el período seleccionado.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Alertas de Vencimiento ── */}
      <section>
        <SectionHeader
          icon="notification_important"
          title="Alertas de Vencimiento"
          sub="Membresías activas próximas a expirar"
        />

        {/* Days selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[7, 15, 30].map((d) => (
            <button
              key={d}
              id={`alertas-${d}-dias-btn`}
              onClick={() => {
                setDiasAlerta(d);
                loadAlertas(d);
              }}
              disabled={isPending}
              className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                diasAlerta === d
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              Próximos {d} días
            </button>
          ))}
        </div>

        {alertasError && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm font-medium mb-4">
            ⚠️ {alertasError}
          </div>
        )}

        {alertas !== null && alertas.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">
              check_circle
            </span>
            <p className="font-medium">
              No hay membresías por vencer en los próximos {diasAlerta} días.
            </p>
          </div>
        )}

        {alertas && alertas.length > 0 && (
          <div className="rounded-2xl bg-surface border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {alertas.length} membresía{alertas.length !== 1 ? "s" : ""} próxima
                {alertas.length !== 1 ? "s" : ""} a vencer
              </p>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {alertas.map((a) => (
                <div
                  key={a.clienteId}
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">
                        person
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{a.clienteNombre}</p>
                      <p className="text-xs text-on-surface-variant">
                        {a.tipoMembresia} · vence el {isoToDisplay(a.fechaFin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge dias={a.diasRestantes} />
                    <span className="text-sm font-extrabold tabular-nums">
                      {a.diasRestantes}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
