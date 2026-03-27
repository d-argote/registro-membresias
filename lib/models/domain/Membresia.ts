import { getDbClient } from "@/lib/database/db";

export enum EstadoMembresia {
  ACTIVA = 1,
  VENCIDA = 2,
  CONGELADA = 3
}

export enum TipoMembresia {
  MENSUAL = 1,
  ANUAL = 2
}

export class Membresia {
  public id: string | null;
  public clienteId: string;
  private tipoMembresiaId: TipoMembresia;
  private fechaInicio: Date;
  private fechaFin: Date;
  private estado: EstadoMembresia;
  private fechaCongelamiento: Date | null;
  private diasPreservados: number;
  private motivoCongelamiento: string | null;
  private fechaReactivacion: Date | null;
  private creadoPor: string | null;

  constructor(
    id: string | null = null,
    clienteId: string,
    tipoMembresiaId: TipoMembresia,
    fechaInicio: Date,
    fechaFin: Date,
    estado: EstadoMembresia = EstadoMembresia.ACTIVA,
    fechaCongelamiento: Date | null = null,
    diasPreservados: number = 0,
    motivoCongelamiento: string | null = null,
    fechaReactivacion: Date | null = null,
    creadoPor: string | null = null
  ) {
    this.id = id;
    this.clienteId = clienteId;
    this.tipoMembresiaId = tipoMembresiaId;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.estado = estado;
    this.fechaCongelamiento = fechaCongelamiento;
    this.diasPreservados = diasPreservados;
    this.motivoCongelamiento = motivoCongelamiento;
    this.fechaReactivacion = fechaReactivacion;
    this.creadoPor = creadoPor;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private diffDays(d1: Date, d2: Date): number {
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  private toISODate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Refresca el estado o carga de BD
   */
  public async load(): Promise<void> {
    if (!this.id) return;
    const db = getDbClient();
    const { data, error } = await db.from("membresia").select("*").eq("id", this.id).single();
    if (error) throw new Error(error.message);

    this.fechaInicio = new Date(data.fecha_inicio + "T00:00:00");
    this.fechaFin = new Date(data.fecha_fin + "T00:00:00");
    this.estado = data.estado_id;
    this.diasPreservados = data.dias_preservados || 0;
    this.tipoMembresiaId = data.tipo_membresia === 'Anual' ? TipoMembresia.ANUAL : TipoMembresia.MENSUAL;
  }

  /**
   * Persiste la instancia actual o la actualiza en DB
   */
  public async save(): Promise<void> {
    const db = getDbClient();
    const payload = {
      cliente_id: this.clienteId,
      tipo_membresia: this.tipoMembresiaId === TipoMembresia.MENSUAL ? 'Mensual' : 'Anual',
      fecha_inicio: this.toISODate(this.fechaInicio),
      fecha_fin: this.toISODate(this.fechaFin),
      estado_id: this.estado,
      dias_preservados: this.diasPreservados,
    };

    if (this.id) {
      const { error } = await db.from("membresia").update(payload).eq("id", this.id);
      if (error) throw new Error("Error actualizando membresia: " + error.message);
    } else {
      const { data, error } = await db.from("membresia").insert(payload).select().single();
      if (error) throw new Error("Error creando membresia: " + error.message);
      this.id = data.id;
    }
  }

  /**
   * Activa / registra o renueva membresia 
   */
  public async activar(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diasAAgregar = this.tipoMembresiaId === TipoMembresia.MENSUAL ? 30 : 360;

    if (this.estado === EstadoMembresia.ACTIVA && this.fechaFin >= today) {
      // Renovacion anticipada
      this.fechaFin = this.addDays(this.fechaFin, diasAAgregar);
    } else {
      // Nueva vigencia
      this.fechaInicio = this.addDays(today, 1);
      this.fechaFin = this.addDays(this.fechaInicio, diasAAgregar);
      this.estado = EstadoMembresia.ACTIVA;
    }
    await this.save();
  }

  /**
   * Congelar con motivo
   */
  public async congelar(motivo: string): Promise<void> {
    if (this.estado !== EstadoMembresia.ACTIVA) throw new Error("Solo las vigentes se pueden congelar");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let left = this.diffDays(today, this.fechaFin);
    if (left < 0) left = 0;

    this.diasPreservados = left;
    this.estado = EstadoMembresia.CONGELADA;
    this.fechaCongelamiento = today;
    this.motivoCongelamiento = motivo;
    await this.save();
  }

  /**
   * Reactiva membresia.
   */
  public async reactivar(): Promise<void> {
    if (this.estado !== EstadoMembresia.CONGELADA) throw new Error("Membresia no esta congelada");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.fechaReactivacion = today;
    this.fechaFin = this.addDays(today, this.diasPreservados);
    this.estado = EstadoMembresia.ACTIVA;
    this.diasPreservados = 0;
    this.fechaCongelamiento = null;
    this.motivoCongelamiento = null;

    await this.save();
  }

  /**
   * Calcula los dias restantes de la membresia.
   */
  public calcularDiasRestantes(): number {
    if (this.estado === EstadoMembresia.CONGELADA) return this.diasPreservados;
    if (this.estado !== EstadoMembresia.ACTIVA) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const left = this.diffDays(today, this.fechaFin);
    return left > 0 ? left : 0;
  }

  /**
   * Verifica si la membresia esta vigente.
   */
  public estaVigente(): boolean {
    return this.estado === EstadoMembresia.ACTIVA && this.calcularDiasRestantes() > 0;
  }

  /**
   * Obtiene las transacciones de la membresia.
   */
  public async getTransacciones(): Promise<TransaccionPago[]> {
    if (!this.id) return [];
    return TransaccionPago.fetchByMembresia(this.id);
  }

  /**
   * Obtiene el tipo de membresia.
   */
  public getTipo(): TipoMembresia {
    return this.tipoMembresiaId;
  }

  /**
   * Obtiene la fecha de fin de la membresia.
   */
  public getFechaFin(): Date {
    return this.fechaFin;
  }

  /**
   * Obtiene la fecha de inicio de la membresia.
   */
  public getFechaInicio(): Date {
    return this.fechaInicio;
  }

  public getId(): string | null {
    return this.id;
  }

  public getEstado(): EstadoMembresia {
    return this.estado;
  }

  // Metodo factory
  public static async fetchLatestActivaByCliente(clienteId: string): Promise<Membresia | null> {
    const db = getDbClient();
    const { data: m, error } = await db
      .from('membresia')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha_fin', { ascending: false })
      .limit(1)
      .single();

    if (error || !m) return null;

    return new Membresia(
      m.id, m.cliente_id, m.tipo_membresia_id,
      new Date(m.fecha_inicio + "T00:00:00"),
      new Date(m.fecha_fin + "T00:00:00"),
      m.estado_id,
      m.fecha_congelamiento ? new Date(m.fecha_congelamiento) : null,
      m.dias_preservados, null, null, m.creado_por
    );
  }
}

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
