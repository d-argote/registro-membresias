"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { validarCorreoCliente, iniciarSesionCliente } from "@/app/actions/auth-cliente";
import { AuthService } from "@/lib/services/auth.service";
import { useAlert } from "@/components/providers/AlertProvider";

export default function LoginClientePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validar que el cliente exista en la Base de Datos antes de intentar en Auth
      const existe = await validarCorreoCliente(email);
      if (!existe) {
        showAlert(
          "warning", 
          "Correo no registrado", 
          "Este correo no está registrado en nuestro sistema. Por favor, acércate a recepción."
        );
        return; // Detenemos el flujo
      }

      // 2. Intentar autenticar de Forma Segura vía Server Action (para establecer Cookies)
      const success = await iniciarSesionCliente(email, password);
      
      if (!success) {
        showAlert("error", "Error de Acceso", "El correo o contraseña no son correctos.");
        return;
      }

      // 3. Redirigir al dashboard del cliente
      router.push("/cliente/dashboard");
      
    } catch (err: unknown) {
      console.error("Error inesperado en login:", err);
      showAlert("error", "Error del servidor", "Ha ocurrido un problema intentando acceder.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarPassword = async () => {
    if (!email) {
      showAlert("warning", "Correo Requerido", "Ingresa tu correo en el campo superior para enviar el enlace de recuperación.");
      return;
    }
    setLoading(true);
    try {
      const existe = await validarCorreoCliente(email);
      if (!existe) {
        showAlert("warning", "Correo no registrado", "Este correo no está registrado.");
        return;
      }
      
      await AuthService.recuperarPassword(email);
      showAlert("success", "Enlace Enviado", "Revisa tu bandeja de entrada para restablecer tu contraseña.");
    } catch (err: unknown) {
      console.error("[Auth] Reset password error:", err);
      showAlert("error", "Error", "No se pudo enviar el enlace. Verifica que tu correo esté registrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Decorators Mobile-Friendly */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-surface-tint/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-surface-tint to-primary rounded-[2rem] shadow-xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-white text-3xl">fitness_center</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            GymAccess
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.3em]">
            PORTAL DEL CLIENTE
          </p>
        </header>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-slate-800/50">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">
                Correo Electrónico
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant shadow-inner"
                placeholder="tu@correo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">
                Contraseña
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-surface-tint text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-surface-tint/20 disabled:opacity-50"
              >
                {loading ? "Comprobando..." : "Ingresar"}
              </button>
              
              <button
                type="button"
                onClick={handleRecuperarPassword}
                disabled={loading}
                className="text-[10px] font-bold text-outline uppercase tracking-widest hover:text-surface-tint transition-colors bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
