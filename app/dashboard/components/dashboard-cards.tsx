import KpiCard from "@/components/dashboard/KpiCard";
import { DashboardService } from "@/lib/services/dashboard.service";

/**
 * Daily Income Card Component – Fetches real data
 */
export async function DailyIncomeCard() {
  const ingresos = await DashboardService.getIngresosHoyYVariacion();
  
  return (
    <KpiCard
      title="Ingresos del día"
      value={ingresos.totalFormato}
      subtext={ingresos.variacionFormato}
      hoverEffect={true}
    />
  );
}

/**
 * Daily Accesses Card Component – Fetches real data
 */
export async function DailyAccessesCard() {
  const accesos = await DashboardService.getAccesosHoyYVariacion();
  
  return (
    <KpiCard
      title="Accesos de hoy"
      value={accesos.total.toString()}
      subtext={accesos.capacidadFormato}
      bgColor="bg-surface-container-low"
      progressValue={accesos.capacidadPorcentaje}
    />
  );
}

/**
 * Active Memberships Card Component – Fetches real data
 */
export async function ActiveMembershipsCard() {
  const [vigentes, variacion] = await Promise.all([
    DashboardService.getMembresiasVigentes(),
    DashboardService.getMembresiasVariacionSemana(),
  ]);

  const variacionText = variacion > 0 ? `+${variacion} esta semana` : `${variacion} esta semana`;

  return (
    <KpiCard
      title="Membresías Vigentes"
      value={vigentes.toString()}
      subtext={variacionText}
      bgColor="bg-surface-container-highest"
    />
  );
}
