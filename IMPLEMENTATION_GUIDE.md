# Guía de Implementación - Dashboard Real-Time

**Fecha de Implementación:**27 de Marzo 2026  
**Versión:** 1.0

---

## 📋 Pre-requisitos

Antes de comenzar, verifica que tengas:

### ✅ Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyxxxx...  # ← Crítico para queries del servidor

# Optional (si usas Resend para emails)
RESEND_API_KEY=re_xxxxx...

# Optional (URL de la app para email template)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ✅ Tabla de Base de Datos
Verifica estas tablas en Supabase bajo `Authentication > Policies`:
- [ ] `transaccion_pago` - Con RLS habilitado
- [ ] `log_auditoria_acceso` - Con RLS habilitado
- [ ] `membresia` - Con RLS habilitado  
- [ ] `cliente` - Con RLS habilitado
- [ ] `notificacion` - Con RLS habilitado (opcional)

---

## 🚀 Pasos de Implementación

### PASO 1: Verificar Estructura de Tablas

**1.1 Validar campos de `transaccion_pago`:**
```sql
SELECT * FROM transaccion_pago LIMIT 1;
-- Debe tener: id, monto, estado, fecha_pago
```

**1.2 Validar campos de `log_auditoria_acceso`:**
```sql
SELECT * FROM log_auditoria_acceso LIMIT 1;
-- Debe tener: id, resultado, fecha_acceso
```

**1.3 Validar campos de `membresia`:**
```sql
SELECT * FROM membresia LIMIT 1;
-- Debe tener: id, cliente_id, estado_id, fecha_fin, fecha_inicio, created_at
-- Opcional: ultima_notificacion_vencimiento
```

**1.4 Validar campos de `cliente`:**
```sql
SELECT * FROM cliente LIMIT 1;
-- Debe tener: id, nombre, email
```

---

### PASO 2: Crear Columna Opcional en `membresia`

Para rastrear último recordatorio enviado, ejecuta:
```sql
ALTER TABLE membresia
ADD COLUMN ultima_notificacion_vencimiento TIMESTAMP NULL;

-- Crear índice para mejorar performance
CREATE INDEX idx_membresia_fecha_fin 
ON membresia(fecha_fin ASC) 
WHERE estado_id = 1;
```

---

### PASO 3: Verificar Servicio Email (Elegir una opción)

### Opción A: Usar Supabase Edge Function (RECOMENDADO)

**3A.1 Inicializa Edge Functions:**
```bash
supabase functions new send-email --typescript
```

**3A.2 Implementa la función en `supabase/functions/send-email/index.ts`:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, subject, clientName, endDate, daysLeft } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Implement your email sending logic here
    // Example: using SendGrid, Resend, or SMTP
    
    console.log(`Email sent to ${to}:`, { subject, clientName, endDate, daysLeft });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
```

**3A.3 Deploy la función:**
```bash
supabase functions deploy send-email
```

### Opción B: Usar Resend

**3B.1 Instala el paquete:**
```bash
npm install resend
```

**3B.2 Descomenta en `send-membership-reminder.ts`:**
```typescript
// import { Resend } from "resend";
// const resend = new Resend(process.env.RESEND_API_KEY);
```

**3B.3 Configura el email:**
```typescript
const result = await resend.emails.send({
  from: process.env.EMAIL_FROM || "noreply@tuapp.com",
  to: payload.to,
  subject: payload.subject,
  html: generateReminderEmailHTML(payload),
});
```

### Opción C: Usar SendGrid

**3C.1 Instala el paquete:**
```bash
npm install @sendgrid/mail
```

**3C.2 Implementa en el Server Action.**

---

### PASO 4: Instalar/Actualizar Dependencias

```bash
cd registry-membresias && npm install
# o
yarn install
```

Dependencias ya debería tenerlas:
- `@supabase/supabase-js` ✅
- `next` ✅

---

### PASO 5: Validar Permisos RLS (Importante)

Para que el servidor pueda consultar, verificar permisos:

**5.1 En Supabase Dashboard:**
1. Ve a `Authentication > Policies` para cada tabla
2. Crea policy para service role si no existe:

```sql
-- Example policy for transaccion_pago
CREATE POLICY "Service role can select all"
ON transaccion_pago
FOR SELECT
USING (auth.role() = 'service_role');
```

---

### PASO 6: Prueba Local

**6.1 Inicia el servidor de desarrollo:**
```bash
npm run dev
```

**6.2 Accede al dashboard:**
```
http://localhost:3000/dashboard
```

**6.3 Verifica en consola que no hay errores:**
- Abre DevTools
- Ve a Console
- Busca errores de Supabase o queries

**6.4 Verifica datos en Network tab:**
- Ve a Network
- Busca requests a Supabase
- Verifica que retornen 200 OK

---

### PASO 7: Probar Alertas de Vencimiento

**7.1 Crea un cliente de prueba:**
```sql
INSERT INTO cliente (nombre, email) 
VALUES ('Test User', 'test@example.com');
```

**7.2 Crea una membresía que venza en 2 días:**
```sql
INSERT INTO membresia (cliente_id, estado_id, fecha_inicio, fecha_fin)
VALUES (
  'cliente-id-aqui',
  1,                    -- ACTIVA
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days'
);
```

**7.3 Ve a Dashboard:**
- Deberías ver el cliente en la sección de alertas
- Haz clic en "Enviar Recordatorio Email"
- Verifica el spinner y el mensaje de éxito

---

### PASO 8: Implementar Revalidación en Acciones Existentes

En tus archivos de actions que registren pagos u accesos, agrega:

**8.1 En `app/actions/transacciones.ts` (o donde registres pagos):**
```typescript
import { revalidatePath } from "next/cache";

