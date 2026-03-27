"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export interface SendReminderResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Sends a membership renewal reminder email to a client
 * This is a Server Action that should be called from Client Components
 * 
 * @param membershipId - The membership ID to send reminder for
 * @param clientEmail - Client's email address
 * @param clientName - Client's full name
 * @param daysLeft - Days remaining until membership expires
 * @param endDate - Formatted end date string
 */
export async function sendMembershipReminder(
  membershipId: string,
  clientEmail: string,
  clientName: string,
  daysLeft: number,
  endDate: string
): Promise<SendReminderResult> {
  try {
    // Validate required fields
    if (!clientEmail || !clientName || !membershipId) {
      return {
        success: false,
        message: "Campos requeridos inválidos",
        error: "Missing required fields",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return {
        success: false,
        message: "Email inválido",
        error: "Invalid email format",
      };
    }

    const db = getServerClient();

    // Create notification record in database for audit trail
    const { error: notifError } = await db.from("notificacion").insert({
      titulo: "Recordatorio de Vencimiento de Membresía",
      mensaje: `Tu membresía vence el ${endDate} (${daysLeft} días restantes).`,
      tipo: "ALERTA_VENCIMIENTO",
      leida: false,
      referencia_id: membershipId,
    });

    if (notifError) {
      console.error("Error creating notification record:", notifError);
      // Continue anyway - email is the priority
    }

    // Send email via Supabase Edge Function or external service
    // For now, we'll log the action and create a notification
    const emailPayload = {
      to: clientEmail,
      subject: `⏰ Recordatorio: Tu membresía vence en ${daysLeft} ${
        daysLeft === 1 ? "día" : "días"
      }`,
      clientName,
      endDate,
      daysLeft,
      membershipId,
    };

    // Call your email service (Edge Function, SendGrid, etc.)
    const emailResponse = await sendEmailViaService(emailPayload);

    if (!emailResponse.success) {
      throw new Error(emailResponse.error || "Email service error");
    }

    // Update last reminder sent timestamp on membership
    const { error: updateError } = await db
      .from("membresia")
      .update({
        ultima_notificacion_vencimiento: new Date().toISOString(),
      })
      .eq("id", membershipId);

    if (updateError) {
      console.warn("Warning updating reminder timestamp:", updateError);
      // Continue - this is not critical
    }

    // Revalidate dashboard to show updated state
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Recordatorio enviado a ${clientEmail}`,
    };
  } catch (error) {
    console.error("Error sending membership reminder:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      message: "Error al enviar el recordatorio",
      error: errorMessage,
    };
  }
}

/**
 * Sends email using your configured email service
 * Replace this with your actual email service (SendGrid, Resend, etc.)
 */
async function sendEmailViaService(payload: {
  to: string;
  subject: string;
  clientName: string;
  endDate: string;
  daysLeft: number;
  membershipId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Example using Resend (replace with your service)
    // Uncomment and configure if using Resend:
    
    /*
    import { Resend } from "resend";
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@gimnasiostats.com",
      to: payload.to,
      subject: payload.subject,
      html: generateReminderEmailHTML(payload),
    });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
    */

    // Alternative: Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "MEMBERSHIP_REMINDER",
          to: payload.to,
          subject: payload.subject,
          clientName: payload.clientName,
          endDate: payload.endDate,
          daysLeft: payload.daysLeft,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Edge Function error:", error);
      return { success: false, error: "Email service error" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error calling email service:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generates HTML template for membership reminder email
 */
function generateReminderEmailHTML(payload: {
  clientName: string;
  endDate: string;
  daysLeft: number;
  membershipId: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Recordatorio de Vencimiento</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${payload.clientName}</strong>,</p>
            
            <div class="alert">
              <strong>Tu membresía vence en ${payload.daysLeft} ${
    payload.daysLeft === 1 ? "día" : "días"
  }</strong>
              <br>
              <strong>Fecha de vencimiento:</strong> ${payload.endDate}
            </div>

            <p>Para no perder acceso a nuestras instalaciones, te recomendamos renovar tu membresía cuanto antes.</p>

            <p><strong>¿Qué necesitas hacer?</strong></p>
            <ul>
              <li>Accede a tu cuenta</li>
              <li>Ve a la sección de membresías</li>
              <li>Selecciona renovación o autoriza el pago automático</li>
            </ul>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/cliente/membresias" class="cta">
              Renovar Membresía
            </a>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Si tienes dudas, contáctanos a través de nuestra plataforma o llama a nuestro centro.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Gym Management System. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
