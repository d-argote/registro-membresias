"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";

export default function CrearPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showAlert("error", "Error", "Las contraseñas no coinciden.");
      return;
    }
    
    if (password.length < 6) {
      showAlert("warning", "Contraseña débil", "Debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Primero intenta usar los metadatos
      let isCliente = data?.user?.user_metadata?.is_cliente === true;

      // Si no está en metadatos, verifica si existe en la tabla cliente
      if (!isCliente && data?.user?.email) {
        const { data: clienteData, error: clienteError } = await supabase
          .from("cliente")
          .select("id")
          .eq("email", data.user.email)
          .single();

        if (clienteData && !clienteError) {
          isCliente = true;
        }
      }

      showAlert("success", "Éxito", "Tu contraseña ha sido establecida correctamente. Por favor, inicia sesión.");

      // Cerrar la sesión para forzar que pasen por la pantalla de login manualmente (según requerimiento)
      await supabase.auth.signOut();

      if (isCliente) {
        router.push("/login-cliente");
      } else {
        router.push("/login");
      }

    } catch (err: any) {
      console.error("[CrearPassword] Error:", err);
      showAlert("error", "Error del sistema", "No se pudo actualizar la contraseña. El enlace puede haber expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-surface-tint/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            Bienvenido
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Por favor, crea una contraseña para activar tu cuenta y acceder al portal.
          </p>
        </header>

        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">
                Nueva Contraseña
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">
                Confirmar Contraseña
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
            >
              {loading ? "Actualizando..." : "Guardar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
