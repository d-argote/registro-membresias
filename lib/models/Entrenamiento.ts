import { getDbClient } from "./db";
import { Cliente } from "./Entrenador"; // Interface exportada de Entrenador.ts

export class Ejercicio {
  public id: string | null;
  public planId: string;
  private nombre: string;
  private series: number;
  private repeticiones: number;
  private descansoSegundos: number;
  private orden: number;

  constructor(
    id: string | null = null,
    planId: string,
    nombre: string,
    series: number,
    repeticiones: number,
    descansoSegundos: number,
    orden: number
  ) {
    this.id = id;
    this.planId = planId;
    this.nombre = nombre;
    this.series = series;
    this.repeticiones = repeticiones;
    this.descansoSegundos = descansoSegundos;
    this.orden = orden;
  }

  public getNombre(): string { return this.nombre; }
  public getSeries(): number { return this.series; }
  public getRepeticiones(): number { return this.repeticiones; }
  public getDescanso(): number { return this.descansoSegundos; }
  public getOrden(): number { return this.orden; }

  public async actualizar(
    nombre?: string, 
    series?: number, 
    repeticiones?: number, 
    descanso?: number, 
    orden?: number
  ): Promise<void> {
    if (nombre !== undefined) this.nombre = nombre;
    if (series !== undefined) this.series = series;
    if (repeticiones !== undefined) this.repeticiones = repeticiones;
    if (descanso !== undefined) this.descansoSegundos = descanso;
    if (orden !== undefined) this.orden = orden;

    if (!this.id) {
       // Create
       const db = getDbClient();
       const { data, error } = await db.from("ejercicio").insert({
         plan_id: this.planId,
         nombre: this.nombre,
         series: this.series,
         repeticiones: this.repeticiones,
         descanso_segundos: this.descansoSegundos,
         orden: this.orden
       }).select().single();
       if (error) throw new Error("Error creando ejercicio: " + error.message);
       this.id = data.id;
    } else {
       // Update
       const db = getDbClient();
       const { error } = await db.from("ejercicio").update({
         nombre: this.nombre,
         series: this.series,
         repeticiones: this.repeticiones,
         descanso_segundos: this.descansoSegundos,
         orden: this.orden
       }).eq("id", this.id);
       if (error) throw new Error("Error actualizando ejercicio: " + error.message);
    }
  }

  public static async fetchByPlan(planId: string): Promise<Ejercicio[]> {
    const db = getDbClient();
    const { data, error } = await db.from("ejercicio").select("*").eq("plan_id", planId).order("orden", { ascending: true });
    if (error || !data) return [];
    return data.map((d: any) => new Ejercicio(d.id, d.plan_id, d.nombre, d.series, d.repeticiones, d.descanso_segundos, d.orden));
  }
}

export class AsignacionPlan {
  public id: string | null;
  private clienteId: string;
  private planId: string;
  private entrenadorId: string | null;
  private fechaAsignacion: Date;
  private activa: boolean;

  constructor(
    id: string | null,
    clienteId: string,
    planId: string,
    entrenadorId: string | null,
    fechaAsignacion: Date,
    activa: boolean = true
  ) {
    this.id = id;
    this.clienteId = clienteId;
    this.planId = planId;
    this.entrenadorId = entrenadorId;
    this.fechaAsignacion = fechaAsignacion;
    this.activa = activa;
  }

  public async asignar(): Promise<void> {
    const db = getDbClient();
    const { data, error } = await db.from("asignacion_plan").insert({
      cliente_id: this.clienteId,
      plan_id: this.planId,
      entrenador_id: this.entrenadorId,
      activa: this.activa
    }).select().single();
    if (error) throw new Error("Error asignando plan: " + error.message);
    this.id = data.id;
    this.fechaAsignacion = new Date(data.fecha_asignacion || data.created_at);
  }

