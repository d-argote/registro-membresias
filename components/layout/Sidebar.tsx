import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-xl z-50">
      <div className="flex flex-col h-full p-6 space-y-8">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            Kinetic Precision
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant opacity-60">
            Performance Atelier
          </span>
        </div>
        <nav className="flex-1 space-y-2">
          {/* Dashboard Active */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-all duration-200 ease-in-out active:scale-95"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-sans antialiased tracking-tight text-sm font-medium">
              Dashboard
            </span>
          </Link>
          <Link
            href="/dashboard/clientes"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out active:scale-95"
          >
            <span className="material-symbols-outlined">group</span>
            <span className="font-sans antialiased tracking-tight text-sm font-medium">
              Clientes
            </span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out active:scale-95"
          >
            <span className="material-symbols-outlined">assessment</span>
            <span className="font-sans antialiased tracking-tight text-sm font-medium">
              Reports
            </span>
          </Link>
          <Link
            href="/dashboard/entrenamiento/nuevo"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out active:scale-95"
          >
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="font-sans antialiased tracking-tight text-sm font-medium">
              Planes de Entrenamiento
            </span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out active:scale-95"
          >
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span className="font-sans antialiased tracking-tight text-sm font-medium">
              Roles
            </span>
          </Link>
        </nav>
        <Link 
          href="/dashboard/clientes/nuevo"
          className="bg-primary text-on-primary py-3 px-4 rounded-lg font-bold text-sm tracking-tight flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Registrar Cliente
        </Link>
      </div>
    </aside>
  );
}
