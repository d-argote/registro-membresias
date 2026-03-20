import AlertTableRow from "./AlertTableRow";
import type { MembershipAlert } from "@/lib/mockData";

interface AlertSectionProps {
  alerts: MembershipAlert[];
}

export default function AlertSection({ alerts }: AlertSectionProps) {
  return (
    <section className="bg-tertiary-fixed p-8 rounded-xl shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-on-tertiary-fixed text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <h2 className="text-xl font-black tracking-tighter uppercase text-on-tertiary-fixed">
            Alerta: Membresías por Vencer (Próximos 3 días)
          </h2>
        </div>
        <span className="px-3 py-1 bg-on-tertiary-fixed text-tertiary-fixed text-[10px] font-black rounded-full tracking-widest uppercase">
          Urgente
        </span>
      </div>

      {alerts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-on-tertiary-fixed/60">
                <th className="px-4 pb-4">Cliente</th>
                <th className="px-4 pb-4">Fecha Fin</th>
                <th className="px-4 pb-4">Días Restantes</th>
                <th className="px-4 pb-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="space-y-4">
              {alerts.map((alert) => (
                <AlertTableRow key={alert.id} alert={alert} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-on-tertiary-fixed/40">
          <span className="material-symbols-outlined text-6xl mb-4">
            check_circle
          </span>
          <p className="text-sm font-bold tracking-widest uppercase italic">
            No hay membresías próximas a vencer
          </p>
        </div>
      )}
    </section>
  );
}
