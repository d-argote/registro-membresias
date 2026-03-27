# Pre-Producción Checklist - Dashboard Real-Time

**Última actualización:** 27-03-2026  
**Versión:** 1.0

---

## ✅ Checklist Técnico

### Base de Datos
- [ ] Todas las tablas están en Supabase
- [ ] `transaccion_pago` tiene datos de prueba
- [ ] `log_auditoria_acceso` tiene datos de prueba
- [ ] `membresia` tiene datos de prueba con emails
- [ ] `cliente` table tiene campos: nombre, email
- [ ] RLS policies permiten select desde service_role
- [ ] Índices creados para `fecha_fin`, `fecha_pago`, `fecha_acceso`

### Código
- [ ] `lib/services/dashboard.service.ts` compilar sin errores
- [ ] `app/actions/send-membership-reminder.ts` compilar sin errores
- [ ] `app/dashboard/page.tsx` es async y sin errors
- [ ] `app/dashboard/components/dashboard-cards.tsx` existe
- [ ] `app/dashboard/components/dashboard-alerts.tsx` existe
- [ ] `app/dashboard/components/loading-skeletons.tsx` existe
- [ ] `components/dashboard/AlertTableRow.tsx` actualizado con email action
- [ ] No hay `console.error` en production build

### Variables de Entorno
- [ ] `.env.local` tiene `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `.env.local` tiene `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `.env.production` configurada si es necesario
- [ ] Email service key configurada (RESEND_API_KEY, SENDGRID_API_KEY, etc.)
- [ ] `NEXT_PUBLIC_APP_URL` apunta a URL correcta

### Email Service
- [ ] Servicio de email elegido (Resend, SendGrid, o Edge Function)
- [ ] API key válida y configurada
- [ ] Template de email sintácticamente correcto
- [ ] Email test enviado exitosamente
- [ ] Dominio verificado si es requerido por servicio

---

## 🧪 Checklist Funcional

### Dashboard Page
- [ ] Página carga sin errores
- [ ] Tres tarjetas (Ingresos, Accesos, Membresías) muestran datos
- [ ] Todos los números son > 0 (si hay datos en BD)
- [ ] Variaciones se calculan correctamente (+/- X%)
- [ ] Sección de alertas muestra membresías próximas a vencer
- [ ] Gráficos cargan correctamente
- [ ] Proyección widget se muestra

### Skeletons & Loading
- [ ] Al recargar, skeletons aparecen primero
- [ ] Skeletons desaparecen cuando datos cargan
- [ ] No hay "jumps" visuales durante transición
- [ ] Loading toma ~1-3 segundos (depende caché)

### Alertas & Email
- [ ] Tabla de alertas muestra clientes correctamente
- [ ] Campo "Días Restantes" se calcula correctamente
- [ ] Botón "Enviar Recordatorio Email" funciona
- [ ] Spinner aparece mientras se envía
- [ ] Mensaje de éxito aparece después de envío
- [ ] Email test recibido en bandeja
- [ ] Email tiene diseño correcto y texto completo

### Revalidación
- [ ] Después de enviar recordatorio, dashboard se revalida
- [ ] Nuevos pagos aparecen en "Ingresos del día" sin refresh
- [ ] Nuevos accesos aparecen en "Accesos de hoy" sin refresh
- [ ] Limites de revalidación no causan timeouts

### Accesibilidad
- [ ] Todos los botones tienen labels descriptivos
- [ ] Campos de formulario tienen aria-labels
- [ ] Contraste de colores cumple WCAG AA
- [ ] Navegación por teclado funciona
- [ ] Spinners tienen aria-busy="true"

---

## 🔒 Checklist Seguridad

### Authentication & Authorization  
- [ ] Service Role Key NO está en código public-facing
- [ ] Service Role Key está en `.env.local` (NO en .env público)
- [ ] RLS policies están habilitadas en todas las tablas
- [ ] Solo se hacen queries necesarias en servidor
- [ ] No se exponen datos sensibles en HTML

### API Security
- [ ] Email action valida email format
- [ ] Email action valida que campos requeridos existan
- [ ] Email action tiene rate-limiting implementado (opcional pero recomendado)
- [ ] Errores no revelan información sensible
- [ ] CORS configurado correctamente en Edge Function

