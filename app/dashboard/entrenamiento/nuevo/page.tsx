import TemplateCreator from "./TemplateCreator";

export const metadata = {
  title: "Nuevo Plan | The Atelier",
};

export default function NuevoPlanPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="flex justify-between items-center h-16 border-b border-outline-variant/10 px-8">
        <h1 className="text-xl font-black tracking-tighter text-on-surface">Creador de Plantillas</h1>
      </div>
      <TemplateCreator />
    </div>
  );
}
