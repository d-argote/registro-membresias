"use client";

import Link from "next/link";

type PlanDisplay = {
  id: string;
  nombre: string;
  objetivo: string;
  activo: boolean;
  ejerciciosCount: number;
  estimatedTimeMin: number;
};

export default function PlanListClient({ initialPlans }: { initialPlans: PlanDisplay[] }) {
  return (
    <main className="flex-1 flex flex-col p-8 lg:p-12 gap-10 min-h-screen pb-32">
      {/* Top Toolbar */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tighter text-on-background">Librería de Plantillas</h1>
          <p className="text-on-surface-variant text-sm font-medium">Gestiona y personaliza tus protocolos de entrenamiento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              type="text" 
              placeholder="Buscar plantillas..." 
              className="pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-lg text-sm w-64 focus:ring-1 focus:ring-surface-tint transition-all placeholder:text-outline-variant"
            />
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Categoría
            </button>
          </div>
          <Link 
            href="/dashboard/entrenamiento/nuevo"
            className="flex items-center gap-2 px-6 py-2.5 bg-surface-tint text-on-primary rounded-md font-bold text-sm shadow-lg shadow-surface-tint/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nueva Plantilla
          </Link>
        </div>
      </header>
      
      {/* Templates Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {initialPlans.length === 0 ? (
          <p className="col-span-3 p-8 text-on-surface-variant font-medium text-sm">
            No se encontraron plantillas en la base de datos.
          </p>
        ) : (
          initialPlans.map((plan) => (
            <div key={plan.id} className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between group hover:shadow-2xl hover:shadow-on-surface/5 transition-all duration-300 border border-transparent hover:border-outline-variant/10">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                    {plan.activo ? "Activo" : "Inactivo"}
                  </span>
                  <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/entrenamiento/${plan.id}/editar`} className="p-1.5 hover:bg-surface-container text-outline hover:text-primary rounded-lg transition-colors" title="Editar">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </Link>
                    <button className="p-1.5 hover:bg-error-container/30 text-outline hover:text-error rounded-lg transition-colors" title="Eliminar">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-on-background leading-tight mb-1">{plan.nombre}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{plan.objetivo || "Sin objetivo definido."}</p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/5">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">exercise</span>
                  <span className="text-xs font-semibold">{plan.ejerciciosCount} Ejercicios</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  <span className="text-xs font-semibold">{plan.estimatedTimeMin} min</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Empty/Add State Aesthetic */}
        <Link 
          href="/dashboard/entrenamiento/nuevo"
          className="bg-surface-container-low/40 p-6 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/20 group hover:border-surface-tint/50 transition-all cursor-pointer min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-surface-tint group-hover:text-on-primary transition-all">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <span className="text-sm font-bold text-on-surface-variant group-hover:text-surface-tint transition-colors">Crear Nueva Plantilla</span>
        </Link>
      </section>

      {/* Metrics Strip */}
      <footer className="mt-auto pt-10">
        <div className="bg-primary p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>
          <div className="flex gap-12 relative z-10">
            <div className="text-on-primary">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Total Plantillas</p>
              <p className="text-3xl font-black tracking-tighter leading-none">{initialPlans.length}</p>
            </div>
            <div className="hidden sm:block text-on-primary">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Populares</p>
              <p className="text-3xl font-black tracking-tighter leading-none">Hipertrofia</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