### Data Privacy
- [ ] Registros de auditoría se crean en tabla `notificacion`
- [ ] Emails NO se guardan en logs públicos
- [ ] Timestamps de acceso son precisos
- [ ] Datos de cliente no se pasan al cliente (frontend)

---

## 📈 Checklist Performance

### Load Time
- [ ] Dashboard carga en < 3 segundos en conexión 3G
- [ ] Skeletons aparecen en < 1 segundo
- [ ] Database queries optimizadas (< 500ms c/u)
- [ ] No hay N+1 queries

### Rendering
- [ ] No hay CSS reflow innecesarios
- [ ] Animaciones son smooth (60fps)
- [ ] Lazy loading implementado para imágenes
- [ ] No hay memory leaks (DevTools Profiler)

### Analytics Ready
- [ ] Logging está implementado para errors
- [ ] Timestamps de eventos registrados
- [ ] Email delivery tracking (si soporta servicio)

---

## 📝 Checklist Documentación

### Código
- [ ] Comments en métodos complejos de DashboardService
- [ ] TypeScript types bien definidos
- [ ] JSDoc comments en funciones públicas
- [ ] README.md actualizado con cambios

### Operaciones
- [ ] REFACTORING_DASHBOARD_SUMMARY.md completado
- [ ] IMPLEMENTATION_GUIDE.md completado
- [ ] Runbook para troubleshooting disponible
- [ ] Links a documentación Supabase en README

### Team
- [ ] Team briefed sobre cambios
- [ ] Screenshots de nueva interfaz disponibles
- [ ] Guía de testing compartida
- [ ] Punto de contacto para issues definido

---

## 🚀 Checklist Deploy

### Pre-Deploy
- [ ] Todos los checksums arriba son ✅
- [ ] Build produce sin warnings: `npm run build`
- [ ] Tests pasan: `npm run test` (si existen)
- [ ] Lint pasa: `npm run lint` (si existe)
- [ ] Cambios están en feature branch
- [ ] PR review aprobado

### Deployment
- [ ] Code merged a `main`
- [ ] Vercel/hosting proveedor inicia deploy automático
- [ ] Build log no tiene errores
- [ ] Deploy se completa exitosamente
- [ ] URLs de producción responden

### Post-Deploy
- [ ] Verifica `/dashboard` en producción
- [ ] Datos se cargan correctamente
- [ ] Envía email de prueba desde producción
- [ ] Monitorea console para errores 24 horas
- [ ] Team notificado que deploy completó

---

## 🐛 Rollback Plan

Si algo falla en producción:

### Opción 1: Code Revert (Rápido)
```bash
git revert <commit-hash>
git push
# Vercel auto-redeploy con código anterior
```

### Opción 2: Feature Flag (Safer)
```typescript
// En dashboard page.tsx
const USE_REAL_DATA = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true';

if (USE_REAL_DATA) {
  // Usar DashboardService
} else {
  // Usar mockData
}
```

### Opción 3: Database Restore
```sql
-- Si datos se corrompieron
RESTORE FROM BACKUP 'backup-timestamp';
```

---

## 📊 Métricas Post-Deploy

Monitorear por 48 horas:

| Métrica | Target | Threshold |
|---------|--------|-----------|
| Error Rate | < 0.1% | > 1% = alert |
| Avg Response Time | < 500ms | > 2000ms = alert |
| Email Success Rate | > 98% | < 95% = alert |
| Database CPU | < 50% | > 80% = alert |
| Memory Usage | < 60% | > 85% = alert |

---

## ✨ Sign-Off

**Deployed By:** _________________  
**Date:** _________________  
**Verified By:** _________________  
**Date:** _________________  

**Production URL:** https://...  
**Dashboard URL:** https://.../dashboard  

**Notes:**
```
_____________________________
_____________________________
_____________________________
```

---

## 🔗 Recursos Útiles

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Este checklist debe completarse ANTES de merge a main.**

✅ = Verificado y funcionando  
❌ = Falla, requiere atención  
🟡 = Pendiente, verificar después  

