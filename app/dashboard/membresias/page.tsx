import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ESTADO_MEMBRESIA } from "@/lib/services/membresia.service";

export const revalidate = 0;

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function MembresiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = getServerClient();

  // Fetch all clients and their memberships
  // We'll order by client name
  let query = supabase
    .from('cliente')
    .select('id, nombre, numero_identificacion, membresia(id, estado_id, fecha_fin, tipo_membresia)')
    .order('nombre', { ascending: true });

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,numero_identificacion.ilike.%${q}%`);
  }

  const { data: clientes, error } = await query;

  const getStatusBadge = (membresias: any[]) => {
    // Get the latest membership (highest fecha_fin or just first if ordered in query)
    const latest = membresias?.sort((a,b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime())[0];
    
    if (!latest) {
      return <span className="bg-neutral-100 text-neutral-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-neutral-200">Sin Membresía</span>;
    }

    switch (latest.estado_id) {
      case ESTADO_MEMBRESIA.ACTIVA:
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-200">Activa</span>;
      case ESTADO_MEMBRESIA.VENCIDA:
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-200">Vencida</span>;
      case ESTADO_MEMBRESIA.CONGELADA:
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-200">Congelada</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Inactiva</span>;
    }
  };

  const getVencimiento = (membresias: any[]) => {
    const latest = membresias?.sort((a,b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime())[0];
    if (!latest) return "-";
    return new Date(latest.fecha_fin + "T00:00:00").toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-neutral-900 uppercase">
            Gestión de Membresías
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">
            Estado de vigencia por cliente
          </p>
        </div>
        <Link 
            href="/dashboard/clientes/nuevo" 
            className="bg-primary text-on-primary font-bold py-3 px-6 rounded-xl transition-all hover:opacity-90 active:scale-95 uppercase text-[10px] tracking-widest flex items-center gap-2"
        >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Registrar Nuevo Cliente
        </Link>
      </header>

      {/* Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-neutral-200">
        <form className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400">search</span>
          <input 
            type="text" 
            name="q"
            defaultValue={q}
            placeholder="Buscar cliente por nombre o identificación..."
            className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </form>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50/50 border-b border-neutral-200">
              <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint">Cliente</th>
              <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint text-center">Estado</th>
              <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint">Siguiente Vencimiento</th>
              <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clientes && clientes.length > 0 ? (
              clientes.map((c: any) => (
                <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-900">{c.nombre}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{c.numero_identificacion}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(c.membresia)}
                  </td>
                  <td className="py-4 px-6 text-sm font-medium">
                    {getVencimiento(c.membresia)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link 
                      href={`/dashboard/clientes/${c.id}`}
                      className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 hover:bg-primary transition-all active:scale-95"
                    >
                      {c.membresia?.length > 0 ? 'Gestionar' : 'Asignar'}
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-neutral-200">group_off</span>
                    <div>
                      <p className="text-neutral-500 font-medium">No se encontraron clientes.</p>
                      <p className="text-xs text-neutral-400 mt-1">Registra nuevos clientes para asignarles una membresía.</p>
                    </div>
                    <Link 
                      href="/dashboard/clientes/nuevo"
                      className="mt-4 bg-primary text-on-primary px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:opacity-90 transition-all active:scale-95"
                    >
                      Registrar Primer Cliente
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
