"use server";

import { Membresia, TipoMembresia } from "@/lib/models/Membresia";
import { TransaccionPago } from "@/lib/models/TransaccionPago";
import { revalidatePath } from "next/cache";

export async function registrarPagoAction(data: {
  cliente_id: string;
  tipo_membresia_id: number;
  metodo_pago_id: number;
  monto: number;
}) {
  try {
    let mem = await Membresia.fetchLatestActivaByCliente(data.cliente_id);

    if (!mem) {
      mem = new Membresia(null, data.cliente_id, data.tipo_membresia_id, new Date(), new Date());
    }

    await mem.activar();

    const resultId = mem.getId() as string;
    const tx = new TransaccionPago(null, resultId, data.monto, new Date(), 0, false, null, null, data.metodo_pago_id);
    await tx.registrar();

    revalidatePath(`/dashboard/clientes/${data.cliente_id}`);
    return { success: true, result: { membresia_id: resultId } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function congelarAction(membresia_id: string, cliente_id: string) {
  try {
    const mem = new Membresia(membresia_id, cliente_id, TipoMembresia.MENSUAL, new Date(), new Date());
    await mem.load();
    await mem.congelar("Congelamiento solicitado por administrador");

    revalidatePath(`/dashboard/clientes/${cliente_id}`);
    return { success: true, result: mem.getId() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivarAction(membresia_id: string, cliente_id: string) {
  try {
    const mem = new Membresia(membresia_id, cliente_id, TipoMembresia.MENSUAL, new Date(), new Date());
    await mem.load();
    await mem.reactivar();

    revalidatePath(`/dashboard/clientes/${cliente_id}`);
    return { success: true, result: mem.getId() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
