"use client";

import { useState } from "react";
import { solicitarRutinaAction } from "@/app/actions/solicitar-rutina";
import { useAlert } from "@/components/providers/AlertProvider";

export default function SolicitarRutinaButton() {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleSolicitar = async () => {
    setLoading(true);
    try {
      const resp = await solicitarRutinaAction();
      if (resp.success) {
        showAlert("success", "Solicitud Enviada", "Los entrenadores han sido notificados. Tu plan estará listo pronto.");
      } else {
        showAlert("error", "Aviso", resp.error.message || "Algo salió mal.");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", "Error procesando tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSolicitar}
      disabled={loading}
      className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
    >
      {loading ? "Enviando..." : "Solicitar Rutina"}
    </button>
  );
}
