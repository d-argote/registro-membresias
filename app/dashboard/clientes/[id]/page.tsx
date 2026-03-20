import { createClient } from "@supabase/supabase-js";
import ClientProfile from "./ClientProfile";
import Link from "next/link";

export const revalidate = 0;

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

  const { data: cliente, error: cliErr } = await supabase
    .from('cliente')
    .select('*')
    .eq('id', id)
    .single();

  if (cliErr || !cliente) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-8 border border-red-100">
        <h2 className="text-xl font-bold mb-2 tracking-tight">Error 404 - Cliente no encontrado</h2>
        <p className="text-sm opacity-70">No se encontró el cliente con ID: {id}</p>
        <p className="text-xs mt-4 font-mono">{cliErr?.message}</p>
      </div>
    );
  }

  const { data: membresias } = await supabase
    .from('membresia')
    .select('*')
    .eq('cliente_id', id)
    .order('fecha_fin', { ascending: false })
    .limit(1);

  const membresia = membresias && membresias.length > 0 ? membresias[0] : null;

  const { data: transacciones } = await supabase
    .from('transaccion_pago')
    .select('*, membresia!inner(cliente_id)')
    .eq('membresia.cliente_id', id)
    .order('fecha_pago', { ascending: false });

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
    <main className="p-8 md:p-12 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="mb-12">
        <div className="flex items-center gap-4 text-on-surface-variant mb-4">
          <Link href="/dashboard" className="label-md uppercase tracking-widest text-[10px] font-bold hover:text-primary transition-colors">Management</Link>
          <span className="material-symbols-outlined text-[14px] opacity-40">chevron_right</span>
          <Link href="/dashboard/clientes" className="label-md uppercase tracking-widest text-[10px] font-bold hover:text-primary transition-colors">Customers</Link>
          <span className="material-symbols-outlined text-[14px] opacity-40">chevron_right</span>
          <span className="label-md uppercase tracking-widest text-[10px] font-bold text-primary">{cliente.nombre}</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tighter text-on-background">Customer Profile</h2>
      </header>
      
      <ClientProfile 
        cliente={cliente} 
        membresia={membresia} 
        transacciones={transaccionesClean} 
      />
    </main>
  );
}
