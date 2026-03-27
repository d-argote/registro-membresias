"use client";

import { useState } from "react";
import type { MembershipAlert } from "@/lib/mockData";
import { sendMembershipReminder } from "@/app/actions/send-membership-reminder";

interface AlertTableRowProps {
  alert: MembershipAlert;
}

export default function AlertTableRow({ alert }: AlertTableRowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );

  // Extract initials
  const initials = alert.clientName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Determine styling based on days left
  const isUrgent = alert.daysLeft <= 1;

  const handleSendReminder = async () => {
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await sendMembershipReminder(
        alert.id,
        alert.clientEmail,
        alert.clientName,
        alert.daysLeft,
        alert.endDate
      );

      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        // Clear message after 4 seconds
        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 4000);
      } else {
        setMessage(result.message || "Error al enviar recordatorio");
        setMessageType("error");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
            onClick={handleSendReminder}
            disabled={isLoading}
            className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded shadow-lg transition-all active:scale-95 ${
              isLoading
                ? "bg-on-tertiary-fixed/50 text-white cursor-not-allowed"
                : "bg-on-tertiary-fixed text-white hover:opacity-90"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <span className="inline-block animate-spin">⟳</span>
                Enviando...
              </span>
            ) : (
              "Enviar Recordatorio Email"
            )}
          </button>
        </td>
      </tr>

      {/* Status Message Row */}
      {message && (
        <tr>
          <td colSpan={4} className="px-4 py-3">
            <div
              className={`text-sm font-medium px-4 py-2 rounded-lg ${
                messageType === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
