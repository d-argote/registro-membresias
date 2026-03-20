import { supabase } from "../supabase";
import { getDbClient } from "../models/db";

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: 'ALERTA_VENCIMIENTO' | 'NUEVO_CLIENTE' | 'SISTEMA';
  leida: boolean;
  fecha_creacion: string;
}

export class NotificadorService {
  /**
   * Retorna la lista de alertas no leídas para un usuario.
   */
  public static async obtenerMisNotificaciones(usuarioId: string): Promise<Notificacion[]> {
    const { data, error } = await supabase
      .from("notificacion")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("leida", false)
      .order("fecha_creacion", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Cambia el estado a leida = true.
   */
  public static async marcarComoLeida(notificacionId: string): Promise<void> {
    const { error } = await supabase
      .from("notificacion")
      .update({ leida: true })
      .eq("id", notificacionId);

    if (error) throw error;
  }

  /**
   * Inserta un registro en notificacion para los administradores.
   */
  public static async generarAlertaVencimiento(
    clienteNombre: string,
    diasRestantes: number,
    adminIds: string[]
  ): Promise<void> {
    const db = getDbClient();
    
    const notificaciones = adminIds.map(adminId => ({
      usuario_id: adminId,
      titulo: "Alerta de Vencimiento",
      mensaje: `La membresía de ${clienteNombre} vence en ${diasRestantes} días.`,
      tipo: "ALERTA_VENCIMIENTO",
      leida: false
    }));

    const { error } = await db.from("notificacion").insert(notificaciones);
    if (error) throw error;
  }

  /**
   * Genera notificación de nuevo cliente (opcional, para completar el sistema)
   */
  public static async notificarNuevoCliente(clienteNombre: string, adminIds: string[]): Promise<void> {
    const db = getDbClient();
    
    const notificaciones = adminIds.map(adminId => ({
      usuario_id: adminId,
      titulo: "Nuevo Cliente Registrado",
      mensaje: `Se ha registrado un nuevo cliente: ${clienteNombre}.`,
      tipo: "NUEVO_CLIENTE",
      leida: false
    }));

    const { error } = await db.from("notificacion").insert(notificaciones);
    if (error) throw error;
  }
}
