import { getDbClient } from "./db";
import { TransaccionPago } from "./TransaccionPago";

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
    this.fechaCongelamiento = data.fecha_congelamiento ? new Date(data.fecha_congelamiento) : null;
  }

  /**
   * Persiste la instancia actual o la actualiza en DB
   */
  public async save(): Promise<void> {
    const db = getDbClient();
    const payload = {
      cliente_id: this.clienteId,
      tipo_membresia_id: this.tipoMembresiaId,
      fecha_inicio: this.toISODate(this.fechaInicio),
      fecha_fin: this.toISODate(this.fechaFin),
      estado_id: this.estado,
      fecha_congelamiento: this.fechaCongelamiento ? this.toISODate(this.fechaCongelamiento) : null,
      dias_preservados: this.diasPreservados,
      creado_por: this.creadoPor
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
    today.setHours(0,0,0,0);

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
    today.setHours(0,0,0,0);
    
    let left = this.diffDays(today, this.fechaFin);
    if (left < 0) left = 0;

    this.diasPreservados = left;
    this.estado = EstadoMembresia.CONGELADA;
    this.fechaCongelamiento = today;
    this.motivoCongelamiento = motivo;
    await this.save();
  }

  public async reactivar(): Promise<void> {
    if (this.estado !== EstadoMembresia.CONGELADA) throw new Error("Membresia no esta congelada");
    
    const today = new Date();
    today.setHours(0,0,0,0);

    this.fechaReactivacion = today;
    this.fechaFin = this.addDays(today, this.diasPreservados);
    this.estado = EstadoMembresia.ACTIVA;
    this.diasPreservados = 0;
    this.fechaCongelamiento = null;
    this.motivoCongelamiento = null;
    
    await this.save();
  }

  public calcularDiasRestantes(): number {
    if (this.estado === EstadoMembresia.CONGELADA) return this.diasPreservados;
    if (this.estado !== EstadoMembresia.ACTIVA) return 0;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const left = this.diffDays(today, this.fechaFin);
    return left > 0 ? left : 0;
  }

  public estaVigente(): boolean {
    return this.estado === EstadoMembresia.ACTIVA && this.calcularDiasRestantes() > 0;
  }

  public async getTransacciones(): Promise<TransaccionPago[]> {
    if (!this.id) return [];
    return TransaccionPago.fetchByMembresia(this.id);
  }

  public getTipo(): TipoMembresia {
    return this.tipoMembresiaId;
  }

  public getFechaFin(): Date {
    return this.fechaFin;
  }

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
