"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/auth.service";
import { NotificadorService, Notificacion } from "@/lib/services/notificador.service";
import { UsuarioSistema } from "@/lib/models/usuario_sistema.model";

export default function TopNavBar() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSistema | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchUserAndNotifs = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setUsuario(user);
          const notifs = await NotificadorService.obtenerMisNotificaciones(user.getId());
          setNotificaciones(notifs);
        }
      } catch (error) {
        console.error("Error fetching user/notifs:", error);
      }
    };

    fetchUserAndNotifs();
    
    // Polling opcional para notificaciones (cada 1 minuto)
    const interval = setInterval(fetchUserAndNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await NotificadorService.marcarComoLeida(id);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-20 z-40 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
      <div className="flex justify-between items-center px-12 h-full">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            className="bg-transparent border-none focus:ring-0 text-[10px] tracking-[0.15em] font-bold text-on-surface-variant w-64 placeholder:text-outline-variant outline-none"
            placeholder="BUSCAR CLIENTE..."
          />
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6 relative">
            {/* Notifications */}
            <div className="relative">
              <span 
                className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
              >
                notifications
              </span>
              {notificaciones.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-white dark:border-slate-950" />
              )}
              
              {showNotif && (
                <div className="absolute right-0 mt-4 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-[10px] font-bold tracking-widest text-on-surface mb-4 uppercase">Notificaciones</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <p className="text-[10px] text-outline text-center py-4">No hay notificaciones nuevas</p>
                    ) : (
                      notificaciones.map(n => (
                        <div key={n.id} className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 hover:bg-surface-container transition-colors group">
                          <div className="flex justify-between items-start gap-3">
                            <span className={`material-symbols-outlined text-lg mt-0.5 
                              ${n.tipo === 'ALERTA_VENCIMIENTO' ? 'text-error' : 'text-primary'}`}>
                              {n.tipo === 'ALERTA_VENCIMIENTO' ? 'warning' : 'info'}
                            </span>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-on-surface uppercase tracking-tight">{n.titulo}</p>
                              <p className="text-[9px] text-on-surface-variant leading-relaxed mt-1">{n.mensaje}</p>
                            </div>
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="text-outline hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">done</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings / Profile */}
            <div className="relative">
              <span 
                className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              >
                settings
              </span>
              
              {showProfile && (
                <div className="absolute right-0 mt-4 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 text-left text-[10px] font-bold text-error hover:bg-error/5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    CERRAR SESIÓN
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-8">
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest text-on-surface uppercase">
                {usuario?.getNombre() || "Admin User"}
              </p>
              <p className="text-[8px] font-medium text-outline uppercase tracking-tighter">
                {usuario?.getRol() === 1 ? "Administrador" : usuario?.getRol() === 3 ? "Entrenador" : "Acceso Sistema"}
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAY4JFPjp5gr-jB9cp0IQyDbgIG6hpB1Hf6O22ON0klIp2tv9OD0mIngYKPOaZvbeSjTmsAXLkBo6wLZSFCxCpWv3iS2sshPIKDbAgaNyg1PPLjWpkeniElOxgdH58GSREZV9wwADQEasHSDX8duOz6Q0StLYEtf79ZRm-OKeBuBdmIkWC18tGYroAxQV6MuVmf7aHpJXvIJOR8NBEp3UrtbGPYpvbWT3-vgqSbPGrYwVnL4-1m1aVObZgzMFEH34F8q94HkoJIHqe"
              data-alt="Admin profile avatar professional portrait"
              alt="Admin User"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

