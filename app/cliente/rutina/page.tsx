import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PlanEntrenamiento } from "@/lib/models/Entrenamiento";
import SolicitarRutinaButton from "./SolicitarRutinaButton";

export default async function ClienteRutinaPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    redirect("/login-cliente");
  }

  // 1. Obtener cliente
  const { data: cliente, error: cliError } = await supabase
    .from("cliente")
    .select("id, nombre")
    .eq("email", user.email)
    .single();

  if (cliError || !cliente) {
    redirect("/login-cliente");
  }

  // 2. Traer el Plan Asignado Activo
  const plan = await PlanEntrenamiento.fetchActivoByCliente(cliente.id);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in duration-500 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-slate-400">fitness_center</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Aún no tienes rutina</h2>
        <p className="text-slate-500 mb-8 max-w-[250px] mx-auto text-sm">
          No se te ha asignado un plan de entrenamiento todavía. Puedes solicitar uno a los entrenadores.
        </p>
        <SolicitarRutinaButton />
      </div>
    );
  }

  const ejercicios = await plan.getEjercicios();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Section */}
      <section>
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center self-start px-3 py-1 bg-surface-tint/10 dark:bg-surface-tint/20 text-surface-tint dark:text-blue-300 rounded-full">
            <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em]">
              Solo Lectura
            </span>
          </div>
          <h1 className="font-['Inter'] text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {plan.getNombre()}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {plan.getObjetivo()}
          </p>
        </div>
      </section>

      {/* Progress / Info Meter */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              EJERCICIOS
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {ejercicios.length} <span className="text-surface-tint text-base">TOTAL</span>
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              ESTADO
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Activo
            </span>
          </div>
        </div>
        
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-surface-tint to-blue-400 w-full rounded-full"></div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-4">
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 ml-1">
          Lista de Ejercicios
        </span>
        
        {ejercicios.map((ej) => (
          <details key={ej.id} className="group bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden cursor-pointer">
            <summary className="flex items-center justify-between p-6 list-none select-none active:scale-[0.98] transition-transform duration-200">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{ej.getNombre()}</h3>
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-tint dark:text-blue-400">
                  {ej.getSeries()} Series x {ej.getRepeticiones()} Reps
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform duration-300">
                expand_more
              </span>
            </summary>
            
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Descanso</span>
                  <span className="font-extrabold text-xl text-slate-900 dark:text-white">{ej.getDescanso()}s</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Orden</span>
                  <span className="font-extrabold text-xl text-slate-900 dark:text-white">#{ej.getOrden()}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  INSTRUCCIONES
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                  {ej.getInstrucciones() || "Descansa lo indicado entre series. Enfócate en la técnica antes de aumentar peso."}
                </p>
              </div>
            </div>
          </details>
        ))}

        {ejercicios.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Este plan no tiene ejercicios configurados todavía.
          </div>
        )}
      </div>

    </div>
  );
}
