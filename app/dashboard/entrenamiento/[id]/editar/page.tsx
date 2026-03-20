import { PlanEntrenamiento } from "@/lib/models/Entrenamiento";
import { notFound } from "next/navigation";
import TemplateEditor from "./TemplateEditor";

export default async function EditarPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const plan = await PlanEntrenamiento.fetchById(id);
  
  if (!plan) {
    return notFound();
  }

  const ejercicios = await plan.getEjercicios();

  // Convert to plain objects for the Client Component
  const planData = {
    id: plan.getId()!,
    nombre: plan.getNombre(),
    objetivo: plan.getObjetivo(),
    ejercicios: ejercicios.map(ej => ({
      id: ej.id as string,
      nombre: ej.getNombre(),
      series: ej.getSeries(),
      repeticiones: ej.getRepeticiones(),
      descanso: ej.getDescanso(),
      orden: ej.getOrden(),
      instrucciones: ej.getInstrucciones() || ""
    }))
  };

  return <TemplateEditor initialPlan={planData} />;
}
