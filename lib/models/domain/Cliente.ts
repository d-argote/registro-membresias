export type EstadoMembresia = 'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA' | 'VENCIDA';

export class Cliente {
  // Atributos heredados (ej. de Persona o Usuario)
  public nombre: string;
  public numeroIdentificacion: string;
  public tipoIdentificacion: string;
  public telefono: string;
  public email: string;
  public direccion: string;

  // Atributos propios
  public fechaNacimiento: Date;
  public tieneDiscapacidad: boolean;
  public descripcionDiscapacidad?: string;
  public estadoMembresia: EstadoMembresia;
  public activo: boolean;
  public consentimientoDatos: boolean;
  public fechaConsentimiento?: Date;
  public fechaRegistro: Date;

  constructor(data: Partial<Cliente>) {
    this.nombre = data.nombre || '';
    this.numeroIdentificacion = data.numeroIdentificacion || '';
    this.tipoIdentificacion = data.tipoIdentificacion || '';
    this.telefono = data.telefono || '';
    this.email = data.email || '';
    this.direccion = data.direccion || '';
    
    this.fechaNacimiento = data.fechaNacimiento || new Date();
    this.tieneDiscapacidad = data.tieneDiscapacidad || false;
    this.descripcionDiscapacidad = data.descripcionDiscapacidad;
    this.estadoMembresia = data.estadoMembresia || 'INACTIVA';
    this.activo = data.activo ?? true;
    this.consentimientoDatos = data.consentimientoDatos || false;
    this.fechaConsentimiento = data.fechaConsentimiento;
    this.fechaRegistro = data.fechaRegistro || new Date();
  }

  // Métodos
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
    return `${this.tipoIdentificacion} - ${this.numeroIdentificacion}`;
  }

  public registrar(): void {
    this.fechaRegistro = new Date();
    this.activo = true;
    // Logica de registro en base de datos
  }

  public validarAcceso(): boolean {
    return this.activo && this.tieneMembresiaActiva();
  }

  public actualizarEstado(nuevoEstado: EstadoMembresia): void {
    this.estadoMembresia = nuevoEstado;
    if (nuevoEstado === 'VENCIDA' || nuevoEstado === 'SUSPENDIDA') {
      this.activo = false;
    }
  }

  public tieneMembresiaActiva(): boolean {
    return this.estadoMembresia === 'ACTIVA';
  }

  public getHuellas(): any[] {
    // Retorna las plantillas biométricas registradas
    return [];
  }

  public getMembresias(): any[] {
    // Retorna historial de membresías
    return [];
  }

  public getPlanesAsignados(): any[] {
    // Retorna planes de entrenamiento o nutrición
    return [];
  }

  public getEventosAcceso(): any[] {
    // Retorna logs de accesos al gimnasio
    return [];
  }

  public getTransacciones(): any[] {
    // Retorna historial de pagos
    return [];
  }

  public isActivo(): boolean {
    return this.activo;
  }
}
