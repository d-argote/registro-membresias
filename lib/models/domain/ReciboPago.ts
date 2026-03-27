/**
 * CLASE DOMINIO: ReciboPago
 * Clase de dominio pura — sin dependencias de browser ni Node.
 * La generación real del PDF se hace via ReciboGenerador en el cliente.
 */
export interface DatosRecibo {
  transaccionId: string;
  monto: number;
  fechaPago: Date;
  metodoPagoId: number;
  clienteNombre: string;
  clienteId: string;
  clienteIdentificacion: string;
  tipoMembresia: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export class ReciboPago {
  public readonly id: string;
  public readonly transaccionId: string;
  public readonly numeroRecibo: string;
  public readonly fechaGeneracion: Date;
  public readonly datos: DatosRecibo;

  constructor(datos: DatosRecibo) {
    this.datos = datos;
    this.transaccionId = datos.transaccionId;
    this.numeroRecibo = datos.transaccionId.replace(/-/g, "").slice(-8).toUpperCase();
    this.id = this.numeroRecibo;
    this.fechaGeneracion = new Date();
  }
}
