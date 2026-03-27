import { RolUsuario } from "@/lib/models/domain/UsuarioSistema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function createAdmin() {
  const { AuthService } = await import("../lib/services/auth.service");
  try {
    const adminEmail = "admin@kinetic.com";
    const adminPass = "Kinetic2026!";
    
    console.log(`Creando usuario admin: ${adminEmail}...`);
    
    const user = await AuthService.crearUsuario({
      nombre: "Administrador Principal",
      email: adminEmail,
      password: adminPass
    }, RolUsuario.ADMINISTRADOR);

    console.log("✅ Admin creado exitosamente:");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPass}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear admin:", error);
    process.exit(1);
  }
}

createAdmin();
