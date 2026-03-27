import { getDbClient } from "../models/db";
import { AuthService } from "./auth.service";

export interface EmailQueueItem {
  id: string;
  email: string;
  nombre: string;
  tipo_email: string;
  intentos: number;
  max_intentos: number;
  estado: "pendiente" | "procesando" | "enviado" | "fallido";
  error_message?: string;
  created_at: string;
  procesado_at?: string;
}

export class EmailQueueService {
  /**
   * Encola un email de invitación a cliente
   */
  static async encolarInvitacion(email: string, nombre: string) {
    const db = getDbClient();

    const { data, error } = await db
      .from("email_queue")
      .insert([
        {
          email,
          nombre,
          tipo_email: "invitation",
          intentos: 0,
          max_intentos: 3,
          estado: "pendiente"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("[EmailQueueService] Error enqueueing email:", error);
      throw error;
    }

    console.log(`[EmailQueueService] Email enqueued for: ${email}`);
    return data;
  }

  /**
   * Procesa la cola de emails con delay entre cada uno
   * Respetar rate limit: máximo 1 email por segundo
   */
  static async procesarCola() {
    const db = getDbClient();

    console.log("[EmailQueueService] Iniciando procesamiento de cola...");

    // Obtener emails pendientes ordenados por antigüedad
    const { data: items, error: fetchError } = await db
      .from("email_queue")
      .select("*")
      .eq("estado", "pendiente")
      .lt("intentos", 3)
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError || !items) {
      console.error("[EmailQueueService] Error fetching queue:", fetchError);
      return { processed: 0, failed: 0, errors: [] };
    }

    if (items.length === 0) {
      console.log("[EmailQueueService] No hay emails pendientes");
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // Marcar como procesando
        await db
          .from("email_queue")
          .update({ estado: "procesando" })
          .eq("id", item.id);

        // Intentar enviar
        try {
          await AuthService.invitarCliente(item.email, item.nombre);

          // Éxito - marcar como enviado
          await db
            .from("email_queue")
            .update({
              estado: "enviado",
              procesado_at: new Date().toISOString()
            })
            .eq("id", item.id);

          processed++;
          console.log(
            `[EmailQueueService] Email enviado exitosamente: ${item.email}`
          );
        } catch (sendError: any) {
          const errorMsg = sendError instanceof Error ? sendError.message : String(sendError);
          const intentos = item.intentos + 1;

          // Determinar si es error permanente o temporal
          const isPermanent =
            errorMsg.includes("email invalid") ||
            errorMsg.includes("user_already_exists");

          const newStatus = isPermanent || intentos >= 3 ? "fallido" : "pendiente";

          // Actualizar con error
          await db
            .from("email_queue")
            .update({
              estado: newStatus,
              intentos: intentos,
              error_message: errorMsg
            })
            .eq("id", item.id);

          if (newStatus === "fallido") {
            failed++;
            errors.push(`${item.email}: ${errorMsg}`);
            console.error(
              `[EmailQueueService] Email fallido permanentemente: ${item.email} - ${errorMsg}`
            );
          } else {
            console.warn(
              `[EmailQueueService] Reintentará después: ${item.email} (intento ${intentos})`
            );
          }
        }

        // Delay de 2 segundos entre emails para respetar rate limit
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        console.error(`[EmailQueueService] Unexpected error processing ${item.email}:`, err);
        failed++;
      }
    }

    console.log(
      `[EmailQueueService] Procesamiento completado - Enviados: ${processed}, Fallidos: ${failed}`
    );

    return { processed, failed, errors };
  }

  /**
   * Obtiene el estado de la cola
   */
  static async obtenerEstadoCola() {
    const db = getDbClient();

    const { data, error } = await db
      .from("email_queue")
      .select("estado, COUNT(*) as cantidad", { count: "exact" })
      .group_by("estado");

    if (error) {
      console.error("[EmailQueueService] Error getting queue status:", error);
      return null;
    }

    return data;
  }
}
