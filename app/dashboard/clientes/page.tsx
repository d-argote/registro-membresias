import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientRow from "./ClientRow";

export const revalidate = 0;

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function ClientesListPage() {
  const supabase = getServerClient();
  
  // Fetch all clients ordered by name
  const { data: clientes, error } = await supabase
    .from('cliente')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-8">
            <h2 className="text-xl font-bold mb-2">Error cargando clientes</h2>
            <p className="text-sm font-mono">{error.message}</p>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-neutral-900 uppercase">
            Directorio de Clientes
            </h1>
            <p className="text-sm text-neutral-500 mt-1 font-medium">
            Gestión y búsqueda de usuarios
            </p>
        </div>
        <Link 
            href="/dashboard/clientes/nuevo" 
            className="bg-primary text-on-primary font-bold py-3 px-6 rounded-xl transition-all hover:opacity-90 active:scale-95 uppercase text-[10px] tracking-widest flex items-center gap-2"
        >
            <span className="material-symbols-outlined text-sm">add</span>
            Registrar Cliente
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {clientes && clientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200">
                  <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint">Nombre</th>
                  <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint">ID</th>
                  <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint">Email</th>
                  <th className="py-4 px-6 text-[10px] tracking-widest font-black uppercase text-surface-tint text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cli) => (
                  <ClientRow
                    key={cli.id}
                    id={cli.id}
                    nombre={cli.nombre}
                    numero_identificacion={cli.numero_identificacion}
                    email={cli.email}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-500">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">group_off</span>
            <p className="text-sm">No hay clientes registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
