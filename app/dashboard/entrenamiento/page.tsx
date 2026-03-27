import { PlanEntrenamiento, Ejercicio } from "@/lib/models/domain/Entrenamiento";
import PlanListClient from "./PlanListClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  // Fetch directly on the server – uses service role key, bypasses RLS
  let planes: PlanEntrenamiento[] = [];
  try {
    planes = await PlanEntrenamiento.fetchAll();
  } catch (e) {
    console.error("Error loading plans:", e);
  }

  // Pre-fetch exercise counts on the server too
  const plansData = await Promise.all(
    planes.map(async (p) => {
      const ejercs = await p.getEjercicios();
      return {
        id: p.getId() as string,
        nombre: p.getNombre(),
        objetivo: p.getObjetivo(),
        activo: p.isActivo(),
        ejerciciosCount: ejercs.length,
        estimatedTimeMin: ejercs.length * 5,
      };
    })
  );

  return <PlanListClient initialPlans={plansData} />;
}
