"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ClientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-10px_30px_rgba(17,28,45,0.04)] rounded-t-3xl">
      <Link
        href="/cliente/dashboard"
        className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-200 ${
          pathname === "/cliente/dashboard"
            ? "bg-slate-900 dark:bg-slate-800 text-white rounded-2xl"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/cliente/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Inicio</span>
      </Link>
      
      <Link
        href="/cliente/rutina"
        className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-200 ${
          pathname === "/cliente/rutina"
            ? "bg-slate-900 dark:bg-slate-800 text-white rounded-2xl"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/cliente/rutina' ? "'FILL' 1" : "'FILL' 0" }}>fitness_center</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Mi Plan</span>
      </Link>
      
      {/* 
      // Link to Profile if implemented later
      <Link
        href="/cliente/perfil"
        className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-200 ${
          pathname === "/cliente/perfil"
            ? "bg-slate-900 dark:bg-slate-800 text-white rounded-2xl"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/cliente/perfil' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Perfil</span>
      </Link>
      */}
    </nav>
  );
}
