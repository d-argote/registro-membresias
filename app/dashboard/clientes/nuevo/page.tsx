"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type FingerStatus = "pending" | "waiting" | "capturing" | "success";

interface Finger {
  id: number;
  name: string;
  status: FingerStatus;
  score: number;
}

interface FormData {
  nombre: string;
  tipoIdentificacion: string;
  identificacion: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  tieneDiscapacidad: boolean;
  descripcionDiscapacidad: string;
  consentimientoDatos: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegistroCliente() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Paso 1: Datos personales
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    tipoIdentificacion: "CC",
    identificacion: "",
    email: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "",
    tieneDiscapacidad: false,
    descripcionDiscapacidad: "",
    consentimientoDatos: false,
  });

  // Paso 2: Estado dinámico de huellas
  const [fingers, setFingers] = useState<Finger[]>([
    { id: 1, name: "Índice Derecho",   status: "waiting", score: 0 },
    { id: 2, name: "Medio Derecho",    status: "pending", score: 0 },
    { id: 3, name: "Índice Izquierdo", status: "pending", score: 0 },
    { id: 4, name: "Medio Izquierdo",  status: "pending", score: 0 },
  ]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  /** Simula la captura biométrica al hacer clic en una tarjeta activa */
  const simulateCapture = (fingerId: number) => {
    const finger = fingers.find((f) => f.id === fingerId);
    if (!finger || finger.status === "success" || finger.status === "capturing") return;

    // Poner en modo captura
    setFingers((prev) =>
      prev.map((f) => (f.id === fingerId ? { ...f, status: "capturing" } : f))
    );

    // Simular retardo de hardware (800 ms) y asignar score aleatorio 65–100
    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * (100 - 65 + 1)) + 65;

      setFingers((prev) => {
        const updated = prev.map((f) =>
          f.id === fingerId ? { ...f, status: "success" as FingerStatus, score: randomScore } : f
        );
        // Activar automáticamente la siguiente huella en espera
        const nextIdx = updated.findIndex((f) => f.status === "pending");
        if (nextIdx !== -1) {
          updated[nextIdx] = { ...updated[nextIdx], status: "waiting" };
        }
        return updated;
      });
    }, 800);
  };

  /** Guarda cliente + plantillas biométricas en Supabase */
  const handleFinalSubmit = async () => {
    if (!fingers.every((f) => f.status === "success")) {
      alert("Debe capturar las 4 huellas para continuar.");
      return;
    }

    setLoading(true);
    try {
      // 1. Insertar cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("cliente")
        .insert([
          {
            numero_identificacion: formData.identificacion,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            direccion: formData.direccion || null,
            fecha_nacimiento: formData.fechaNacimiento || null,
            tiene_discapacidad: formData.tieneDiscapacidad,
            descripcion_discapacidad: formData.tieneDiscapacidad
              ? formData.descripcionDiscapacidad
              : null,
          },
        ])
        .select()
        .single();

      if (clienteError) throw clienteError;

      const clienteId = clienteData.id as string;

      // PostgREST (Supabase REST API) expects BYTEA columns as base64-encoded strings.
      // In production this would be the AES-256 encrypted fingerprint buffer.
      const mockBase64 = () =>
        btoa(`aes256_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`);

      const plantillas = fingers.map((f) => ({
        cliente_id: clienteId,
        dedo: f.name,
        huella_cifrada: mockBase64(),
        score_calidad: f.score,
      }));

      const { error: bioError } = await supabase
        .from("plantilla_biometrica")
        .insert(plantillas);

      if (bioError) throw bioError;

      // 3. Éxito — redirigir
      alert(`✅ Cliente registrado exitosamente.\nUUID: ${clienteId}`);
      router.push("/dashboard/clientes");
    } catch (error: unknown) {
      console.error("Error al registrar:", error);
      // Supabase errors are plain objects with a .message property, not Error instances
      const msg =
        error instanceof Error
          ? error.message
          : (error as { message?: string })?.message
          ?? JSON.stringify(error);
      alert(`❌ Hubo un error al registrar:\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-outline-variant/30 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-on-background uppercase">
            Registro de Cliente
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Gestión de Usuarios &amp; Captura Biométrica
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === 1 ? "opacity-100" : "opacity-40"}`}>
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-background">
              Datos Personales
            </span>
          </div>
          <span className="w-8 h-[2px] bg-outline-variant/50" />
          <div className={`flex items-center gap-2 ${step === 2 ? "opacity-100" : "opacity-40"}`}>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 2 ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"
              }`}
            >
              2
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-background">
              Biometría
            </span>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/20">

        {/* ── PASO 1: DATOS PERSONALES ── */}
        {step === 1 && (
          <form
            onSubmit={handleNextStep}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Nombre */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Nombre Completo *
                </label>
                <input
                  required
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                  placeholder="Ej. Alejandro Moreno"
                />
              </div>

              {/* Tipo Identificación */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Tipo de Identificación *
                </label>
                <select
                  required
                  name="tipoIdentificacion"
                  value={formData.tipoIdentificacion}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all cursor-pointer"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PAS">Pasaporte</option>
                  <option value="TI">Tarjeta de Identidad</option>
                </select>
              </div>

              {/* Número Identificación */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Número de Identificación *
                </label>
                <input
                  required
                  type="text"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                  placeholder="Ej. 1000234567"
                />
              </div>

              {/* Fecha Nacimiento */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all cursor-pointer"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Correo Electrónico *
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Teléfono *
                </label>
                <input
                  required
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                  placeholder="+57 300 000 0000"
                />
              </div>

              {/* Dirección */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                  Dirección de Residencia
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="bg-surface-container-low border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                  placeholder="Ej. Calle 123 # 45-67, Apto 801"
                />
              </div>
            </div>

            {/* Discapacidad Toggle */}
            <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black tracking-tight uppercase text-on-background">
                    Condición de Discapacidad
                  </h4>
                  <p className="text-[10px] font-medium text-outline mt-1">
                    Requerido para atención diferencial en recepción.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      tieneDiscapacidad: !prev.tieneDiscapacidad,
                    }))
                  }
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    formData.tieneDiscapacidad ? "bg-surface-tint" : "bg-outline-variant"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      formData.tieneDiscapacidad ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {formData.tieneDiscapacidad && (
                <div className="flex flex-col gap-2 pt-4 animate-in fade-in duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">
                    Descripción (Máx. 500 caracteres)
                  </label>
                  <textarea
                    name="descripcionDiscapacidad"
                    value={formData.descripcionDiscapacidad}
                    onChange={handleChange}
                    maxLength={500}
                    className="bg-white border-none rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none resize-none h-24"
                    placeholder="Describa la condición de discapacidad..."
                  />
                </div>
              )}
            </div>

            {/* Consentimiento */}
            <div className="flex items-start gap-4 p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
              <input
                required
                type="checkbox"
                id="consentimientoDatos"
                name="consentimientoDatos"
                checked={formData.consentimientoDatos}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, consentimientoDatos: e.target.checked }))
                }
                className="mt-1 w-4 h-4 text-surface-tint bg-white border-outline-variant rounded focus:ring-surface-tint focus:ring-2 cursor-pointer"
              />
              <div>
                <label
                  htmlFor="consentimientoDatos"
                  className="text-sm font-black tracking-tight text-on-background cursor-pointer"
                >
                  Consentimiento de Tratamiento de Datos Personales *
                </label>
                <p className="text-[10px] font-medium text-outline mt-1 leading-relaxed">
                  Autorizo el manejo de mis datos personales y biométricos de acuerdo con la ley de
                  protección de datos vigente, para uso exclusivo en el control de acceso y gestión
                  de membresías de Kinetic Precision.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-primary text-on-primary px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
              >
                Siguiente Paso
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 2: BIOMETRÍA SIMULADA ── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="bg-surface-container-high p-6 rounded-xl flex gap-4 items-start">
              <span className="material-symbols-outlined text-surface-tint text-3xl">
                fingerprint
              </span>
              <div>
                <h3 className="text-sm font-black tracking-tight uppercase text-on-background">
                  Captura de Huellas Dactilares
                </h3>
                <p className="text-[10px] font-medium text-outline mt-1">
                  Haz clic en la tarjeta parpadeante para simular la captura por hardware. Se
                  requieren 4 huellas con calidad superior a 60/100 para generar la plantilla
                  AES-256.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {fingers.map((finger) => (
                <div
                  key={finger.id}
                  onClick={() => simulateCapture(finger.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all select-none
                    ${finger.status === "success"
                      ? "border-surface-tint bg-surface-container-high cursor-default"
                      : finger.status === "capturing"
                        ? "border-surface-tint border-solid bg-surface-container-low scale-95 cursor-wait"
                        : finger.status === "waiting"
                          ? "border-outline border-dashed bg-surface-container-low animate-pulse hover:border-surface-tint/50 cursor-pointer"
                          : "border-outline-variant border-dashed bg-transparent opacity-40 cursor-not-allowed"
                    }`}
                >
                  <span
                    className={`material-symbols-outlined text-5xl mb-4
                      ${finger.status === "success"
                        ? "text-surface-tint"
                        : finger.status === "capturing"
                          ? "text-surface-tint animate-bounce"
                          : "text-outline-variant"
                      }`}
                  >
                    {finger.status === "success" ? "fingerprint" : "touch_app"}
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-widest text-center text-on-background mb-2">
                    {finger.name}
                  </span>

                  {finger.status === "success" && (
                    <span className="px-3 py-1 bg-white text-surface-tint text-[10px] font-black rounded-full uppercase shadow-sm">
                      Score: {finger.score}/100
                    </span>
                  )}
                  {finger.status === "capturing" && (
                    <span className="text-[10px] font-bold text-surface-tint uppercase">
                      Escaneando...
                    </span>
                  )}
                  {finger.status === "waiting" && (
                    <span className="text-[10px] font-bold text-outline uppercase">
                      Clic para capturar
                    </span>
                  )}
                  {finger.status === "pending" && (
                    <span className="text-[10px] font-bold text-outline-variant uppercase">
                      En espera
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-surface-tint rounded-full transition-all duration-500"
                  style={{
                    width: `${(fingers.filter((f) => f.status === "success").length / fingers.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-black text-outline uppercase tracking-widest whitespace-nowrap">
                {fingers.filter((f) => f.status === "success").length}/{fingers.length} capturadas
              </span>
            </div>

            <div className="flex justify-between pt-8 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="text-on-surface-variant px-6 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all active:scale-95 disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading || !fingers.every((f) => f.status === "success")}
                className="bg-surface-tint text-white px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-surface-tint/90 transition-all active:scale-95 shadow-lg shadow-surface-tint/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {loading ? "Guardando en BD..." : "Finalizar Registro"}
                <span className="material-symbols-outlined text-sm">
                  {loading ? "hourglass_empty" : "check_circle"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
