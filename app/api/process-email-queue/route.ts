import { NextResponse } from "next/server";
import { EmailQueueService } from "@/lib/services/email-queue.service";

/**
 * API route para procesar la cola de emails
 * Se ejecuta cada minuto vía cron job o manualmente
 */
export async function GET(request: Request) {
  try {
    // Verificación simple de seguridad (usa una header o token si quieres más seguridad)
    const secret = request.headers.get("x-queue-secret");
    if (secret !== process.env.QUEUE_SECRET && process.env.QUEUE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] Iniciando procesamiento de cola de emails...");

    const result = await EmailQueueService.procesarCola();

    return NextResponse.json({
      success: true,
      message: "Cola procesada",
      ...result
    });
  } catch (error: any) {
    console.error("[API] Error procesando cola:", error);
    return NextResponse.json(
      { error: error.message || "Error procesando cola" },
      { status: 500 }
    );
  }
}
