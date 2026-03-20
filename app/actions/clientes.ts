"use server";

import { createClient } from "@supabase/supabase-js";

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface ClientePayload {
  numero_identificacion: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  tiene_discapacidad: boolean;
  descripcion_discapacidad?: string | null;
}

interface PlantillaPayload {
  dedo: string;
  score: number;
}

interface RegistrarClienteInput {
  cliente: ClientePayload;
  plantillas: PlantillaPayload[];
}

interface RegistrarClienteResult {
  success: boolean;
  clienteId?: string;
  error?: string;
}

// ─── Cliente servidor (bypasea RLS con service_role) ────────────────────────

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // La service_role key vive solo en el servidor (sin NEXT_PUBLIC_)
  // Si no está configurada, fallback a anon key (que también puede funcionar
  // desde el servidor dependiendo del contexto HTTP)
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: {
      // En el servidor no necesitamos persistencia de sesión
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        // Cuando se usa la service_role key, Supabase bypasea RLS
        // Este header indica a PostgREST que el caller es el servicio
        ...(process.env.SUPABASE_SERVICE_ROLE_KEY
          ? {}
          : { "x-client-info": "server-action" }),
      },
    },
  });
}

// ─── Server Action ──────────────────────────────────────────────────────────

export async function registrarCliente(
  input: RegistrarClienteInput
): Promise<RegistrarClienteResult> {
  const supabase = getServerClient();

  try {
    // 1. Insertar cliente
    const { data: clienteData, error: clienteError } = await supabase
      .from("cliente")
      .insert([
        {
          numero_identificacion: input.cliente.numero_identificacion,
          nombre: input.cliente.nombre,
          email: input.cliente.email,
          telefono: input.cliente.telefono,
          direccion: input.cliente.direccion ?? null,
          fecha_nacimiento: input.cliente.fecha_nacimiento ?? null,
          tiene_discapacidad: input.cliente.tiene_discapacidad,
          descripcion_discapacidad:
            input.cliente.tiene_discapacidad
              ? (input.cliente.descripcion_discapacidad ?? null)
              : null,
        },
      ])
      .select("id")
      .single();

    if (clienteError) {
      console.error("[Server Action] Error insertando cliente:", clienteError);
      return {
        success: false,
        error: clienteError.message ?? JSON.stringify(clienteError),
      };
    }

    const clienteId = clienteData.id as string;

    // 2. Insertar plantillas biométricas
    // PostgREST espera BYTEA como string base64 cuando se envía via REST.
    const plantillas = input.plantillas.map((p) => ({
      cliente_id: clienteId,
      dedo: p.dedo,
      huella_cifrada: Buffer.from(
        `aes256_mock_${p.dedo}_${Date.now()}_${Math.random().toString(36).slice(2)}`
      ).toString("base64"),
      score_calidad: p.score,
    }));

    const { error: bioError } = await supabase
      .from("plantilla_biometrica")
      .insert(plantillas);

    if (bioError) {
      console.error("[Server Action] Error insertando biometría:", bioError);
      // Revertir cliente si la biometría falla (best-effort)
      await supabase.from("cliente").delete().eq("id", clienteId);
      return {
        success: false,
        error: bioError.message ?? JSON.stringify(bioError),
      };
    }

    return { success: true, clienteId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Server Action] Error inesperado:", msg);
    return { success: false, error: msg };
  }
}
