"use client";

import { MembershipAlert } from "@/lib/mockData";

interface AlertTableRowProps {
  alert: MembershipAlert;
}

export default function AlertTableRow({ alert }: AlertTableRowProps) {
  // Extract initials
  const initials = alert.clientName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Determine styling based on days left
  const isUrgent = alert.daysLeft <= 1;

  return (
    <tr className="bg-white/40 backdrop-blur-sm rounded-lg overflow-hidden group hover:bg-white/60 transition-all">
      <td className="px-4 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-on-tertiary-fixed/10 flex items-center justify-center font-bold text-xs">
          {initials}
        </div>
        <span className="text-sm font-bold tracking-tight text-on-tertiary-fixed">
          {alert.clientName}
        </span>
      </td>
      <td className="px-4 py-5 text-sm font-medium text-on-tertiary-fixed">
        {alert.endDate}
      </td>
      <td className="px-4 py-5">
        <span
          className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${
            isUrgent
              ? "bg-error-container text-on-error-container"
              : "bg-on-tertiary-fixed/10 text-on-tertiary-fixed"
          }`}
        >
          {alert.daysLeft === 1 ? "1 Día" : `${alert.daysLeft} Días`}
        </span>
      </td>
      <td className="px-4 py-5 text-right">
        <button
          className="text-[10px] font-black uppercase tracking-widest bg-on-tertiary-fixed text-white px-6 py-2 rounded shadow-lg hover:opacity-90 transition-all active:scale-95"
          onClick={() => window.alert(`Recordatorio enviado a ${alert.clientName}`)}
        >
          Enviar Recordatorio Email
        </button>
      </td>
    </tr>
  );
}
