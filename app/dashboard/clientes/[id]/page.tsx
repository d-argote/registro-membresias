import { createClient } from "@supabase/supabase-js";
import ClientProfile from "./ClientProfile";

export const revalidate = 0; // Ensure fresh data depending on how the app router handles caching

// Utilidad para bypasear RLS en el servidor tal como se usa en actions/clientes.ts
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerClient();

  // 1. Fetch client
  const { data: cliente, error: cliErr } = await supabase
    .from('cliente')
    .select('*')
    .eq('id', id)
    .single();

  if (cliErr || !cliente) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-8">
        <h2 className="text-xl font-bold mb-2">Error 404 - Cliente no encontrado</h2>
        <p>No se encontró el cliente con ID: {id}</p>
        <p className="text-sm mt-2 font-mono">{cliErr?.message}</p>
      </div>
    );
  }

  // 2. Fetch latest membresia
  const { data: membresias } = await supabase
    .from('membresia')
    .select('*')
    .eq('cliente_id', id)
    .order('fecha_fin', { ascending: false })
    .limit(1);

  const membresia = membresias && membresias.length > 0 ? membresias[0] : null;

  // 3. Fetch all transacciones of the client
  // Join transaccion_pago with membresia to filter by cliente_id
  const { data: transacciones } = await supabase
    .from('transaccion_pago')
    .select('*, membresia!inner(cliente_id)')
    .eq('membresia.cliente_id', id)
    .order('fecha_pago', { ascending: false });

  // Clean data to avoid hydration issues with complex Supabase objects
  const transaccionesClean: any[] = transacciones?.map(t => ({
    id: t.id,
    membresia_id: t.membresia_id,
    metodo_pago_id: t.metodo_pago_id,
    monto: t.monto,
    fecha_pago: t.fecha_pago,
    estado_recibo: t.estado_recibo,
    created_at: t.created_at || t.fecha_pago
  })) || [];

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 tracking-tight">
          Perfil 360° del Cliente
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Gestión de información, membresías y finanzas
        </p>
      </div>
      
      <ClientProfile 
        cliente={cliente} 
        membresia={membresia} 
        transacciones={transaccionesClean} 
      />
    </div>
  );
}
