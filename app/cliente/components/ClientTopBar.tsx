"use client";

import { AuthService } from "@/lib/services/auth.service";
import { useRouter } from "next/navigation";

export default function ClientTopBar({ userName = "User" }: { userName?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push("/login-cliente");
    } catch (err) {
      console.error(err);
    }
  };

  const initials = userName.substring(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex justify-between items-center px-6 h-16 border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-tint text-white flex items-center justify-center font-bold text-xs">
          {initials}
        </div>
        <span className="font-['Inter'] font-black tracking-[-0.02em] text-lg text-slate-900 dark:text-white uppercase">
          GymAccess
        </span>
      </div>
      <div className="flex items-center gap-4">
        {/* Notificaciones Placeholder */}
        <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-opacity active:scale-95 duration-200">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        {/* Logout (Temporal placed here to allow exit) */}
        <button 
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-500 dark:text-slate-400 transition-opacity active:scale-95 duration-200"
          title="Cerrar Sesión"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}
