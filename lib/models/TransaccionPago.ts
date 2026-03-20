import { getDbClient } from "./db";

export class TransaccionPago {
  public id: string | null;
  public membresiaId: string;
  private monto: number;
  private fechaPago: Date;
  private numeroRecibo: number;
  private anulada: boolean;
  private fechaAnulacion: Date | null;
  private motivoAnulacion: string | null;
  private metodoPagoId: number;

  constructor(
    id: string | null = null,
    membresiaId: string,
    monto: number,
    fechaPago: Date,
    numeroRecibo: number = 0,
    anulada: boolean = false,
    fechaAnulacion: Date | null = null,
    motivoAnulacion: string | null = null,
    metodoPagoId: number = 1
  ) {
    this.id = id;
    this.membresiaId = membresiaId;
    this.monto = monto;
    this.fechaPago = fechaPago;
    this.numeroRecibo = numeroRecibo;
    this.anulada = anulada;
    this.fechaAnulacion = fechaAnulacion;
    this.motivoAnulacion = motivoAnulacion;
    this.metodoPagoId = metodoPagoId; // added to satisfy "getMetodoPago" relation
  }

  /**
   * Registra el pago en la base de datos a través de Supabase
   */
  public async registrar(registradaPor?: string | null): Promise<void> {
    const db = getDbClient();
    const payload = {
      membresia_id: this.membresiaId,
      monto: this.monto,
      metodo_pago_id: this.metodoPagoId,
      estado: this.anulada ? 'Anulada' : 'Aprobada',
      usuario_ejecutor_id: registradaPor || null,
    };
    
    let res;
    if (this.id) {
       res = await db.from("transaccion_pago").update(payload).eq("id", this.id).select().single();
    } else {
       res = await db.from("transaccion_pago").insert(payload).select().single();
    }

    if (res.error) throw new Error("Error registrando pago: " + res.error.message);
    this.id = res.data.id;
    this.fechaPago = new Date(res.data.fecha_pago || res.data.created_at);
  }

  public async anular(motivo: string, anuladaPor?: string): Promise<void> {
    if (!this.id) throw new Error("No se puede anular una transacción no registrada");
    
    this.anulada = true;
    this.fechaAnulacion = new Date();
    this.motivoAnulacion = motivo;

    const db = getDbClient();
    const { error } = await db.from("transaccion_pago").update({
      estado_recibo: false,
      motivo_anulacion: motivo,
      fecha_anulacion: this.fechaAnulacion.toISOString(),
      anulada_por: anuladaPor || null
    }).eq("id", this.id);

    if (error) throw new Error("Error anulando pago: " + error.message);
  }

  public getMonto(): number {
    return this.monto;
  }

  public generarRecibo(): string {
    return `Recibo #${this.numeroRecibo || this.id} - Monto: ${this.monto} - Pagado el: ${this.fechaPago.toLocaleDateString()}`;
  }

  public isAnulada(): boolean {
    return this.anulada;
  }

  public getMetodoPago(): number {
    return this.metodoPagoId;
  }
  
  public static async fetchByMembresia(membresiaId: string): Promise<TransaccionPago[]> {
     const db = getDbClient();
     const { data, error } = await db.from("transaccion_pago").select("*").eq("membresia_id", membresiaId);
     if (error) throw new Error("Error fetching transactions: " + error.message);
     return data.map((d: any) => new TransaccionPago(
       d.id, d.membresia_id, d.monto, new Date(d.fecha_pago || d.created_at), d.numero_recibo, !d.estado_recibo, 
       d.fecha_anulacion ? new Date(d.fecha_anulacion) : null, d.motivo_anulacion, d.metodo_pago_id
     ));
  }
}
