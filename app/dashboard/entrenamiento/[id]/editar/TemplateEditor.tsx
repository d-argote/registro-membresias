"use client";

import { useState } from "react";
import { actualizarPlanAction } from "@/app/actions/entrenamientos";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EjercicioData = {
  id: string; // empty string for new exercises
  nombre: string;
  series: number | string;
  repeticiones: number | string;
  descanso: number | string;
  orden: number;
  instrucciones: string;
};

type InitialPlanData = {
  id: string;
  nombre: string;
  objetivo: string;
  ejercicios: EjercicioData[];
};

export default function TemplateEditor({ initialPlan }: { initialPlan: InitialPlanData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [nombre, setNombre] = useState(initialPlan.nombre);
  const [objetivo, setObjetivo] = useState(initialPlan.objetivo);
  const [ejercicios, setEjercicios] = useState<EjercicioData[]>(initialPlan.ejercicios);

  const handleAddExercise = () => {
    setEjercicios([
      ...ejercicios, 
      { id: "", nombre: "", series: 3, repeticiones: 10, descanso: 60, orden: ejercicios.length + 1, instrucciones: "" }
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setEjercicios(ejercicios.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newEjercicios = [...ejercicios];
    newEjercicios[index] = { ...newEjercicios[index], [field]: value };
    setEjercicios(newEjercicios);
  };

  const handleSave = async () => {
    if (!nombre) {
        setError("El nombre del plan es requerido.");
        return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    
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
        id: e.id && e.id !== "" ? e.id : undefined,
        nombre: e.nombre,
        series: Number(e.series),
        repeticiones: Number(e.repeticiones),
        descanso: Number(e.descanso),
        instrucciones: e.instrucciones,
        orden: idx + 1
      }))
    };

    const result = await actualizarPlanAction(initialPlan.id, dataToSend);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
      // Optionally redirect or show success toast
    } else {
      setError(result.error || "Ocurrió un error al actualizar el plan.");
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 relative pb-32">
      {error && <div className="bg-error-container text-error p-4 mb-8 rounded font-bold uppercase tracking-widest text-[10px]">{error}</div>}
      {success && <div className="bg-surface-tint text-white p-4 mb-8 rounded font-bold uppercase tracking-widest text-[10px]">¡Plan actualizado con éxito!</div>}
      
      {/* Header Section: 12-column grid applied */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
        <div className="md:col-start-3 md:col-end-11">
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-4">Definición del Plan</label>
          <input 
            type="text" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del Plan de Entrenamiento"
            className="w-full text-4xl font-black tracking-tighter bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary px-0 pb-4 placeholder:text-surface-dim transition-all"
          />
          <div className="mt-12 relative">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-4">Objetivo General del Plan</label>
            <textarea 
              rows={3} 
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Describe el enfoque principal de este entrenamiento..."
              className="w-full text-lg bg-surface-container-low/50 border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary p-6 placeholder:text-slate-400/50 resize-none"
            />
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-on-surface-variant">{objetivo.length} / 250</span>
          </div>
        </div>
      </div>

      {/* Main Section: Dynamic Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-start-3 md:col-end-11 space-y-8">
          
          {ejercicios.map((ej, index) => (
            <div key={index} className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-lg relative group transition-all hover:border-outline-variant/40">
              <button 
                onClick={() => handleRemoveExercise(index)}
                className="absolute top-6 right-6 text-error opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Eliminar
              </button>
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Nombre del Ejercicio {index + 1}</label>
                  <input 
                    type="text" 
                    value={ej.nombre}
                    onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary px-0 pb-2"
                    placeholder="Ej. Press de Banca"
                  />
                </div>
                <div className="flex flex-wrap gap-12">
                  <div className="w-24">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Series</label>
                    <input 
                      type="number" 
                      value={ej.series}
                      onChange={(e) => handleChange(index, 'series', e.target.value)}
                      className="w-full bg-surface-container-low border-0 text-center font-bold py-3 focus:ring-0"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Reps</label>
                    <input 
                      type="number" 
                      value={ej.repeticiones}
                      onChange={(e) => handleChange(index, 'repeticiones', e.target.value)}
                      className="w-full bg-surface-container-low border-0 text-center font-bold py-3 focus:ring-0"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Descanso (seg)</label>
                    <input 
                      type="number" 
                      value={ej.descanso}
                      onChange={(e) => handleChange(index, 'descanso', e.target.value)}
                      className="w-full bg-surface-container-low border-0 text-center font-bold py-3 focus:ring-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Instrucciones específicas (Opcional)</label>
                  <textarea 
                    value={ej.instrucciones}
                    onChange={(e) => handleChange(index, 'instrucciones', e.target.value)}
                    className="w-full bg-surface-container-low/30 border-0 p-4 text-sm resize-none focus:ring-1 focus:ring-primary/10" 
                    placeholder="Ej: Mantener ligera flexión en los codos..." 
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Exercise Button */}
          <button 
            onClick={handleAddExercise}
            className="w-full py-10 border-2 border-dashed border-outline-variant/20 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">+ Añadir nuevo ejercicio</span>
          </button>
        </div>
      </div>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 md:left-64 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl flex items-center justify-between px-12 border-t-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hidden sm:inline">Modo Edición - Actualizado</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push(`/dashboard/entrenamiento/${initialPlan.id}`)}
            className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            Vista Previa
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest rounded transition-all hover:bg-slate-800 active:scale-95 shadow-xl shadow-black/5 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Guardar Plantilla de Plan"}
          </button>
        </div>
      </footer>
    </div>
  );
}
