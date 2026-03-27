import { supabase } from "../supabase";
import { getDbClient } from "../models/db";
import { UsuarioSistema, RolUsuario } from "../models/usuario_sistema.model";

export class AuthService {
  private static async getSiteUrl(): Promise<string> {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  }
  /**
   * Conecta con Supabase Auth.
   */
  public static async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Cierra la sesión en Supabase y limpia cookies/estado.
   */
  public static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Crea un usuario en Auth y lo inserta en usuario_sistema con el rol asignado.
   * Utiliza el cliente administrativo para poder crear usuarios sin confirmación por correo si es necesario.
   */
  public static async crearUsuario(datos: { nombre: string; email: string; password?: string }, rolId: RolUsuario) {
    const db = getDbClient();
    
    // 1. Crear el usuario en Supabase Auth (admin)
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: datos.email,
      password: datos.password || "Temp123456!", // Contraseña temporal
      email_confirm: true,
      user_metadata: { nombre: datos.nombre, rol_id: rolId }
    });

    if (authError) throw authError;

    const authUserId = authData.user.id;

    // 2. Insertar en la tabla usuario_sistema
    const { data: userData, error: userError } = await db
      .from("usuario_sistema")
      .insert([
        {
          id: authUserId,
          nombre: datos.nombre,
          email: datos.email,
          rol_id: rolId,
          activo: true
        }
      ])
      .select()
      .single();

    if (userError) {
      // Intentar revertir la creación en auth si falla el insert
      await db.auth.admin.deleteUser(authUserId);
      throw userError;
    }

    return UsuarioSistema.fromJson(userData);
  }

  /**
   * Obtiene la sesión actual
   */
  public static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("usuario_sistema")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    return UsuarioSistema.fromJson(data);
  }

  /**
   * Invita a un cliente enviando un Magic Link o Reseteo de Password, 
   * creándolo silenciosamente en Auth.
   * La creación debe usar email_confirm: true para que el correo se envíe de inmediato.
   */
  public static async invitarCliente(email: string, nombre: string) {
    const db = getDbClient();
    
    const siteUrl = await this.getSiteUrl();
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      data: { nombre, is_cliente: true },
      redirectTo: `${siteUrl}/auth/callback?type=invite`
    });

    if (error) {
      console.error("[AuthService] Error invitando cliente:", error);
      throw error;
    }
    
    return data;
  }

  /**
   * Envía un enlace de recuperación de contraseña ("Olvidé mi contraseña").
   */
  public static async recuperarPassword(email: string) {
    const siteUrl = await this.getSiteUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`
    });
    if (error) throw error;
  }
}
