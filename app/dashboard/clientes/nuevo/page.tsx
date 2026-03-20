"use client";
import { useState } from "react";

export default function RegistroCliente() {
  const [step, setStep] = useState(1);
  const [hasDisability, setHasDisability] = useState(false);
  const [tipoIdentificacion, setTipoIdentificacion] = useState('CC');
  const [direccion, setDireccion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [consentimientoDatos, setConsentimientoDatos] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header de la vista */}
      <header className="flex justify-between items-end border-b border-outline-variant/30 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-on-background uppercase">
            Registro de Cliente
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Gestión de Usuarios & Captura Biométrica
          </p>
        </div>
        
        {/* Indicador de Pasos (Stepper) */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === 1 ? 'opacity-100' : 'opacity-40'}`}>
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-black">1</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-background">Datos Personales</span>
          </div>
          <span className="w-8 h-[2px] bg-outline-variant/50"></span>
          <div className={`flex items-center gap-2 ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'}`}>2</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-background">Biometría</span>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/20">
        
        {/* PASO 1: DATOS */}
        {step === 1 && (
          <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Nombre Completo *</label>
                <input type="text" className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant" placeholder="Ej. Alejandro Moreno" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Tipo de Identificación *</label>
                <select 
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all text-on-surface-variant cursor-pointer"
                  value={tipoIdentificacion}
                  onChange={(e) => setTipoIdentificacion(e.target.value)}
                  required
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PAS">Pasaporte</option>
                  <option value="TI">Tarjeta de Identidad</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Número de Identificación *</label>
                <input type="text" className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant" placeholder="Ej. 1000234567" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Fecha de Nacimiento *</label>
                <input 
                  type="date" 
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all text-on-surface-variant cursor-pointer" 
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Correo Electrónico *</label>
                <input type="email" className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant" placeholder="correo@ejemplo.com" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Teléfono *</label>
                <input type="tel" className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant" placeholder="+57 300 000 0000" required />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Dirección de Residencia *</label>
                <input 
                  type="text" 
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant" 
                  placeholder="Ej. Calle 123 # 45 - 67, Apartamento 801"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Condición de Discapacidad */}
            <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black tracking-tight uppercase text-on-background">Condición de Discapacidad</h4>
                  <p className="text-[10px] font-medium text-outline mt-1">Requerido para atención diferencial en recepción.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setHasDisability(!hasDisability)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${hasDisability ? 'bg-surface-tint' : 'bg-outline-variant'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${hasDisability ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {hasDisability && (
                <div className="flex flex-col gap-2 pt-4 animate-in fade-in duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Descripción (Máx. 500 caracteres)</label>
                  <textarea className="bg-white border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none resize-none h-24" placeholder="Describa la condición de discapacidad..." maxLength={500}></textarea>
                </div>
              )}
            </div>

            {/* Consentimiento de Datos */}
            <div className="flex items-start gap-4 p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
              <input 
                type="checkbox" 
                id="consentimiento"
                className="mt-1 w-4 h-4 text-surface-tint bg-white border-outline-variant rounded focus:ring-surface-tint focus:ring-2 cursor-pointer"
                checked={consentimientoDatos}
                onChange={(e) => setConsentimientoDatos(e.target.checked)}
                required
              />
              <div>
                <label htmlFor="consentimiento" className="text-sm font-black tracking-tight text-on-background cursor-pointer">
                  Consentimiento de Tratamiento de Datos Personales *
                </label>
                <p className="text-[10px] font-medium text-outline mt-1 leading-relaxed">
                  Autorizo el manejo de mis datos personales y biométricos de acuerdo con la ley de protección de datos vigentes para uso exclusivo en el control de acceso y gestión de membresías de Kinetic Precision.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="button" 
                onClick={() => setStep(2)}
                className="bg-primary text-on-primary px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
              >
                Siguiente Paso
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* PASO 2: BIOMETRÍA */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="bg-surface-container-high p-6 rounded-xl flex gap-4 items-start">
              <span className="material-symbols-outlined text-surface-tint text-3xl">fingerprint</span>
              <div>
                <h3 className="text-sm font-black tracking-tight uppercase text-on-background">Captura de Huellas Dactilares</h3>
                <p className="text-[10px] font-medium text-outline mt-1">El sistema requiere 4 huellas (2 por mano) con una calidad superior a 60/100 para generar la plantilla AES-256.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { id: 1, name: 'Índice Derecho', status: 'success', score: 85 },
                { id: 2, name: 'Medio Derecho', status: 'waiting', score: 0 },
                { id: 3, name: 'Índice Izquierdo', status: 'pending', score: 0 },
                { id: 4, name: 'Medio Izquierdo', status: 'pending', score: 0 },
              ].map((finger) => (
                <div key={finger.id} className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${finger.status === 'success' ? 'border-surface-tint bg-surface-container-high' : finger.status === 'waiting' ? 'border-outline border-dashed bg-surface-container-low animate-pulse' : 'border-outline-variant border-dashed bg-transparent opacity-50'}`}>
                  <span className={`material-symbols-outlined text-5xl mb-4 ${finger.status === 'success' ? 'text-surface-tint' : 'text-outline-variant'}`}>
                    {finger.status === 'success' ? 'fingerprint' : 'touch_app'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center text-on-background mb-2">{finger.name}</span>
                  {finger.status === 'success' && (
                    <span className="px-3 py-1 bg-white text-surface-tint text-[10px] font-black rounded-full uppercase shadow-sm">
                      Score: {finger.score}/100
                    </span>
                  )}
                  {finger.status === 'waiting' && (
                    <span className="text-[10px] font-bold text-outline animate-pulse uppercase">Esperando Lector...</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-8 border-t border-outline-variant/30">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-on-surface-variant px-6 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all active:scale-95"
              >
                Volver
              </button>
              <button 
                type="button" 
                className="bg-surface-tint text-white px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-surface-tint/90 transition-all active:scale-95 shadow-lg shadow-surface-tint/20 flex items-center gap-2"
              >
                Finalizar Registro
                <span className="material-symbols-outlined text-sm">check_circle</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
