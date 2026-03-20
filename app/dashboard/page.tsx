import KpiCard from "@/components/dashboard/KpiCard";
import AlertSection from "@/components/dashboard/AlertSection";
import WeeklyIncomeChart from "@/components/dashboard/WeeklyIncomeChart";
import ProjectionWidget from "@/components/dashboard/ProjectionWidget";
import { mockAlerts, mockKpis, mockProjection } from "@/lib/mockData";

export default function DashboardPage() {
  return (
    <>
      {/* Welcome Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tighter text-on-background uppercase">
          Command Center
        </h1>
        <p className="text-on-surface-variant text-sm tracking-wide font-medium">
          Performance Metrics & Operational Vitality
        </p>
      </header>

      {/* KPI Row: Asymmetric Tonal Layering */}
      <section className="grid grid-cols-12 gap-6">
        <KpiCard
          title="Ingresos del día"
          value={mockKpis.dailyIncome.value}
          subtext={mockKpis.dailyIncome.subtext}
          hoverEffect={true}
        />
        <KpiCard
          title="Accesos de hoy"
          value={mockKpis.dailyAccesses.value}
          subtext={mockKpis.dailyAccesses.subtext}
          bgColor="bg-surface-container-low"
          progressValue={mockKpis.dailyAccesses.progress}
        />
        <KpiCard
          title="Total Clientes Activos"
          value={mockKpis.activeClients.value}
          subtext={mockKpis.activeClients.subtext}
          bgColor="bg-surface-container-highest"
        />
      </section>

      {/* Critical Alerts Section */}
      <AlertSection alerts={mockAlerts} />

      {/* Revenue Chart Section */}
      <section className="grid grid-cols-12 gap-8">
        <WeeklyIncomeChart />
        <ProjectionWidget
          value={mockProjection.value}
          description={mockProjection.description}
        />
      </section>
    </>
  );
}
