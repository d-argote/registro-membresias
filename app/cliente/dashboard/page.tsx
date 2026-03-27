import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Membresia, EstadoMembresia, TipoMembresia } from "@/lib/models/Membresia";

export default async function ClienteDashboard() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    redirect("/login-cliente");
  }

  // 1. Obtener el registro del cliente
  const { data: cliente, error: cliError } = await supabase
    .from("cliente")
    .select("id, nombre, numero_identificacion")
    .eq("email", user.email)
    .single();

  if (cliError || !cliente) {
    // Si no está el cliente en BD, algo falló en la sincronización, redirige con error.
    redirect("/login-cliente?error=No_Encontrado");
  }

  // 2. Obtener Membresía 
  const membresia = await Membresia.fetchLatestActivaByCliente(cliente.id);

  let estadoTexto = "SIN MEMBRESÍA";
  let esActiva = false;
  let tipoTexto = "N/A";
  let diasRestantes = 0;
  let racha = 0; // Valor de placeholder

  if (membresia) {
    const estado = membresia.getEstado();
    if (estado === EstadoMembresia.ACTIVA) {
      estadoTexto = "MEMBRESÍA ACTIVA";
      esActiva = true;
    } else if (estado === EstadoMembresia.CONGELADA) {
      estadoTexto = "MEMBRESÍA CONGELADA";
    } else {
      estadoTexto = "MEMBRESÍA VENCIDA";
    }

    const tipo = membresia.getTipo();
    tipoTexto = tipo === TipoMembresia.ANUAL ? "PREMIUM MEMBER" : "CLASSIC MEMBER";
    diasRestantes = membresia.calcularDiasRestantes();
    racha = Math.min(diasRestantes, 30); // Placeholder de simulación para UI
  }

  // Tarjeta encriptada simulada (últimos 4 dígitos del doc)
  const oculto = "**** **** **** " + cliente.numero_identificacion.slice(-4).padStart(4, "0");

  const primerNombre = cliente.nombre.split(" ")[0];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Greeting */}
      <section>
        <p className="text-slate-500 font-bold text-[0.75rem] uppercase tracking-[0.05em] mb-1">
          Panel de Control
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Hola, {primerNombre}
        </h2>
      </section>

      {/* Digital Membership Card */}
      <section className="relative group">
        <div className="aspect-[1.586/1] w-full rounded-xl p-8 flex flex-col justify-between overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02] bg-gradient-to-br from-slate-900 via-surface-tint to-slate-900 dark:from-slate-800 dark:via-surface-tint dark:to-slate-950">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">
                {tipoTexto}
              </p>
              <h3 className="text-white text-2xl font-bold tracking-tight">
                {cliente.nombre}
              </h3>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-1">
              <span className="material-symbols-outlined text-white">contactless</span>
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div className="space-y-4">
              <div className={`inline-flex items-center px-3 py-1 ${esActiva ? "bg-white text-surface-tint" : "bg-red-500 text-white"} rounded-full`}>
                <span className="text-[10px] font-black tracking-widest uppercase">
                  {estadoTexto}
                </span>
              </div>
              <div className="text-white/60 font-mono text-xs tracking-[0.2em] font-semibold">
                {oculto}
              </div>
            </div>

            {/* Simulated QR Code */}
            <div className="w-16 h-16 bg-white p-1 rounded-lg shadow-inner">
              {/* Fallback image if external URL fails, keeping the design */}
              <img 
                alt="Membership QR Code" 
                className="w-full h-full object-cover rounded-md" 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">Tu Progreso</h4>
            <p className="text-slate-500 text-xs">Asistencia Diaria</p>
          </div>
          <div className="text-right">
            <span className="text-slate-900 dark:text-white font-black text-xl">{diasRestantes}</span>
            <span className="text-slate-500 text-sm font-medium"> / {membresia?.getTipo() === TipoMembresia.ANUAL ? '365' : '30'} DÍAS</span>
          </div>
        </div>

        {/* Capacity Meter */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-surface-tint to-blue-400 rounded-full transition-all"
            style={{ width: membresia ? `${(diasRestantes / (membresia.getTipo() === TipoMembresia.ANUAL ? 365 : 30)) * 100}%` : '0%' }}
          ></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Días Restantes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{diasRestantes}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Racha Actual</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{racha}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions Bento Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-1 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col justify-between aspect-[1.2] group cursor-pointer hover:bg-surface-tint hover:text-white dark:hover:bg-surface-tint transition-all duration-300">
          <span className="material-symbols-outlined text-surface-tint group-hover:text-white text-3xl">event_available</span>
          <p className="font-bold tracking-tight text-slate-900 group-hover:text-white dark:text-white">Reservar Clase</p>
        </div>
        <div className="col-span-1 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between aspect-[1.2] cursor-pointer hover:shadow-lg transition-all">
          <span className="material-symbols-outlined text-slate-900 dark:text-white text-3xl">monitoring</span>
          <p className="font-bold tracking-tight text-slate-900 dark:text-white">Estadísticas</p>
        </div>
      </section>
    </div>
  );
}
