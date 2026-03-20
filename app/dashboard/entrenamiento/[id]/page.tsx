import { PlanEntrenamiento } from "@/lib/models/Entrenamiento";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function DetallePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Utilize the OOP Model method to retrieve data
  const plan = await PlanEntrenamiento.fetchById(id);
  
  if (!plan) {
    return notFound();
  }

  // OOP Domain logic: get exercises
  const ejercicios = await plan.getEjercicios();

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#f9f9ff] dark:bg-[#111c2d] flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
            <div className="w-full h-full bg-slate-300"></div>
          </div>
          <span className="font-['Inter'] font-bold tracking-[-0.02em] text-lg text-[#000000] dark:text-white uppercase">
            IRON LEDGER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[#45464d] dark:text-[#c6c6cd] hover:opacity-70 transition-opacity active:scale-95 duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="mt-20 px-6 max-w-2xl mx-auto">
        {/* Header Section */}
        <section className="mb-10">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center self-start px-3 py-1 bg-surface-container-high rounded-full">
              <span className="font-label text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                {plan.isActivo() ? "SOLO LECTURA - ACTIVO" : "INACTIVO"}
              </span>
            </div>
            {/* Using the getNombre() method required by user */}
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-background">
              {plan.getNombre()}
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">
              {plan.getObjetivo()}
            </p>
          </div>
        </section>

        {/* Capacity / Progress Meter */}
        <div className="mb-10 p-6 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(17,28,45,0.04)]">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="block font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">INTENSIDAD GENERAL</span>
              <span className="text-2xl font-black text-on-background">ALTA <span className="text-surface-tint">8/10</span></span>
            </div>
            <div className="text-right">
              <span className="block font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">DURACIÓN</span>
              <span className="text-lg font-bold text-on-background">{ejercicios.length * 15} MIN</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-surface-tint to-on-tertiary-container w-[80%] rounded-full"></div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          <span className="font-label text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant ml-1">EJERCICIOS DEL DÍA</span>
          
          {ejercicios.map((ej) => (
            <details key={ej.id} className="group bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(17,28,45,0.02)] overflow-hidden" open>
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none active:scale-[0.98] transition-transform duration-200">
                <div className="flex flex-col gap-1">
                  <h3 className="font-headline font-bold text-lg text-on-background">{ej.getNombre()}</h3>
                  <p className="font-label text-[11px] font-bold uppercase tracking-wider text-surface-tint">
                    {ej.getSeries()} Series x {ej.getRepeticiones()} Reps
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform duration-300">expand_more</span>
              </summary>
              <div className="px-6 pb-6 pt-2 border-t border-outline-variant/10">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <span className="block font-label text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">TIEMPO DE DESCANSO</span>
                    <span className="font-headline font-extrabold text-xl">{ej.getDescanso()}s</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <span className="block font-label text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">RPE OBJETIVO</span>
                    <span className="font-headline font-extrabold text-xl">8.0</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">INSTRUCCIONES</span>
                  <p className="text-on-surface leading-relaxed text-sm">Realizar el ejercicio enfocado en la conexión mente-músculo y manteniendo la técnica correcta en todo el rango de movimiento.</p>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 opacity-40 text-center">
          <span className="font-label text-[10px] font-black uppercase tracking-[0.2em]">KINETIC PRECISION FRAMEWORK</span>
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-3 bg-[#f9f9ff]/80 dark:bg-[#111c2d]/80 backdrop-blur-md border-t border-[#c6c6cd]/15 shadow-[0_-10px_30px_rgba(17,28,45,0.04)] rounded-t-3xl">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-[#45464d] dark:text-[#c6c6cd] px-5 py-2 hover:text-[#000000] dark:hover:text-white transition-colors active:scale-90 duration-200">
          <span className="material-symbols-outlined">home</span>
          <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Home</span>
        </Link>
        <Link href={`/dashboard/entrenamiento/${id}`} className="flex flex-col items-center justify-center bg-[#000000] dark:bg-[#f0f3ff] text-white dark:text-[#00174b] rounded-2xl px-5 py-2 active:scale-90 duration-200">
          <span className="material-symbols-outlined">fitness_center</span>
          <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">My Plan</span>
        </Link>
        <Link href="/dashboard/clientes" className="flex flex-col items-center justify-center text-[#45464d] dark:text-[#c6c6cd] px-5 py-2 hover:text-[#000000] dark:hover:text-white transition-colors active:scale-90 duration-200">
          <span className="material-symbols-outlined">person</span>
          <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
