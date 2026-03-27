import { Suspense } from "react";
import Link from "next/link";
import WeeklyIncomeChart from "@/components/dashboard/WeeklyIncomeChart";
import ProjectionWidget from "@/components/dashboard/ProjectionWidget";
import {
  DailyIncomeCard,
  DailyAccessesCard,
  ActiveMembershipsCard,
} from "./components/dashboard-cards";
import { AlertsSection } from "./components/dashboard-alerts";
import {
  KpiCardSkeleton,
  AlertsSectionSkeleton,
  ChartSkeletons,
} from "./components/loading-skeletons";
import { mockProjection } from "@/lib/mockData";

/**
 * Dashboard Main Page – Server Component with Real Data
 * Fetches all metrics from Supabase in real-time using async Server Components
 */
export default async function DashboardPage() {
  return (
    <>
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-background uppercase">
            Command Center
          </h1>
          <p className="text-on-surface-variant text-sm tracking-wide font-medium">
            Performance Metrics & Operational Vitality
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/membresias"
            className="bg-surface-container-high text-primary px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-surface-container-highest transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              card_membership
            </span>
            Membresías
          </Link>
          <Link
            href="/dashboard/clientes"
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Asignar Membresía
          </Link>
        </div>
      </header>

      {/* Quick Access Grid */}
      <section className="bg-surface-container-low/30 p-1 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-outline-variant/10 rounded-xl bg-white/50 backdrop-blur-sm shadow-inner">
          <div className="flex flex-col gap-1 p-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-tint opacity-60">
              Operaciones
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/clientes/nuevo"
                className="text-xs font-bold hover:text-primary flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  person_add
                </span>
                Registrar Nuevo Cliente
              </Link>
              <Link
                href="/dashboard/membresias"
                className="text-xs font-bold hover:text-primary flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  assignment_turned_in
                </span>
                Ver Estado de Membresías
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Row with Suspense Boundaries */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<KpiCardSkeleton />}>
          <DailyIncomeCard />
        </Suspense>

        <Suspense fallback={<KpiCardSkeleton />}>
          <DailyAccessesCard />
        </Suspense>

        <Suspense fallback={<KpiCardSkeleton />}>
          <ActiveMembershipsCard />
        </Suspense>
      </section>

      {/* Critical Alerts Section with Suspense */}
      <Suspense fallback={<AlertsSectionSkeleton />}>
        <AlertsSection />
      </Suspense>

      {/* Revenue Chart Section with Suspense */}
      <Suspense fallback={<ChartSkeletons />}>
        <section className="grid grid-cols-12 gap-8">
          <WeeklyIncomeChart />
          <ProjectionWidget
            value={mockProjection.value}
            description={mockProjection.description}
          />
        </section>
      </Suspense>
    </>
  );
}
