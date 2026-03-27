"use client";

import Link from "next/link";
import { useState } from "react";
import { reenviarInvitacionCliente } from "@/app/actions/clientes";
import { useAlert } from "@/components/providers/AlertProvider";

interface ClientRowProps {
  id: string;
  nombre: string;
  numero_identificacion: string;
  email: string;
}

export default function ClientRow({ id, nombre, numero_identificacion, email }: ClientRowProps) {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleReenviarInvitacion = async () => {
    setLoading(true);
    try {
      const res = await reenviarInvitacionCliente(id);
      if (res.success) {
        showAlert("success", "Correo Reenviado", "La invitación fue reenviada a " + email);
      } else {
        const errorMsg = (res as any).error?.message || "Error desconocido";
        showAlert("error", "Error al Reenviar", errorMsg);
      }
    } catch (err: any) {
      showAlert("error", "Error", err.message || "Error al reenviar invitación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
      <td className="py-4 px-6 font-semibold text-neutral-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500 uppercase">
          {nombre.slice(0, 2)}
        </div>
        {nombre}
      </td>
      <td className="py-4 px-6 text-sm text-neutral-500">{numero_identificacion}</td>
      <td className="py-4 px-6 text-sm text-neutral-500">{email}</td>
      <td className="py-4 px-6 text-right">
        <div className="flex gap-2 justify-end items-center">
          <button
            onClick={handleReenviarInvitacion}
            disabled={loading}
            title="Reenviar correo de invitación"
            className="bg-surface-tint/10 text-surface-tint hover:bg-surface-tint/20 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xs">mail</span>
            {loading ? "..." : "Reenviar"}
          </button>
          <Link
            href={`/dashboard/clientes/${id}`}
            className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 transition-all active:scale-95"
          >
            Ver Perfil
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      </td>
    </tr>
  );
}
