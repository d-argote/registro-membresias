"use client";

import { useState } from "react";
import { registrarPagoAction, congelarAction, reactivarAction } from "@/app/actions/membresias";
import { ESTADO_MEMBRESIA, TIPO_MEMBRESIA } from "@/lib/services/membresia.service";

export default function ClientProfile({ cliente, membresia, transacciones }: any) {
  const [activeTab, setActiveTab] = useState("nuevo_pago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [tipo, setTipo] = useState<number>(TIPO_MEMBRESIA.MENSUAL);
  const [metodo, setMetodo] = useState<number>(1); // e.g., Efectivo = 1
  const [monto, setMonto] = useState<number>(0);

  const diffDays = (date1: Date, date2: Date) => {
    return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const today = new Date();
  today.setHours(0,0,0,0);
  
  let remainingDays = 0;
  if (membresia?.estado_id === ESTADO_MEMBRESIA.ACTIVA && membresia?.fecha_fin) {
    const end = new Date(membresia.fecha_fin + "T00:00:00");
    remainingDays = diffDays(today, end);
    if (remainingDays < 0) remainingDays = 0;
  }

  const getStatusBadge = (estado_id: number | undefined) => {
    switch (estado_id) {
      case ESTADO_MEMBRESIA.ACTIVA:
        return <span className="bg-green-500/20 text-green-600 px-6 py-3 rounded-full uppercase text-xs tracking-widest font-black inline-block border border-green-500/30">Activa</span>;
      case ESTADO_MEMBRESIA.VENCIDA:
        return <span className="bg-error-container text-red-600 px-6 py-3 rounded-full uppercase text-xs tracking-widest font-black inline-block border border-red-500/30">Vencida</span>;
      case ESTADO_MEMBRESIA.CONGELADA:
        return <span className="bg-blue-500/20 text-blue-600 px-6 py-3 rounded-full uppercase text-xs tracking-widest font-black inline-block border border-blue-500/30">Congelada</span>;
      default:
        return <span className="bg-surface-container-lowest text-surface-tint px-6 py-3 rounded-full uppercase text-xs tracking-widest font-black inline-block">Sin Membresía</span>;
    }
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await registrarPagoAction({
      cliente_id: cliente.id,
      tipo_membresia_id: Number(tipo),
      metodo_pago_id: Number(metodo),
      monto: Number(monto)
    });
    if (!res.success) setError(String(res.error));
    else {
      setMonto(0);
      setActiveTab("historial");
    }
    setLoading(false);
  };

  const handleCongelar = async () => {
    if (!membresia) return;
    setLoading(true);
    setError(null);
    const res = await congelarAction(membresia.id, cliente.id);
    if (!res.success) setError(String(res.error));
    setLoading(false);
  };

  const handleReactivar = async () => {
    if (!membresia) return;
    setLoading(true);
    setError(null);
    const res = await reactivarAction(membresia.id, cliente.id);
    if (!res.success) setError(String(res.error));
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      
      {/* COLUMN LEFT: Info & Status */}
      <div className="flex flex-col gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-neutral-100 flex items-center justify-center text-3xl text-neutral-400 font-bold uppercase">
            {cliente.nombre.slice(0, 2)}
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-1">{cliente.nombre}</h2>
          <p className="text-neutral-500 text-sm mb-4">{cliente.email}</p>
          <div className="text-[10px] tracking-widest font-black uppercase text-surface-tint opacity-50 mb-6">
            ID: {cliente.id.split('-')[0]}
          </div>

          <div className="mb-6">
            {getStatusBadge(membresia?.estado_id)}
          </div>

          {membresia && (
            <div className="w-full bg-neutral-50 rounded-xl p-4 text-left border border-neutral-100">
              <h3 className="text-[10px] tracking-widest font-black uppercase text-surface-tint mb-3 border-b pb-2">Detalles Vigencia</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-neutral-500">INICIO</span>
                <span className="text-sm font-semibold">{formatDate(membresia.fecha_inicio)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-neutral-500">FIN</span>
                <span className="text-sm font-semibold">{formatDate(membresia.fecha_fin)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-surface-tint uppercase font-black tracking-widest">Días Restantes</span>
                <span className="text-xl font-bold text-neutral-800">
                  {membresia.estado_id === ESTADO_MEMBRESIA.ACTIVA ? remainingDays : 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN RIGHT: Actions & Tabs */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
        
        {/* TABS HEADER */}
        <div className="flex border-b border-neutral-200">
          <button 
            onClick={() => setActiveTab('nuevo_pago')}
            className={`flex-1 py-4 text-[10px] tracking-widest font-black uppercase transition-all ${activeTab === 'nuevo_pago' ? 'border-b-2 border-neutral-800 text-neutral-800' : 'text-surface-tint hover:bg-neutral-50'}`}
          >
            Nuevo Pago
          </button>
          <button 
            onClick={() => setActiveTab('gestion')}
            className={`flex-1 py-4 text-[10px] tracking-widest font-black uppercase transition-all ${activeTab === 'gestion' ? 'border-b-2 border-neutral-800 text-neutral-800' : 'text-surface-tint hover:bg-neutral-50'}`}
          >
            Gestión
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`flex-1 py-4 text-[10px] tracking-widest font-black uppercase transition-all ${activeTab === 'historial' ? 'border-b-2 border-neutral-800 text-neutral-800' : 'text-surface-tint hover:bg-neutral-50'}`}
          >
            Historial
          </button>
        </div>

        {/* TABS CONTENT */}
        <div className="p-6 flex-1 bg-white">
          {error && (
            <div className="bg-error-container text-red-700 p-4 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          {/* TAB 1: NUEVO PAGO */}
          {activeTab === 'nuevo_pago' && (
            <form onSubmit={handlePago} className="max-w-md mx-auto py-4">
              <h3 className="text-lg font-bold mb-6 text-neutral-800">Registrar Nuevo Pago</h3>
              
              <div className="mb-5">
                <label className="block text-[10px] tracking-widest font-black uppercase text-surface-tint mb-2">Tipo de Membresía</label>
                <select 
                  value={tipo}
                  onChange={(e) => setTipo(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-neutral-800 outline-none transition-all"
                >
                  <option value={TIPO_MEMBRESIA.MENSUAL}>Mensual (30 días)</option>
                  <option value={TIPO_MEMBRESIA.ANUAL}>Anual (360 días)</option>
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] tracking-widest font-black uppercase text-surface-tint mb-2">Método de Pago</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-neutral-800 outline-none transition-all"
                >
                  <option value={1}>Efectivo</option>
                  <option value={2}>Tarjeta de Crédito/Débito</option>
                  <option value={3}>Transferencia Bancaria</option>
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] tracking-widest font-black uppercase text-surface-tint mb-2">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={monto || ""}
                    onChange={(e) => setMonto(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-8 pr-4 text-sm focus:ring-2 focus:ring-neutral-800 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
              >
                {loading ? 'Procesando...' : 'Registrar Pago'}
              </button>
            </form>
          )}

          {/* TAB 2: GESTION */}
          {activeTab === 'gestion' && (
            <div className="max-w-md mx-auto py-4">
              <h3 className="text-lg font-bold mb-6 text-neutral-800">Gestión de la Membresía</h3>

              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 mb-6">
                <h4 className="text-[10px] tracking-widest font-black uppercase text-surface-tint mb-2">Congelar Membresía</h4>
                <p className="text-sm text-neutral-600 mb-4">Pausa la vigencia de la membresía actual. Los días no consumidos se guardarán y se añadirán de vuelta al momento de reactivar.</p>
                <button
                  type="button"
                  onClick={handleCongelar}
                  disabled={loading || membresia?.estado_id !== ESTADO_MEMBRESIA.ACTIVA}
                  className="w-full bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
                >
                  Congelar Membresía
                </button>
              </div>

              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                <h4 className="text-[10px] tracking-widest font-black uppercase text-surface-tint mb-2">Reactivar Membresía</h4>
                <p className="text-sm text-neutral-600 mb-4">Reactiva una membresía congelada y recalcula la nueva fecha de vencimiento sumando los días preservados.</p>
                <button
                  type="button"
                  onClick={handleReactivar}
                  disabled={loading || membresia?.estado_id !== ESTADO_MEMBRESIA.CONGELADA}
                  className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
                >
                  Reactivar Membresía
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="py-2">
              <h3 className="text-lg font-bold mb-6 text-neutral-800 px-2">Historial de Transacciones</h3>
              
              {transacciones && transacciones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b border-neutral-100 py-3 px-4 text-[10px] tracking-widest font-black uppercase text-surface-tint">Fecha</th>
                        <th className="border-b border-neutral-100 py-3 px-4 text-[10px] tracking-widest font-black uppercase text-surface-tint">Monto</th>
                        <th className="border-b border-neutral-100 py-3 px-4 text-[10px] tracking-widest font-black uppercase text-surface-tint">Método</th>
                        <th className="border-b border-neutral-100 py-3 px-4 text-[10px] tracking-widest font-black uppercase text-surface-tint">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacciones.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="border-b border-neutral-50 py-4 px-4 text-sm text-neutral-600">
                            {formatDate(tx.fecha_pago || tx.created_at)}
                          </td>
                          <td className="border-b border-neutral-50 py-4 px-4 text-sm font-semibold text-neutral-800">
                            {formatCurrency(tx.monto)}
                          </td>
                          <td className="border-b border-neutral-50 py-4 px-4 text-sm text-neutral-600">
                            {tx.metodo_pago_id === 1 ? 'Efectivo' : tx.metodo_pago_id === 2 ? 'Tarjeta' : 'Transferencia'}
                          </td>
                          <td className="border-b border-neutral-50 py-4 px-4">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                              {tx.estado_recibo ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  No hay transacciones registradas para este cliente.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
