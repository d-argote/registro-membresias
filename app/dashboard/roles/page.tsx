"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AuthService } from "@/lib/services/auth.service";
import { RolUsuario } from "@/lib/models/usuario_sistema.model";

interface StaffMember {
  id: string;
  nombre: string;
  email: string;
  rol_id: number;
  activo: boolean;
  rol_nombre?: string;
}

export default function RolesPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rolId: RolUsuario.ENTRENADOR
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("usuario_sistema")
        .select(`
          id,
          nombre,
          email,
          rol_id,
          activo,
          rol_usuario (nombre)
        `)
        .order("nombre");

      if (error) {
        console.error("Supabase Error fetching staff:", error.message, error.details, error.hint);
        throw error;
      }
      
      const mappedStaff = data.map((item: any) => ({
        ...item,
        rol_nombre: item.rol_usuario?.nombre
      }));
      
      setStaff(mappedStaff);
    } catch (error: any) {
      console.error("Error fetching staff:", error);
      alert(`Error al cargar personal: ${error.message || "Verifique la consola"}`);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AuthService.crearUsuario(
        { nombre: formData.nombre, email: formData.email, password: formData.password },
        formData.rolId
      );
      
      alert("✅ Usuario creado exitosamente.");
      setShowModal(false);
      setFormData({ nombre: "", email: "", password: "", rolId: RolUsuario.ENTRENADOR });
      fetchStaff();
    } catch (error: any) {
      console.error("Error creating user:", error);
      alert(`❌ Error: ${error.message || "No se pudo crear el usuario"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-outline-variant/30 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-on-background uppercase">
            Gestión de Roles
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Administración de Personal & Permisos de Acceso
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-on-primary px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Crear Usuario
        </button>
      </header>

      {/* Staff Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                <th className="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-widest">Nombre</th>
                <th className="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-widest">Email</th>
                <th className="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-widest">Rol</th>
                <th className="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-widest">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-outline animate-pulse font-bold tracking-widest text-[10px]">Cargando personal...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-outline font-bold tracking-widest text-[10px]">No se encontró personal registrado</td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-on-background uppercase">{member.nombre}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-medium text-on-surface-variant lowercase tracking-tight">{member.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm
                        ${member.rol_id === 1 ? "bg-surface-tint text-white" : "bg-outline-variant/20 text-on-surface-variant"}`}>
                        {member.rol_nombre || "Sin Rol"}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${member.activo ? "bg-success" : "bg-error"}`} />
                        <span className="text-[10px] font-bold text-on-surface uppercase">{member.activo ? "Activo" : "Inactivo"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 space-y-8">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-on-background uppercase">Nuevo Usuario</h2>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-1">Credenciales de Acceso</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-outline hover:text-on-background transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Email Corporativo</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="juan.perez@gym.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Contraseña Temporal</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Asignar Rol</label>
                  <select
                    value={formData.rolId}
                    onChange={(e) => setFormData({ ...formData, rolId: parseInt(e.target.value) })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value={RolUsuario.ADMINISTRADOR}>Administrador</option>
                    <option value={RolUsuario.RECEPCIONISTA}>Recepcionista</option>
                    <option value={RolUsuario.ENTRENADOR}>Entrenador</option>
                    <option value={RolUsuario.SOPORTE_TECNICO}>Soporte Técnico</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-surface-tint text-white py-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-surface-tint/20 disabled:opacity-50"
                >
                  {saving ? "Procesando..." : "Crear Cuenta Personal"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
