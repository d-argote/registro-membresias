import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");

  // Si hay código, significa que es una invitación o reset - primero vemos si la sesión es válida
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Con el código canjado exitosamente, ir a /crear-password para que decida el destino
      // basándose en si es cliente o empleado
      return NextResponse.redirect(`${requestUrl.origin}/crear-password`);
    } else {
      console.error("[Auth Callback] Error exchanging code:", error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid_Token`);
    }
  }

  // Si no hay código pero sí hay "type" (invite, recovery), significa que Supabase nos mandó
  // el token por el URL Hash (#access_token=) en lugar de como parámetro.
  // El cliente (navegador) tiene implícitamente el hash, así que redirigimos a /crear-password
  if (type === "invite" || type === "recovery") {
    return NextResponse.redirect(`${requestUrl.origin}/crear-password`);
  }

  // Si hay un "next" explícito, usarlo
  if (next) {
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // Fallback a login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid_Token`);
}
