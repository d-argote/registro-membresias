import { redirect } from "next/navigation";

export default function Home() {
  // Redirigimos al login por defecto para iniciar el flujo de autenticación
  redirect("/login");
}