export async function registrarPago(...) {
  // ... tu código ...
  
  // Después de insertar en DB:
  revalidatePath('/dashboard');
  
  return result;
}
```

**8.2 En `app/actions/acceso.ts` (o donde registres accesos):**
```typescript
import { revalidatePath } from "next/cache";

export async function registrarAcceso(...) {
  // ... tu código ...
  
  // Después de insertar en DB:
  revalidatePath('/dashboard');
  
  return result;
}
```

---

## 🧪 Checklist de Validación

### Test 1: Datos Real-Time
- [ ] Abre `/dashboard`
- [ ] Verifica "Ingresos del día" muestra un número real
- [ ] Verifica "Accesos de hoy" muestra un número real
- [ ] Verifica "Membresías Vigentes" muestra un número real
- [ ] Recarga la página, números actualizan si hay cambios

### Test 2: Skeletons & Loading
- [ ] En DevTools, ve a Network
- [ ] Filtra por XHR
- [ ] Throttle a "Slow 3G"
- [ ] Recarga dashboard
- [ ] Los skeletons deben aparecer inmediatamente
- [ ] Los datos deben reemplazar skeletons cuando cargan

### Test 3: Alertas de Vencimiento
- [ ] Verifica que la tabla de alertas mostrarlos clientes con membresías próximas a vencer
- [ ] Verifica los días restantes se calculan correctamente
- [ ] Haz clic en "Enviar Recordatorio Email"
- [ ] Espera spinner
- [ ] Mensaje de éxito debe aparecer

### Test 4: Revalidación
- [ ] Registra un pago nuevo
- [ ] Espera 3 segundos
- [ ] Recarga dashboard
- [ ] "Ingresos del día" debe reflejar el nuevo pago

### Test 5: Variaciones
- [ ] Verifica que "Ingresos del día" muestra variación con % (+/-X%)
- [ ] Verifica que "Accesos" muestra capacidad porcentaje
- [ ] Verifica que "Membresías" muestra variación semanal

---

## 🔍 Troubleshooting

### ❌ "No such table" error
**Solución:** Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada en .env.local

### ❌ Datos siempre 0
**Solución:** 
- Verifica que hay datos en las tablas
- Revisa los nombres de columnas (case-sensitive)
- Ejecuta queries SQL directamente en Supabase

### ❌ Error al enviar recordatorio
**Solución:**
- Verifica que el `clientEmail` no esté vacío
- Verifica que el servicio de email esté configurado
- Revisa servidor logs para error específico

### ❌ Skeletons nunca desaparecen
**Solución:**
- Verifica Console para errores
- Abre Network tab para ver si queries están fallando
- Verifica que el Service Role Key es válido

### ❌ CORS error desde Edge Function
**Solución:**
- Verifica que `CORS Headers` están en la Edge Function
- Redeploy la función después de cambios

---

## 📊 Performance Esperada

| Métrica | Target | Actual |
|---------|--------|--------|
| First Contentful Paint | < 1s | N/A (depende hosting) |
| Dashboard load time | < 3s | N/A |
| Email send time | < 2s | N/A |
| Query time (promedio) | < 500ms | N/A |

---

## 🔐 Seguridad

### Requerido para producción:
- [ ] SUPABASE_SERVICE_ROLE_KEY solo en servidor (.env.local NO versionado)
- [ ] RLS policies configuradas correctamente
- [ ] Rate limiting en Server Action
- [ ] Validación de email format
- [ ] Logs de auditoría habilitados

---

## 🚢 Deploy a Producción

### Vercel Deploy:
```bash
git add .
git commit -m "Refactor dashboard with real-time data"
git push origin main
```

Vercel auto-detectará cambios y rebuild automáticamente.

### Supabase Edge Functions Deploy:
```bash
supabase functions deploy send-email --project-id xxxxx
```

---

## 📞 Notas Importantes

1. **Zona horaria:** Todas las fechas usan UTC en Supabase. Ajusta según tu región.
2. **Limpieza de datos:** Los recordatorios no se limpian automáticamente. Implementa una política de retención.
3. **Backup:** Haz backup de tu BD antes de execute scripts SQL.
4. **Monitoreo:** Implementa logging y monitoreo para producción.

---

**Status Actual:** ✅ Refactorización completada  
**Siguiente Paso:** Ejecutar PASO 1-8 según tu entorno

