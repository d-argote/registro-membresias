import { Persona } from "./Persona";
import { PlanEntrenamiento } from "./Entrenamiento";

// Tipo mínimo para Cliente según lo pedido en la firma de asignarPlan
export interface Cliente {
  id: string;
  nombre: string;
}

export class Entrenador extends Persona {
  private especialidad: string;
  private certificacion: string;
  private fechaContratacion: Date;
  private activo: boolean;

  constructor(
    id: string,
    nombre: string,
    numeroIdentificacion: string,
    tipoIdentificacion: string,
    telefono: string,
    email: string,
    direccion: string,
    especialidad: string,
    certificacion: string,
    fechaContratacion: Date,
    activo: boolean = true
  ) {
    super(id, nombre, numeroIdentificacion, tipoIdentificacion, telefono, email, direccion);
    this.especialidad = especialidad;
    this.certificacion = certificacion;
    this.fechaContratacion = fechaContratacion;
    this.activo = activo;
  }

  /**
   * Genera un nuevo Plan de Entrenamiento y lo guarda en la BD a través del Data Access Object
   */
  public async crearPlan(nombre: string, objetivo: string): Promise<PlanEntrenamiento> {
    const { PlanEntrenamiento } = await import("./Entrenamiento");
    const plan = new PlanEntrenamiento(null, nombre, objetivo, true, new Date(), new Date(), this.id);
    await plan.crear();
    return plan;
  }

  /**
   * Asigna un plan de entrenamiento a un Cliente
   */
  public async asignarPlan(cliente: Cliente, plan: PlanEntrenamiento): Promise<void> {
    await plan.asignar(cliente);
  }

  /**
   * Retorna la lista de planes creados por este entrenador (DAO fetch)
   */
  public async getPlanes(): Promise<PlanEntrenamiento[]> {
    const { PlanEntrenamiento } = await import("./Entrenamiento");
    return PlanEntrenamiento.fetchByEntrenador(this.id);
  }

  public isActivo(): boolean {
    return this.activo;
  }
}
