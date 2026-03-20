/**
 * Fase 1: Domain Class - Persona
 */
export abstract class Persona {
  protected id: string;
  protected nombre: string;
  protected numeroIdentificacion: string;
  protected tipoIdentificacion: string;
  protected telefono: string;
  protected email: string;
  protected direccion: string;

  constructor(
    id: string,
    nombre: string,
    numeroIdentificacion: string,
    tipoIdentificacion: string,
    telefono: string,
    email: string,
    direccion: string
  ) {
    this.id = id;
    this.nombre = nombre;
    this.numeroIdentificacion = numeroIdentificacion;
    this.tipoIdentificacion = tipoIdentificacion;
    this.telefono = telefono;
    this.email = email;
    this.direccion = direccion;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getContacto(): Record<string, string> {
    return {
      telefono: this.telefono,
      email: this.email,
      direccion: this.direccion,
    };
  }

  public getIdentificacion(): string {
    return `${this.tipoIdentificacion}: ${this.numeroIdentificacion}`;
  }

  public getId(): string {
    return this.id;
  }
}
