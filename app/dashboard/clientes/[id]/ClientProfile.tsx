"use client";

import { useState } from "react";
import { registrarPagoAction, congelarAction, reactivarAction } from "@/app/actions/membresias";
import { actualizarCliente, eliminarCliente } from "@/app/actions/clientes";
import { ESTADO_MEMBRESIA, TIPO_MEMBRESIA } from "@/lib/services/membresia.service";
import { ReciboPago, type DatosRecibo } from "@/lib/models/domain/ReciboPago";
import { useRouter } from "next/navigation";
import { isValidEmail, isValidPhone, isValidNombre, isNonEmpty } from "@/lib/utils/validators/common.validator";
import { useAlert } from "@/components/providers/AlertProvider";

export default function ClientProfile({ cliente, membresia, transacciones }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pago");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states for Payment
  const [tipo, setTipo] = useState<number>(TIPO_MEMBRESIA.MENSUAL);
  const [metodo, setMetodo] = useState<number>(1);
  const [monto, setMonto] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [reciboActual, setReciboActual] = useState<ReciboPago | null>(null);

  // Form states for Edit
  const [editData, setEditData] = useState({
    nombre: cliente.nombre,
    email: cliente.email,
    telefono: cliente.telefono,
    numero_identificacion: cliente.numero_identificacion,
    tiene_discapacidad: cliente.tiene_discapacidad,
    descripcion_discapacidad: cliente.descripcion_discapacidad || "",
  });

  const diffDays = (date1: Date, date2: Date) => {
    return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const today = new Date();
  today.setHours(0,0,0,0);
  
  let remainingDays = 0;
  let progressPercentage = 0;

  if (membresia?.estado_id === ESTADO_MEMBRESIA.ACTIVA && membresia?.fecha_fin && membresia?.fecha_inicio) {
    const end = new Date(membresia.fecha_fin + "T00:00:00");
    const start = new Date(membresia.fecha_inicio + "T00:00:00");
    remainingDays = diffDays(today, end);
    if (remainingDays < 0) remainingDays = 0;

    const totalDays = diffDays(start, end);
    progressPercentage = Math.min(100, Math.max(0, 100 - (remainingDays / totalDays) * 100));
  }

  const getStatusBadge = (estado_id: number | undefined) => {
    switch (estado_id) {
      case ESTADO_MEMBRESIA.ACTIVA:
        return (
          <span className="px-6 py-2 rounded-full bg-green-100 text-green-700 text-xs font-black uppercase tracking-widest border border-green-200">
            Activa
          </span>
        );
      case ESTADO_MEMBRESIA.VENCIDA:
        return (
          <span className="px-6 py-2 rounded-full bg-error-container text-on-error-container text-xs font-black uppercase tracking-widest border border-error/20">
            Vencida
          </span>
        );
      case ESTADO_MEMBRESIA.CONGELADA:
        return (
          <span className="px-6 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest border border-blue-200">
            Congelada
          </span>
        );
      default:
        return (
          <span className="px-6 py-2 rounded-full bg-surface-container-highest text-on-surface-variant text-xs font-black uppercase tracking-widest">
            Sin Membresía
          </span>
        );
    }
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) {
      showAlert("error", "Validación", "El monto debe ser mayor a 0");
      return;
    }
    setLoading(true);
    const res = await registrarPagoAction({
      cliente_id: cliente.id,
      tipo_membresia_id: Number(tipo),
      metodo_pago_id: Number(metodo),
      monto: Number(monto)
    });
    if (!res.success) {
      const errObj = (res as any).error;
      const msg = typeof errObj === 'object' && errObj !== null && 'message' in errObj 
        ? errObj.message 
        : String(errObj);
      showAlert("error", "Error en Pago", msg);
    } else if (res.reciboData) {
      // Build ReciboPago from returned server data
      const datos: DatosRecibo = {
        transaccionId: res.reciboData.transaccionId,
        monto: res.reciboData.monto,
        fechaPago: new Date(res.reciboData.fechaPago),
        metodoPagoId: res.reciboData.metodoPagoId,
        clienteNombre: cliente.nombre,
        clienteId: cliente.id,
        clienteIdentificacion: cliente.numero_identificacion || "-",
        tipoMembresia: res.reciboData.tipoMembresia,
        fechaInicio: new Date(res.reciboData.fechaInicio),
        fechaFin: new Date(res.reciboData.fechaFin),
      };
      const recibo = new ReciboPago(datos);
      setReciboActual(recibo);
      setMonto(0);
      setPaymentSuccess(true);
      router.refresh();
    }
    setLoading(false);
  };

  const handleVolverAlPerfil = () => {
    setPaymentSuccess(false);
    setReciboActual(null);
    setActiveTab("historial");
  };

  const handleCongelar = async () => {
    if (!membresia) return;
    setLoading(true);
    const res = await congelarAction(membresia.id, cliente.id);
    if (!res.success) {
      const errObj = (res as any).error;
      const msg = typeof errObj === 'object' && errObj !== null && 'message' in errObj ? errObj.message : String(errObj);
      showAlert("error", "Error", msg);
    } else {
      showAlert("success", "Membresía Congelada", "La membresía ha sido congelada exitosamente.");
      router.refresh();
    }
    setLoading(false);
  };

  const handleReactivar = async () => {
    if (!membresia) return;
    setLoading(true);
    const res = await reactivarAction(membresia.id, cliente.id);
    if (!res.success) {
      const errObj = (res as any).error;
      const msg = typeof errObj === 'object' && errObj !== null && 'message' in errObj ? errObj.message : String(errObj);
      showAlert("error", "Error", msg);
    } else {
      showAlert("success", "Membresía Reactivada", "La membresía está activa nuevamente.");
      router.refresh();
    }
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    // Frontend validation before hitting the server
    const errs: Record<string, string> = {};

    if (!isNonEmpty(editData.nombre)) {
      errs.nombre = "El nombre es obligatorio.";
    } else if (!isValidNombre(editData.nombre.trim())) {
      errs.nombre = "Solo letras, espacios, guiones y puntos.";
    }

    if (!isNonEmpty(editData.email)) {
      errs.email = "El correo es obligatorio.";
    } else if (!isValidEmail(editData.email)) {
      errs.email = "Correo no válido (ej. nombre@dominio.com).";
    }

    if (!isNonEmpty(editData.telefono)) {
      errs.telefono = "El teléfono es obligatorio.";
    } else if (!isValidPhone(editData.telefono)) {
      errs.telefono = "Solo números (ej. 3001234567).";
    }

    if (!isNonEmpty(editData.numero_identificacion)) {
      errs.numero_identificacion = "La identificación es obligatoria.";
    }

    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await actualizarCliente(cliente.id, editData);
    if (!res.success) {
      const errObj = (res as any).error;
      const msg = typeof errObj === 'object' && errObj !== null && 'message' in errObj ? errObj.message : String(errObj);
      showAlert("error", typeof errObj === 'object' && errObj.type === "VALIDATION" ? "Validación" : "Error de Actualización", msg);
    } else {
      showAlert("success", "Perfil Actualizado", "Los datos del cliente se han guardado correctamente.");
      setIsEditing(false);
      setEditErrors({});
      router.refresh();
    }
    setLoading(false);
  };

  const handleEliminar = async () => {
    setLoading(true);
    const res = await eliminarCliente(cliente.id);
    if (!res.success) {
      const errObj = (res as any).error;
      const msg = typeof errObj === 'object' && errObj !== null && 'message' in errObj ? errObj.message : String(errObj);
      showAlert("error", "Error al Eliminar", msg);
      setLoading(false);
    } else {
      showAlert("success", "Cliente Eliminado", "El cliente ha sido eliminado permanentemente del sistema.");
      setLoading(false);
      router.push("/dashboard/clientes");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString('es-CO');
  };

  return (
    <div className="grid grid-cols-12 gap-10">
      {/* Left Column: Profile */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
        <div className="bg-surface-container-lowest p-10 rounded-xl flex flex-col items-center text-center shadow-sm relative border border-outline-variant/10">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-2"
              >
                edit
              </button>
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-surface-container bg-surface-container flex items-center justify-center text-4xl font-black text-on-surface-variant/40">
                  {cliente.nombre.slice(0, 1)}
                </div>
                <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-surface-container-lowest rounded-full ${membresia?.estado_id === ESTADO_MEMBRESIA.ACTIVA ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-on-surface mb-1">{cliente.nombre}</h3>
              <p className="text-on-surface-variant font-mono text-sm tracking-tighter mb-1">{cliente.numero_identificacion}</p>
              <p className="text-on-surface-variant text-[10px] font-medium uppercase tracking-widest mb-6">ID: {cliente.id.split('-')[0]}</p>
              <div className="mb-4">
                {getStatusBadge(membresia?.estado_id)}
              </div>
              <div className="w-full text-left mt-4 pt-4 border-t border-outline-variant/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant uppercase font-bold tracking-widest">Email</span>
                  <span className="text-on-surface font-medium truncate ml-2">{cliente.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant uppercase font-bold tracking-widest">Teléfono</span>
                  <span className="text-on-surface font-medium">{cliente.telefono}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full space-y-4">
              <h4 className="text-lg font-bold mb-4">Editar Datos</h4>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Nombre</label>
                <input
                  type="text"
                  value={editData.nombre}
                  onChange={(e) => { setEditData({...editData, nombre: e.target.value}); setEditErrors((p)=>({...p, nombre: ""})); }}
                  className={`bg-surface-container-low border-0 border-b focus:ring-0 py-2 text-sm font-medium ${
                    editErrors.nombre ? "border-red-400" : "border-outline-variant/40 focus:border-primary"
                  }`}
                />
                {editErrors.nombre && <p className="text-[10px] text-red-500 font-semibold">{editErrors.nombre}</p>}
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => { setEditData({...editData, email: e.target.value}); setEditErrors((p)=>({...p, email: ""})); }}
                  className={`bg-surface-container-low border-0 border-b focus:ring-0 py-2 text-sm font-medium ${
                    editErrors.email ? "border-red-400" : "border-outline-variant/40 focus:border-primary"
                  }`}
                />
                {editErrors.email && <p className="text-[10px] text-red-500 font-semibold">{editErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Teléfono</label>
                <input
                  type="tel"
                  value={editData.telefono}
                  inputMode="tel"
                  onChange={(e) => { setEditData({...editData, telefono: e.target.value}); setEditErrors((p)=>({...p, telefono: ""})); }}
                  className={`bg-surface-container-low border-0 border-b focus:ring-0 py-2 text-sm font-medium ${
                    editErrors.telefono ? "border-red-400" : "border-outline-variant/40 focus:border-primary"
                  }`}
                />
                {editErrors.telefono && <p className="text-[10px] text-red-500 font-semibold">{editErrors.telefono}</p>}
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Identificación</label>
                <input
                  type="text"
                  value={editData.numero_identificacion}
                  onChange={(e) => { setEditData({...editData, numero_identificacion: e.target.value}); setEditErrors((p)=>({...p, numero_identificacion: ""})); }}
                  className={`bg-surface-container-low border-0 border-b focus:ring-0 py-2 text-sm font-medium ${
                    editErrors.numero_identificacion ? "border-red-400" : "border-outline-variant/40 focus:border-primary"
                  }`}
                />
                {editErrors.numero_identificacion && <p className="text-[10px] text-red-500 font-semibold">{editErrors.numero_identificacion}</p>}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-outline-variant text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-surface-container-low"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black/90"
                >
                  {loading ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-error text-on-error text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110"
                  title="Eliminar cliente permanentemente"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col gap-6 shadow-sm">
          <h4 className="label-md uppercase tracking-widest text-[11px] font-black text-on-surface-variant">Membership Timeline</h4>
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Inicio</p>
                <p className="font-bold text-on-surface">{formatDate(membresia?.fecha_inicio)}</p>
              </div>
              <span className="material-symbols-outlined text-outline-variant">calendar_today</span>
            </div>
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Fin</p>
                <p className="font-bold text-on-surface">{formatDate(membresia?.fecha_fin)}</p>
              </div>
              <span className="material-symbols-outlined text-outline-variant">event_busy</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Días Restantes</p>
                <p className={`text-5xl font-black tracking-tighter ${remainingDays < 5 ? 'text-error' : 'text-surface-tint'}`}>{remainingDays}</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-surface-container-highest flex items-center justify-center relative">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-surface-container-highest"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (175.9 * progressPercentage) / 100}
                    className="text-surface-tint"
                  />
                </svg>
                <span className="text-[10px] font-black">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Action Tabs */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        {/* Tab Headers */}
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-lg w-max shadow-sm">
          <button 
            onClick={() => setActiveTab("pago")}
            className={`px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${activeTab === "pago" ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Registrar Pago
          </button>
          <button 
            onClick={() => setActiveTab("membresia")}
            className={`px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${activeTab === "membresia" ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Membresía
          </button>
          <button 
            onClick={() => setActiveTab("historial")}
            className={`px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${activeTab === "historial" ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Historial
          </button>
        </div>

        

        {/* Tab 1: Registrar Pago */}
        {activeTab === "pago" && (
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10">
            {paymentSuccess && reciboActual ? (
              /* ── SUCCESS STATE ── */
              <div className="flex flex-col items-center text-center gap-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-5xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black tracking-tight text-on-background">¡Pago Registrado Exitosamente!</h4>
                  <p className="text-sm text-on-surface-variant">El recibo está listo. Puedes descargarlo o imprimirlo ahora.</p>
                  <p className="text-[10px] font-mono text-outline uppercase tracking-widest mt-1">Recibo N.° {reciboActual.numeroRecibo}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
                  <button
                    onClick={async () => {
                      const { ReciboGenerador } = await import("@/lib/services/recibo.generator");
                      await ReciboGenerador.descargar(reciboActual);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Descargar PDF
                  </button>
                  <button
                    onClick={async () => {
                      const { ReciboGenerador } = await import("@/lib/services/recibo.generator");
                      await ReciboGenerador.imprimir(reciboActual);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-surface-tint text-on-primary py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-surface-tint/20"
                  >
                    <span className="material-symbols-outlined text-lg">print</span>
                    Imprimir
                  </button>
                </div>
                <button
                  onClick={handleVolverAlPerfil}
                  className="text-xs font-bold text-on-surface-variant hover:text-primary underline underline-offset-4 transition-colors"
                >
                  Volver al Perfil del Cliente →
                </button>
              </div>
            ) : (
              /* ── PAYMENT FORM ── */
              <>
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>payments</span>
                  <h4 className="text-xl font-bold tracking-tight">Nuevo Registro de Pago</h4>
                </div>
                <form onSubmit={handlePago} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="label-md uppercase tracking-widest text-[10px] font-bold text-on-surface-variant">Tipo de Plan</label>
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(Number(e.target.value))}
                        className="bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-primary py-2 font-medium text-sm"
                      >
                        <option value={TIPO_MEMBRESIA.MENSUAL}>Mensual</option>
                        <option value={TIPO_MEMBRESIA.ANUAL}>Anual</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="label-md uppercase tracking-widest text-[10px] font-bold text-on-surface-variant">Método de Pago</label>
                      <select
                        value={metodo}
                        onChange={(e) => setMetodo(Number(e.target.value))}
                        className="bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-primary py-2 font-medium text-sm"
                      >
                        <option value={1}>Efectivo</option>
                        <option value={2}>Tarjeta</option>
                        <option value={3}>Transferencia</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="label-md uppercase tracking-widest text-[10px] font-bold text-on-surface-variant">Monto (COP)</label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                      <input
                        type="number"
                        value={monto || ""}
                        onChange={(e) => setMonto(Number(e.target.value))}
                        min={1}
                        max={10000000}
                        step={1}
                        className="w-full bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-primary py-2 pl-6 font-bold text-2xl tracking-tighter"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant/70 italic mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      La nueva vigencia se sumará al final de la actual
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full bg-primary text-on-primary py-5 rounded-lg font-black uppercase tracking-widest text-sm hover:bg-black/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'Registrar Pago y Generar Recibo'}
                    <span className="material-symbols-outlined">receipt_long</span>
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Membresía Control */}
        {activeTab === "membresia" && (
          <div className="bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/10">
            <h4 className="label-md uppercase tracking-widest text-[11px] font-black text-on-surface-variant mb-6">Control Administrativo</h4>
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={handleCongelar}
                disabled={loading || membresia?.estado_id !== ESTADO_MEMBRESIA.ACTIVA}
                className="flex-1 border-2 border-on-tertiary-container/20 text-on-tertiary-container py-4 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-tertiary-fixed transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">ac_unit</span>
                Congelar Membresía
              </button>
              <button 
                onClick={handleReactivar}
                disabled={loading || membresia?.estado_id !== ESTADO_MEMBRESIA.CONGELADA}
                className="flex-1 border-2 border-surface-tint/20 text-surface-tint py-4 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Reactivar Membresía
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Historial Financiero */}
        {activeTab === "historial" && (
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-bold tracking-tight">Historial Financiero</h4>
              <button className="text-[10px] font-black uppercase tracking-widest text-surface-tint border-b-2 border-surface-tint">Ver Todo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="pb-4 label-md uppercase tracking-widest text-[9px] font-black text-on-surface-variant text-center">Fecha</th>
                    <th className="pb-4 label-md uppercase tracking-widest text-[9px] font-black text-on-surface-variant text-right">Monto</th>
                    <th className="pb-4 label-md uppercase tracking-widest text-[9px] font-black text-on-surface-variant text-center">Método</th>
                    <th className="pb-4 label-md uppercase tracking-widest text-[9px] font-black text-on-surface-variant text-center">Estado</th>
                    <th className="pb-4 label-md uppercase tracking-widest text-[9px] font-black text-on-surface-variant text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {transacciones && transacciones.length > 0 ? transacciones.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-4 text-xs font-semibold text-center">{formatDate(tx.fecha_pago || tx.created_at)}</td>
                      <td className="py-4 text-right font-black text-sm">{formatCurrency(tx.monto)}</td>
                      <td className="py-4 text-center">
                        <span className="px-2 py-1 bg-surface-container text-on-secondary-container text-[9px] font-bold rounded uppercase tracking-tighter">
                          {tx.metodo_pago_id === 1 ? 'Efectivo' : tx.metodo_pago_id === 2 ? 'Tarjeta' : 'Transferencia'}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase tracking-tighter">
                          Pagado
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2 text-center items-center h-full">
                          <button
                            title="Descargar Recibo"
                            onClick={async () => {
                              const recibo = new ReciboPago({
                                transaccionId: tx.id,
                                monto: tx.monto,
                                fechaPago: new Date(tx.fecha_pago || tx.created_at),
                                metodoPagoId: tx.metodo_pago_id,
                                clienteNombre: cliente.nombre,
                                clienteId: cliente.id,
                                clienteIdentificacion: cliente.numero_identificacion || "-",
                                tipoMembresia: "Membresía",
                                fechaInicio: membresia?.fecha_inicio ? new Date(membresia.fecha_inicio + "T00:00:00") : new Date(),
                                fechaFin: membresia?.fecha_fin ? new Date(membresia.fecha_fin + "T00:00:00") : new Date(),
                              });
                              const { ReciboGenerador } = await import("@/lib/services/recibo.generator");
                              await ReciboGenerador.descargar(recibo);
                            }}
                            className="material-symbols-outlined text-[18px] text-surface-tint hover:scale-110 transition-transform"
                          >download</button>
                          <button className="material-symbols-outlined text-[18px] text-error hover:scale-110 transition-transform">cancel</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-on-surface-variant/50 italic">No hay registros</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl p-8 max-w-sm shadow-xl border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
              <h3 className="text-lg font-black text-on-surface">Eliminar Cliente</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              ¿Estás seguro de que deseas eliminar permanentemente a <strong>{cliente.nombre}</strong>? Esta acción no se puede deshacer. Se eliminarán:
            </p>
            <ul className="text-xs text-on-surface-variant mb-6 space-y-1 list-disc list-inside">
              <li>El perfil del cliente</li>
              <li>Plantillas biométricas</li>
              <li>Cuenta de acceso (Auth)</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-outline-variant text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-surface-container-low disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-error text-on-error text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
