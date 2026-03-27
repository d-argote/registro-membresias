"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  MasterDetailData, 
  ClienteAsignacionDTO, 
  obtenerDatosMasterDetail, 
  asignarPlanAction 
} from "../../actions/asignacion.actions";

export default function AsignacionPlanesPage() {
  const [data, setData] = useState<MasterDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filtro, setFiltro] = useState<"Todos" | "Sin Plan" | "Solicitudes">("Todos");
  const [search, setSearch] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteAsignacionDTO | null>(null);
  
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    setError(null);
    const result = await obtenerDatosMasterDetail();
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  };

  const manejarAsignacion = async () => {
    if (!clienteSeleccionado || !planSeleccionadoId) return;
    
    setIsAssigning(true);
    const result = await asignarPlanAction(clienteSeleccionado.id, planSeleccionadoId);
    
    if (result.success) {
      alert("Plan de entrenamiento asignado correctamente");
      await cargarDatos();
      setClienteSeleccionado(null);
      setPlanSeleccionadoId("");
    } else {
      alert("Error: " + result.error.message);
    }
    setIsAssigning(false);
  };

  const clientesFiltrados = useMemo(() => {
    if (!data?.clientes) return [];
    let filtrados = data.clientes;
    
    if (search) {
      const s = search.toLowerCase();
      filtrados = filtrados.filter(c => c.nombre.toLowerCase().includes(s));
    }
    
    if (filtro === "Sin Plan") {
      filtrados = filtrados.filter(c => !c.planActivoId);
    } else if (filtro === "Solicitudes") {
      filtrados = filtrados.filter(c => c.solicitaRutina);
    }
    
    return filtrados;
  }, [data, search, filtro]);

  const initials = (name: string) => {
    const parts = name.split(" ");
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "").toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center p-8 text-on-surface-variant w-full bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10">
        <span className="material-symbols-outlined animate-spin text-4xl" data-icon="progress_activity">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center p-8 text-error w-full bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10">
        <span className="material-symbols-outlined text-4xl mb-4" data-icon="error">error</span>
        <p className="font-bold text-lg">{error}</p>
        <button onClick={cargarDatos} className="mt-6 px-6 py-3 bg-surface-tint text-white rounded-xl text-sm font-bold shadow hover:bg-on-primary-fixed-variant transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden h-[80vh]">
      {/* Master List Column (35%) */}
      <section className="w-[35%] border-r border-surface-container flex flex-col bg-surface z-10">
        <div className="p-6 pb-4 shrink-0 shadow-sm z-20 bg-surface">
          <h1 className="text-xs font-black tracking-widest text-on-surface-variant mb-4 uppercase">Asignación de Planes</h1>
          
          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
            <input 
              className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface" 
              placeholder="Buscar cliente..." 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setFiltro("Todos")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${filtro === "Todos" ? "bg-on-background text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFiltro("Sin Plan")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${filtro === "Sin Plan" ? "bg-on-background text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
            >
              Sin Plan
            </button>
            <button 
              onClick={() => setFiltro("Solicitudes")}
              className={`relative px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${filtro === "Solicitudes" ? "bg-on-background text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
            >
              Solicitudes
              {data?.clientes.some(c => c.solicitaRutina) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full translate-x-1/4 -translate-y-1/4"></span>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8 pt-4 bg-surface z-0">
          {clientesFiltrados.map(cliente => {
            const isActive = cliente.id === clienteSeleccionado?.id;
            
            let StatusBadge;
            if (cliente.solicitaRutina) {
               StatusBadge = <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-black tracking-tighter bg-error-container text-on-error-container uppercase">Solicita Rutina</span>;
            } else if (cliente.planActivoId) {
               StatusBadge = <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-black tracking-tighter bg-secondary-container text-on-secondary-container uppercase">Plan: {cliente.planActivoNombre}</span>;
            } else {
               StatusBadge = <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-black tracking-tighter bg-surface-variant text-on-surface-variant uppercase">Sin Plan Activo</span>;
            }

            return (
              <div 
                key={cliente.id} 
                onClick={() => setClienteSeleccionado(cliente)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'bg-surface-container-low border-surface-tint shadow-sm' : 'bg-surface-container-lowest border-transparent hover:bg-surface-container-low shadow-sm'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-surface-tint text-white shadow-md' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {initials(cliente.nombre)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{cliente.nombre}</p>
                    {StatusBadge}
                  </div>
                  {isActive && <span className="material-symbols-outlined text-surface-tint" data-icon="chevron_right">chevron_right</span>}
                </div>
              </div>
            );
          })}
          
          {clientesFiltrados.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center mt-10">No se encontraron clientes.</p>
          )}
        </div>
      </section>

      {/* Detail Column (65%) */}
      <section className="w-[65%] flex flex-col bg-background relative overflow-y-auto z-0">
        {clienteSeleccionado ? (
          <div className="p-10 max-w-4xl mx-auto w-full">
            {/* Detail Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-3xl font-black text-on-surface tracking-tight">{clienteSeleccionado.nombre}</h2>
                  <span className="text-xs font-mono text-outline-variant py-1 px-2 bg-surface-container rounded uppercase" title={clienteSeleccionado.id}>
                    ID: {clienteSeleccionado.id.substring(0,8)}
                  </span>
                </div>
                {clienteSeleccionado.tieneDiscapacidad && (
                    <div className="flex items-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-xs font-bold border border-error-container shadow-sm">
                        <span className="material-symbols-outlined text-sm" data-icon="warning">warning</span>
                        Discapacidad: {clienteSeleccionado.descripcionDiscapacidad || "Registrada"}
                      </span>
                    </div>
                )}
              </div>
            </div>

            {/* Template Selection */}
            <div className="mb-12">
              <label className="block text-[10px] font-black tracking-[0.2em] text-on-surface-variant mb-4 uppercase">Seleccionar Plantilla de Entrenamiento</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-surface-tint transition-colors" data-icon="fitness_center">fitness_center</span>
                <select 
                   className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-surface-tint/20 focus:border-surface-tint appearance-none cursor-pointer text-on-surface transition-all hover:bg-surface-container-low"
                   value={planSeleccionadoId}
                   onChange={e => setPlanSeleccionadoId(e.target.value)}
                >
                  <option value="" disabled>-- Selecciona un plan pre-diseñado --</option>
                  {data?.planesDisponibles.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none group-hover:text-surface-tint transition-colors" data-icon="expand_more">expand_more</span>
              </div>
            </div>
            
            {/* Context/Preview placeholder (Optional) */}
            {planSeleccionadoId && (
              <div className="bg-surface-container/30 rounded-2xl p-6 border border-surface-container mb-12 shadow-inner">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full bg-surface-tint/10 flex items-center justify-center">
                     <span className="material-symbols-outlined text-surface-tint text-sm" data-icon="info">info</span>
                   </div>
                   <h3 className="font-bold text-sm text-on-surface">Detalles del Plan</h3>
                </div>
                <p className="text-sm text-on-surface-variant pl-11">
                   {data?.planesDisponibles.find(p => p.id === planSeleccionadoId)?.objetivo || "Sin objetivo específico definido."}
                </p>
              </div>
            )}

            {/* Footer Action */}
            <div className="flex flex-col items-center gap-6 mt-12 bg-surface-container-lowest p-8 rounded-2xl border border-surface-container shadow-sm">
              {clienteSeleccionado.planActivoId && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-secondary-container/30 rounded-full border border-secondary-container/50">
                      <span className="material-symbols-outlined text-on-secondary-container" data-icon="warning">warning</span>
                      <p className="text-xs font-bold text-on-secondary-container">Asignar este plan reemplazará "{clienteSeleccionado.planActivoNombre}".</p>
                  </div>
              )}
              <button 
                  onClick={manejarAsignacion}
                  disabled={!planSeleccionadoId || isAssigning}
                  className="w-full md:w-auto px-12 py-4 bg-surface-tint text-white font-black tracking-widest text-sm rounded-xl shadow-lg hover:shadow-xl hover:bg-on-primary-fixed-variant disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-3 uppercase"
              >
                {isAssigning ? (
                    <span className="material-symbols-outlined animate-spin" data-icon="autorenew">autorenew</span>
                ) : (
                    <span className="material-symbols-outlined" data-icon="check_circle">check_circle</span>
                )}
                {isAssigning ? "Asignando..." : "Asignar Rutina"}
              </button>
            </div>
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center justify-center text-on-surface-variant max-w-sm text-center">
             <div className="w-24 h-24 rounded-full bg-surface-container mb-6 flex items-center justify-center shadow-inner">
               <span className="material-symbols-outlined text-5xl text-outline" data-icon="person_search">person_search</span>
             </div>
             <h3 className="text-xl font-black mb-2 text-on-surface tracking-tight">Selecciona un Atleta</h3>
             <p className="text-sm leading-relaxed">Busca y selecciona un cliente en la lista para ver su perfil y asignarle un nuevo programa de entrenamiento.</p>
          </div>
        )}
      </section>
    </div>
  );
}
