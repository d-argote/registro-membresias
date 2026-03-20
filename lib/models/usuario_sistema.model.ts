import { Persona } from "./Persona";

export enum RolUsuario {
  ADMINISTRADOR = 1,
  RECEPCIONISTA = 2,
  ENTRENADOR = 3,
  SOPORTE_TECNICO = 4,
}

export class UsuarioSistema {
  private id: string;
  private nombre: string;
  private email: string;
  private rol: RolUsuario;
  private activo: boolean;

  constructor(
    id: string,
    nombre: string,
    email: string,
    rol: RolUsuario,
    activo: boolean = true
  ) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.rol = rol;
    this.activo = activo;
  }

  public getId(): string {
    return this.id;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getEmail(): string {
    return this.email;
  }

  public getRol(): RolUsuario {
    return this.rol;
  }

  public isActivo(): boolean {
    return this.activo;
  }

  public static fromJson(json: any): UsuarioSistema {
    return new UsuarioSistema(
      json.id,
      json.nombre,
      json.email,
      json.rol_id,
      json.activo
    );
  }
}