  public async desactivar(): Promise<void> {
    if (!this.id) return;
    this.activa = false;
    const db = getDbClient();
    await db.from("asignacion_plan").update({ activa: false }).eq("id", this.id);
  }

  public getCliente(): Cliente {
    return { id: this.clienteId, nombre: "Cliente ID" }; // Simulado para cumplimiento de firma
  }

  public getPlan(): string {
    return this.planId;
  }

  public getEntrenador(): string | null {
    return this.entrenadorId;
  }

  public isActiva(): boolean {
    return this.activa;
  }
}

export class PlanEntrenamiento {
  public id: string | null;
  private nombre: string;
  private objetivo: string;
  private activo: boolean;
  private fechaCreacion: Date;
  private fechaModificacion: Date;
  private creadorId: string | null;

  constructor(
    id: string | null = null,
    nombre: string,
    objetivo: string,
    activo: boolean = true,
    fechaCreacion: Date = new Date(),
    fechaModificacion: Date = new Date(),
    creadorId: string | null = null
  ) {
    this.id = id;
    this.nombre = nombre;
    this.objetivo = objetivo;
    this.activo = activo;
    this.fechaCreacion = fechaCreacion;
    this.fechaModificacion = fechaModificacion;
    this.creadorId = creadorId;
  }

  public async crear(): Promise<void> {
    const db = getDbClient();
    const { data, error } = await db.from("plan_entrenamiento").insert({
      nombre: this.nombre,
      objetivo: this.objetivo,
      activo: this.activo,
      creado_por: this.creadorId,
    }).select().single();
    if (error) throw new Error("Error creando plan: " + error.message);
    this.id = data.id;
    this.fechaCreacion = new Date(data.created_at);
  }

  public async modificar(nombre: string, objetivo: string): Promise<void> {
    if (!this.id) throw new Error("Plan not saved to database yet");
    this.nombre = nombre;
    this.objetivo = objetivo;
    this.fechaModificacion = new Date();
    
    const db = getDbClient();
    await db.from("plan_entrenamiento").update({
      nombre: this.nombre,
      objetivo: this.objetivo
    }).eq("id", this.id);
  }

  public async activar(): Promise<void> {
    if (!this.id) return;
    this.activo = true;
    const db = getDbClient();
    await db.from("plan_entrenamiento").update({ activo: true }).eq("id", this.id);
  }

  public isActivo(): boolean {
    return this.activo;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getObjetivo(): string {
    return this.objetivo;
  }

  public getId(): string | null {
    return this.id;
  }

  public async getEjercicios(): Promise<Ejercicio[]> {
    if (!this.id) return [];
    return Ejercicio.fetchByPlan(this.id);
  }

  public async asignar(cliente: Cliente): Promise<void> {
    if (!this.id) throw new Error("Plan must be created before assigning");
    const asignacion = new AsignacionPlan(null, cliente.id, this.id, this.creadorId, new Date(), true);
    await asignacion.asignar();
  }

  public static async fetchByEntrenador(entrenadorId: string): Promise<PlanEntrenamiento[]> {
    const db = getDbClient();
    const { data, error } = await db.from("plan_entrenamiento").select("*").eq("creado_por", entrenadorId).order("created_at", { ascending: false });
    if (error || !data) return [];
    
    return data.map((p: any) => new PlanEntrenamiento(
      p.id, p.nombre, p.objetivo, p.activo, new Date(p.created_at), new Date(p.updated_at || p.created_at), p.creado_por
    ));
  }

  public static async fetchById(planId: string): Promise<PlanEntrenamiento | null> {
    const db = getDbClient();
    const { data, error } = await db.from("plan_entrenamiento").select("*").eq("id", planId).single();
    if (error || !data) return null;
    return new PlanEntrenamiento(data.id, data.nombre, data.objetivo, data.activo, new Date(data.created_at), new Date(data.updated_at || data.created_at), data.creado_por);
  }
}
