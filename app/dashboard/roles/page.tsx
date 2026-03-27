"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RolUsuario } from "@/lib/models/domain/UsuarioSistema";
import { crearUsuarioAdmin, editarUsuario, cambiarRolUsuario, eliminarUsuarioPermanentemente } from "@/app/actions/roles";
import { useAlert } from "@/components/providers/AlertProvider";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<StaffMember | null>(null);
  const [userToDelete, setUserToDelete] = useState<StaffMember | null>(null);
  const { showAlert } = useAlert();

  const [createFormData, setCreateFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rolId: RolUsuario.ENTRENADOR
  });

  const [editFormData, setEditFormData] = useState({
    nombre: "",
    email: "",
    activo: true,
    rolId: RolUsuario.ENTRENADOR
  });

  const fetchStaffAndUser = async () => {
    setLoading(true);
    try {
      // Fetch current user session to determine role
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase.from("usuario_sistema").select("rol_id").eq("id", session.user.id).single();
        if (userData) {
          setCurrentUserRole(userData.rol_id);
        }
      }

      // Fetch staff
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
      showAlert("error", "Error al cargar personal", error.message || "Verifique la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndUser();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No hay una sesión activa. Por favor, vuelva a iniciar sesión.");
      }

      const res = await crearUsuarioAdmin(
        session.access_token,
        { nombre: createFormData.nombre, email: createFormData.email, password: createFormData.password },
        createFormData.rolId
      );
      
      if (!res.success) {
        showAlert("error", res.error.type === "VALIDATION" ? "Validación" : "Error", res.error.message);
        return;
      }

      showAlert("success", "Éxito", "Usuario creado correctamente en el sistema.");
      setShowCreateModal(false);
      setCreateFormData({ nombre: "", email: "", password: "", rolId: RolUsuario.ENTRENADOR });
      fetchStaffAndUser();
    } catch (error: any) {
      console.error("Error creating user:", error);
      showAlert("error", "Error Inesperado", error.message || "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (member: StaffMember) => {
    setEditingUser(member);
    setEditFormData({
      nombre: member.nombre,
      email: member.email,
      activo: member.activo,
      rolId: member.rol_id
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No hay una sesión activa. Por favor, vuelva a iniciar sesión.");
      }

      const res = await editarUsuario(
        session.access_token,
        editingUser.id,
        {
          nombre: editFormData.nombre,
          email: editFormData.email,
          activo: editFormData.activo
        }
      );
      
      if (!res.success) {
        showAlert("error", res.error.type === "VALIDATION" ? "Validación" : "Error", res.error.message);
        return;
      }

      showAlert("success", "Éxito", "Usuario actualizado correctamente.");
      setShowEditModal(false);
      setEditingUser(null);
      fetchStaffAndUser();
    } catch (error: any) {
      console.error("Error updating user:", error);
      showAlert("error", "Error Inesperado", error.message || "No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRol = async (newRol: RolUsuario) => {
    if (!editingUser) return;
    
    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No hay una sesión activa. Por favor, vuelva a iniciar sesión.");
      }

      const res = await cambiarRolUsuario(
        session.access_token,
        editingUser.id,
        newRol
      );
      
      if (!res.success) {
        showAlert("error", res.error.type === "VALIDATION" ? "Validación" : "Error", res.error.message);
        return;
      }

      showAlert("success", "Éxito", "Rol actualizado correctamente.");
      setEditFormData({ ...editFormData, rolId: newRol });
      fetchStaffAndUser();
    } catch (error: any) {
      console.error("Error changing role:", error);
      showAlert("error", "Error Inesperado", error.message || "No se pudo cambiar el rol");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (member: StaffMember) => {
    setUserToDelete(member);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No hay una sesión activa. Por favor, vuelva a iniciar sesión.");
      }

      const res = await eliminarUsuarioPermanentemente(
        session.access_token,
        userToDelete.id
      );
      
      if (!res.success) {
        showAlert("error", res.error.type === "VALIDATION" ? "Validación" : "Error", res.error.message);
        return;
      }

      showAlert("success", "Éxito", `Usuario ${userToDelete.nombre} eliminado correctamente.`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      setShowEditModal(false);
      setEditingUser(null);
      fetchStaffAndUser();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      showAlert("error", "Error Inesperado", error.message || "No se pudo eliminar el usuario");
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

        {currentUserRole === RolUsuario.ADMINISTRADOR && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Crear Usuario
          </button>
        )}
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
                      {currentUserRole === RolUsuario.ADMINISTRADOR && (
                        <button 
                          onClick={() => handleEditOpen(member)}
                          className="text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 space-y-8">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-on-background uppercase">Nuevo Usuario</h2>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-1">Credenciales de Acceso</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
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
                    value={createFormData.nombre}
                    onChange={(e) => setCreateFormData({ ...createFormData, nombre: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Email Corporativo</label>
                  <input
                    required
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="juan.perez@gym.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Contraseña Temporal</label>
                  <input
                    required
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Asignar Rol</label>
                  <select
                    value={createFormData.rolId}
                    onChange={(e) => setCreateFormData({ ...createFormData, rolId: parseInt(e.target.value) })}
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

      {/* Modal Editar Usuario */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 space-y-8">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-on-background uppercase">Editar Usuario</h2>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-1">Actualizar Información</p>
                </div>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="text-outline hover:text-on-background transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <form onSubmit={handleEditUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Email Corporativo</label>
                  <input
                    required
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all"
                    placeholder="juan.perez@gym.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-outline">Cambiar Rol</label>
                  <select
                    value={editFormData.rolId}
                    onChange={(e) => handleChangeRol(parseInt(e.target.value) as RolUsuario)}
                    disabled={saving}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-tint outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value={RolUsuario.ADMINISTRADOR}>Administrador</option>
                    <option value={RolUsuario.RECEPCIONISTA}>Recepcionista</option>
                    <option value={RolUsuario.ENTRENADOR}>Entrenador</option>
                    <option value={RolUsuario.SOPORTE_TECNICO}>Soporte Técnico</option>
                  </select>
                  <p className="text-[8px] text-outline-variant mt-1">⚠️ Solo administradores pueden cambiar roles</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={editFormData.activo}
                    onChange={(e) => setEditFormData({ ...editFormData, activo: e.target.checked })}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="activo" className="text-sm font-bold text-on-background cursor-pointer flex-1">
                    Usuario Activo
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 bg-surface-container text-on-background py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container/80 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(editingUser!)}
                    className="px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-error/20 text-error hover:bg-error/30 transition-all"
                  >
                    Eliminar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-surface-tint text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-surface-tint/20 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl border border-error/30 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 space-y-6">
              <header className="flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-error">warning</span>
                <div>
                  <h2 className="text-lg font-black tracking-tighter text-on-background uppercase">Eliminar Usuario</h2>
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-1">Esta acción es irreversible</p>
                </div>
              </header>

              <div className="bg-error/10 border border-error/30 rounded-xl p-4 space-y-3">
                <p className="text-[11px] font-black text-on-background uppercase tracking-tight">
                  ¿Eliminar permanentemente a <span className="text-error">{userToDelete.nombre}</span>?
                </p>
                <p className="text-[9px] text-on-surface-variant leading-relaxed">
                  Se eliminará completamente de:
                </p>
                <ul className="text-[9px] text-on-surface-variant space-y-1 ml-4">
                  <li>✓ Sistema de usuarios (usuario_sistema)</li>
                  <li>✓ Autenticación (auth.users)</li>
                  <li>✓ Todos los registros asociados</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={saving}
                  className="flex-1 bg-surface-container text-on-background py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container/80 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="flex-1 bg-error text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-error/90 transition-all active:scale-[0.98] shadow-lg shadow-error/20 disabled:opacity-50"
                >
                  {saving ? "Eliminando..." : "Eliminar Permanentemente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
