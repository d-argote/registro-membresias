import { createClient } from "@supabase/supabase-js";

// Utilidad para bypasear RLS en el servidor
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { ...(process.env.SUPABASE_SERVICE_ROLE_KEY ? {} : { "x-client-info": "server-action" }) } }
  });
}

export const ESTADO_MEMBRESIA = {
  ACTIVA: 1,
  VENCIDA: 2,
  CONGELADA: 3,
};

export const TIPO_MEMBRESIA = {
  MENSUAL: 1,
  ANUAL: 2,
};

export class MembresiaService {
  // Helper functions for date math
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private static diffDays(date1: Date, date2: Date): number {
    return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static toISODate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * RN-01, RN-02, RN-03
   * Registra un pago y actualiza o crea la membresía correspondiente.
   */
  static async registrarPago({
    cliente_id,
    tipo_membresia_id,
    metodo_pago_id,
    monto,
    usuario_id = null,
  }: {
    cliente_id: string;
    tipo_membresia_id: number;
    metodo_pago_id: number;
    monto: number;
    usuario_id?: string | null;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diasAAgregar = tipo_membresia_id === TIPO_MEMBRESIA.MENSUAL ? 30 : 360;

    // Fetch existing active or latest membership for this client
    const { data: membresiaExistente } = await getServerClient()
      .from("membresia")
      .select("*")
      .eq("cliente_id", cliente_id)
      .order("fecha_fin", { ascending: false })
      .limit(1)
      .single();

    let newFechaInicioStr: string;
    let newFechaFinStr: string;
    let membresiaIdStr: string;

    if (
      membresiaExistente &&
      membresiaExistente.estado_id === ESTADO_MEMBRESIA.ACTIVA &&
      new Date(membresiaExistente.fecha_fin) >= today
    ) {
      // RN-03: Renovación anticipada (is active and not expired)
      const currentEnd = new Date(membresiaExistente.fecha_fin + "T00:00:00");
      newFechaInicioStr = membresiaExistente.fecha_inicio; // Keep original start
      const newEnd = this.addDays(currentEnd, diasAAgregar);
      newFechaFinStr = this.toISODate(newEnd);
      membresiaIdStr = membresiaExistente.id;

      // Update existing
      const { error: updateError } = await getServerClient()
        .from("membresia")
        .update({
          fecha_fin: newFechaFinStr,
          tipo_membresia_id, // Update type if they change plan
        })
        .eq("id", membresiaIdStr);

      if (updateError) throw new Error("Error updating membership: " + updateError.message);
    } else {
      // RN-01: Expires or new. Start next day.
      const nextDay = this.addDays(today, 1);
      newFechaInicioStr = this.toISODate(nextDay);
      const newEnd = this.addDays(nextDay, diasAAgregar);
      newFechaFinStr = this.toISODate(newEnd);

      // Create new membership if not exists or if it was expired.
      // E.g., if there's an expired one, we usually create a new row or update the existing one.
      // Based on structure: Let's create a new one to keep history, or update if user prefers.
      // Usually, a new membership record makes sense or update if it's considered 1 row per client.
      // I'll create a new record if they don't have an active one.
      const { data: newMembresia, error: createError } = await getServerClient()
        .from("membresia")
        .insert({
          cliente_id,
          tipo_membresia_id,
          fecha_inicio: newFechaInicioStr,
          fecha_fin: newFechaFinStr,
          estado_id: ESTADO_MEMBRESIA.ACTIVA,
          creado_por: usuario_id,
        })
        .select()
        .single();

      if (createError) throw new Error("Error creating membership: " + createError.message);
      membresiaIdStr = newMembresia.id;
      
      // If there was an existing expired one, we might want to ensure its state is VENCIDA.
      // (This is standard cleanup, no harm in doing it).
      if (membresiaExistente && membresiaExistente.id !== membresiaIdStr) {
         await getServerClient().from("membresia").update({estado_id: ESTADO_MEMBRESIA.VENCIDA}).eq("id", membresiaExistente.id);
      }
    }

    // Insert transaction
    const { error: txError } = await getServerClient().from("transaccion_pago").insert({
      membresia_id: membresiaIdStr,
      metodo_pago_id,
      monto,
      estado_recibo: true,
      registrada_por: usuario_id,
    });

    if (txError) {
      // Rollback membership could be done here, but usually Supabase RPC handles atomic tx.
      throw new Error("Error inserting transaction: " + txError.message);
    }

    return { success: true, membresia_id: membresiaIdStr };
  }

  /**
   * RN-05: Congelar
   * Calcula los días desde la fecha_solicitud hasta la fecha_fin original.
   * Guarda en dias_preservados y pasa a 'Congelada'.
   */
  static async congelarMembresia(membresia_id: string) {
    const todayStr = this.toISODate(new Date());

    const { data: mem, error: fetchErr } = await getServerClient()
      .from("membresia")
      .select("*")
      .eq("id", membresia_id)
      .single();

    if (fetchErr || !mem) throw new Error("Membership not found");
    if (mem.estado_id !== ESTADO_MEMBRESIA.ACTIVA) throw new Error("Can only freeze ACTIVE memberships");

    const todayDate = new Date(todayStr + "T00:00:00");
    const endDate = new Date(mem.fecha_fin + "T00:00:00");
    
    // Remaining days from today to end
    let dias_preservados = this.diffDays(todayDate, endDate);
    if (dias_preservados < 0) dias_preservados = 0;

    const { error: updateErr } = await getServerClient()
      .from("membresia")
      .update({
        estado_id: ESTADO_MEMBRESIA.CONGELADA,
        dias_preservados,
        fecha_congelamiento: todayStr,
      })
      .eq("id", membresia_id);

    if (updateErr) throw new Error("Error freezing membership: " + updateErr.message);

    return { success: true, dias_preservados };
  }

  /**
   * RN-05: Reactivar
   * Suma los dias_preservados a la fecha actual para calcular nueva fecha_fin.
   * Cambia estado a 'Activa' y restablece dias_preservados a 0.
   */
  static async reactivarMembresia(membresia_id: string) {
    const todayStr = this.toISODate(new Date());

    const { data: mem, error: fetchErr } = await getServerClient()
      .from("membresia")
      .select("*")
      .eq("id", membresia_id)
      .single();

    if (fetchErr || !mem) throw new Error("Membership not found");
    if (mem.estado_id !== ESTADO_MEMBRESIA.CONGELADA) throw new Error("Membership is not frozen");

    const todayDate = new Date(todayStr + "T00:00:00");
    const preservedDays = mem.dias_preservados || 0;
    const newEndDate = this.addDays(todayDate, preservedDays);
    const newFechaFinStr = this.toISODate(newEndDate);

    const { error: updateErr } = await getServerClient()
      .from("membresia")
      .update({
        estado_id: ESTADO_MEMBRESIA.ACTIVA,
        fecha_fin: newFechaFinStr,
        dias_preservados: 0,
        fecha_congelamiento: null,
      })
      .eq("id", membresia_id);

    if (updateErr) throw new Error("Error reactivating membership: " + updateErr.message);

    return { success: true, newFechaFinStr };
  }
}
