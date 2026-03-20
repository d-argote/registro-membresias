"use client";

import { useState } from "react";
import { crearPlanAction } from "@/app/actions/entrenamientos";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TemplateCreator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [ejercicios, setEjercicios] = useState<{id: number, nombre: string, series: number | string, repeticiones: number | string, descanso: number | string, instrucciones?: string}[]>([
    { id: 1, nombre: "Press de Banca con Barra", series: 4, repeticiones: 12, descanso: 90, instrucciones: "Centrarse en la retracción escapular durante todo el movimiento." },
    { id: 2, nombre: "Aperturas con Mancuernas", series: 3, repeticiones: 15, descanso: 60, instrucciones: "" }
  ]);

  const handleAddExercise = () => {
    setEjercicios([...ejercicios, { id: Date.now(), nombre: "", series: 3, repeticiones: 10, descanso: 60, instrucciones: "" }]);
  };

  const handleRemoveExercise = (id: number) => {
    setEjercicios(ejercicios.filter(e => e.id !== id));
  };

  const handleChange = (id: number, field: string, value: any) => {
    setEjercicios(ejercicios.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    if (!nombre) {
        setError("El nombre del plan es requerido.");
        return;
    }
    setLoading(true);
    setError("");
    
    // Fetch actual trainer ID from auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        setError("No hay una sesión activa. Vuelva a iniciar sesión.");
        setLoading(false);
        return;
    }
    const entrenadorId = session.user.id;

    // Formatting for action
    const dataToSend = {
      nombre,
      objetivo,
      entrenadorId,
      ejercicios: ejercicios.map((e, idx) => ({
        nombre: e.nombre,
        series: Number(e.series),
        repeticiones: Number(e.repeticiones),
        descanso: Number(e.descanso),
        instrucciones: e.instrucciones,
        orden: idx + 1
      }))
    };

    const res = await crearPlanAction(dataToSend);
    if (!res.success) {
        setError(res.error || "No se pudo guardar la plantilla.");
        setLoading(false);
    } else {
        router.push(`/dashboard/entrenamiento/${res.planId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 relative pb-32">
      {error && <div className="bg-error-container text-error p-4 mb-8 rounded font-bold uppercase tracking-widest text-[10px]">{error}</div>}
      
      {/* Header Section: Plan Definition */}
      <section className="bg-surface-container-low rounded-xl p-10 mb-12 border border-outline-variant/10 shadow-sm">
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-4">Definición del Plan</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del Plan de Entrenamiento"
              className="w-full text-4xl font-black tracking-tighter bg-transparent border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary px-0 pb-4 placeholder:text-surface-dim transition-all"
            />
          </div>
          <div className="relative">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-4">Objetivo General del Plan</label>
            <textarea 
              rows={3} 
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Describe el enfoque principal de este entrenamiento..."
              className="w-full text-lg bg-surface-container-lowest border border-outline-variant/10 focus:ring-1 focus:ring-primary/20 rounded-lg p-6 placeholder:text-slate-400/50 resize-none transition-all"
            />
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-on-surface-variant/60">{objetivo.length} / 250</span>
          </div>
        </div>
      </section>

      {/* Exercises Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">Ejercicios del Plan</h2>
          <span className="text-[10px] font-medium text-on-surface-variant/60">{ejercicios.length} EJERCICIO(S) AÑADIDO(S)</span>
        </div>

        {ejercicios.map((ej, index) => (
          <div key={ej.id} className="bg-white border border-outline-variant/20 rounded-xl overflow-hidden group transition-all hover:shadow-lg hover:border-primary/20">
            <div className="p-6">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                  <label className="block text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">Nombre del Ejercicio {index + 1}</label>
                  <input 
                    type="text" 
                    value={ej.nombre}
                    onChange={(e) => handleChange(ej.id, 'nombre', e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-0 border-b border-transparent focus:border-primary focus:ring-0 px-0 pb-1 transition-colors"
                    placeholder="Ej. Press de Banca con Barra"
                  />
                </div>
                <button 
                  onClick={() => handleRemoveExercise(ej.id)}
                  className="p-2 text-on-surface-variant/40 hover:text-error transition-colors rounded-lg hover:bg-error/5"
                  title="Eliminar ejercicio"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-surface-container-low/50 rounded-lg p-3 border border-outline-variant/10">
                  <label className="block text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-2">Series</label>
                  <input 
                    type="number" 
                    value={ej.series}
                    onChange={(e) => handleChange(ej.id, 'series', e.target.value)}
                    className="w-full bg-transparent border-0 text-xl font-black text-primary p-0 text-center focus:ring-0"
                  />
                </div>
                <div className="bg-surface-container-low/50 rounded-lg p-3 border border-outline-variant/10">
                  <label className="block text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-2">Repeticiones</label>
                  <input 
                    type="number" 
                    value={ej.repeticiones}
                    onChange={(e) => handleChange(ej.id, 'repeticiones', e.target.value)}
                    className="w-full bg-transparent border-0 text-xl font-black text-primary p-0 text-center focus:ring-0"
                  />
                </div>
                <div className="bg-surface-container-low/50 rounded-lg p-3 border border-outline-variant/10">
                  <label className="block text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-2">Descanso (s)</label>
                  <input 
                    type="number" 
                    value={ej.descanso}
                    onChange={(e) => handleChange(ej.id, 'descanso', e.target.value)}
                    className="w-full bg-transparent border-0 text-xl font-black text-primary p-0 text-center focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-2">Instrucciones específicas (Opcional)</label>
                <textarea 
                  value={ej.instrucciones || ""}
                  onChange={(e) => handleChange(ej.id, 'instrucciones', e.target.value)}
                  className="w-full bg-surface-container-low/30 border border-outline-variant/10 rounded-lg p-3 text-sm resize-none focus:ring-1 focus:ring-primary/10 transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="Ej: Controlar el descenso en 3 segundos..." 
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Exercise Button */}
        <button 
          onClick={handleAddExercise}
          className="w-full py-8 border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant/60 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group mt-4"
        >
          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
          <span className="text-xs font-bold uppercase tracking-[0.2em]">+ Añadir nuevo ejercicio</span>
        </button>
      </div>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 md:left-64 left-0 right-0 h-20 bg-white/95 backdrop-blur-xl flex items-center justify-between px-12 border-t border-outline-variant/10 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full border border-outline-variant/5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Guardado en Base de Datos</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
            Vista Previa
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest rounded transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Plantilla"}
          </button>
        </div>
      </footer>
    </div>
  );
}
