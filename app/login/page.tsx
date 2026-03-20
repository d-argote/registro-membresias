"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await AuthService.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Credenciales inválidas. Por favor intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-surface-tint/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            Kinetic Precision
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.3em]">
            Command Center Access
          </p>
        </header>

        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50">
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
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all placeholder:text-outline-variant"
                placeholder="nombre@empresa.com"
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
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="px-5 py-3 bg-error/10 border border-error/20 rounded-xl">
                <p className="text-[10px] font-bold text-error uppercase text-center leading-tight">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar al Sistema"}
            </button>
          </form>
        </div>

        <footer className="text-center">
          <p className="text-[9px] font-medium text-outline uppercase tracking-widest opacity-60">
            Powered by KineticOS v1.0.4
          </p>
        </footer>
      </div>
    </div>
  );
}
