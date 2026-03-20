"use server";

import { MembresiaService } from "@/lib/services/membresia.service";
import { revalidatePath } from "next/cache";

export async function registrarPagoAction(data: {
  cliente_id: string;
  tipo_membresia_id: number;
  metodo_pago_id: number;
  monto: number;
}) {
  try {
    const result = await MembresiaService.registrarPago(data);
    revalidatePath(`/dashboard/clientes/${data.cliente_id}`);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function congelarAction(membresia_id: string, cliente_id: string) {
  try {
    const result = await MembresiaService.congelarMembresia(membresia_id);
    revalidatePath(`/dashboard/clientes/${cliente_id}`);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivarAction(membresia_id: string, cliente_id: string) {
  try {
    const result = await MembresiaService.reactivarMembresia(membresia_id);
    revalidatePath(`/dashboard/clientes/${cliente_id}`);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
