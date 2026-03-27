"use server";

import { Membresia, TipoMembresia } from "@/lib/models/Membresia";
import { TransaccionPago } from "@/lib/models/TransaccionPago";
import { revalidatePath } from "next/cache";
import { validatePagoPayload, validateMembresiaIds } from "@/lib/validators/membresia.validator";
import { toUserMessage } from "@/lib/errors/AppError";

/**
 * Registers a membership payment for a client.
 * Creates or renews the membership, then records the transaction.
 *
 * @param data - Payment details including cliente_id, tipo, metodo, and monto
 */
export async function registrarPagoAction(data: {
  cliente_id: string;
  tipo_membresia_id: number;
  metodo_pago_id: number;
  monto: number;
}) {
  try {
    // Validate input before any DB work
    const errors = validatePagoPayload(data);
    if (errors.length > 0) {
      return { success: false, error: errors.join(" | ") };
    }

    let mem = await Membresia.fetchLatestActivaByCliente(data.cliente_id);

    if (!mem) {
      mem = new Membresia(null, data.cliente_id, data.tipo_membresia_id, new Date(), new Date());
    }

    await mem.activar();

    const resultId = mem.getId() as string;
    const tx = new TransaccionPago(null, resultId, data.monto, new Date(), 0, false, null, null, data.metodo_pago_id);
    await tx.registrar();

    const tipoLabel = data.tipo_membresia_id === 2 ? "Anual" : "Mensual";

    revalidatePath(`/dashboard/clientes/${data.cliente_id}`);
    return {
      success: true,
      reciboData: {
        transaccionId: tx.id as string,
        monto: data.monto,
        fechaPago: new Date().toISOString(),
        metodoPagoId: data.metodo_pago_id,
        tipoMembresia: tipoLabel,
        fechaInicio: mem.getFechaInicio().toISOString(),
        fechaFin: mem.getFechaFin().toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error("[registrarPagoAction] Error:", err);
    return { success: false, error: toUserMessage(err, "No se pudo registrar el pago. Intente de nuevo.") };
  }
}

/**
 * Freezes an active membership, preserving remaining days.
 *
 * @param membresia_id - UUID of the membership to freeze
 * @param cliente_id   - UUID of the owning client (used to revalidate page)
 */
export async function congelarAction(membresia_id: string, cliente_id: string) {
  try {
    const errors = validateMembresiaIds(membresia_id, cliente_id);
    if (errors.length > 0) {
      return { success: false, error: errors.join(" | ") };
    }

    const mem = new Membresia(membresia_id, cliente_id, TipoMembresia.MENSUAL, new Date(), new Date());
    await mem.load();
    await mem.congelar("Congelamiento solicitado por administrador");

    revalidatePath(`/dashboard/clientes/${cliente_id}`);
    return { success: true, result: mem.getId() };
  } catch (err: unknown) {
    console.error("[congelarAction] Error:", err);
    return { success: false, error: toUserMessage(err, "No se pudo congelar la membresía. Intente de nuevo.") };
  }
}

/**
 * Reactivates a frozen membership, adding preserved days from today.
 *
 * @param membresia_id - UUID of the membership to reactivate
 * @param cliente_id   - UUID of the owning client (used to revalidate page)
 */
export async function reactivarAction(membresia_id: string, cliente_id: string) {
  try {
    const errors = validateMembresiaIds(membresia_id, cliente_id);
    if (errors.length > 0) {
      return { success: false, error: errors.join(" | ") };
    }

    const mem = new Membresia(membresia_id, cliente_id, TipoMembresia.MENSUAL, new Date(), new Date());
    await mem.load();
    await mem.reactivar();

    revalidatePath(`/dashboard/clientes/${cliente_id}`);
    return { success: true, result: mem.getId() };
  } catch (err: unknown) {
    console.error("[reactivarAction] Error:", err);
    return { success: false, error: toUserMessage(err, "No se pudo reactivar la membresía. Intente de nuevo.") };
  }
}
