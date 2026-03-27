import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // La ruta a donde redirigiremos luego. Si no hay próxima ruta proporcionada, 
  // usa "/dashboard" por defecto o "/crear-password" si es un reseteo de clave.
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type"); 
  
  // Determinamos a dónde enviar dependiendo del tipo de invitación/recuperación
  let redirectUrl = next ?? "/dashboard";
  if (type === "invite" || type === "recovery") {
    redirectUrl = "/crear-password";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${redirectUrl}`);
    } else {
      console.error("[Auth Callback] Error exchanging code:", error);
    }
  } else {
    // Si no hay código pero sí hay "type" (invite, recovery), significa que Supabase nos 
    // mandó el token por el URL Hash (#access_token=). 
    // Como el Server (Route.ts) no ve el hash, debemos decirle al navegador que vaya a 
    // /crear-password, conservando implícitamente el hash en el navegador para que el 
    // cliente de Supabase lo procese.
    if (type === "invite" || type === "recovery") {
      return NextResponse.redirect(`${requestUrl.origin}/crear-password`);
    }
  }

  // Redirigir a la página de login con un error genérico para stafs
  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid_Token`);
}
