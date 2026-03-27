-- SQL Diagnosticador - Validar Estructura de Base de Datos
-- Ejecuta estos comandos en Supabase SQL Editor para diagnosticar errores

-- ============================================================
-- 1. VERIFICAR TABLAS EXISTENTES
-- ============================================================

-- Listar todas las tablas en el esquema public
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- 2. VERIFICAR TABLA log_auditoria_acceso
-- ============================================================

-- Verificar si existe la tabla
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'log_auditoria_acceso'
) AS table_exists;

-- Si existe, mostrar estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'log_auditoria_acceso'
ORDER BY ordinal_position;

-- ============================================================
-- 3. VERIFICAR TABLA transaccion_pago
-- ============================================================

-- Verificar si existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'transaccion_pago'
) AS table_exists;

-- Estructura de columnas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transaccion_pago'
ORDER BY ordinal_position;

-- ============================================================
-- 4. VERIFICAR TABLA membresia
-- ============================================================

-- Verificar si existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'membresia'
) AS table_exists;

-- Estructura de columnas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'membresia'
ORDER BY ordinal_position;

-- ============================================================
-- 5. VERIFICAR TABLA cliente
-- ============================================================

-- Verificar si existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cliente'
) AS table_exists;

-- Estructura de columnas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'cliente'
ORDER BY ordinal_position;

-- ============================================================
-- 6. VERIFICAR DATOS DE PRUEBA
-- ============================================================

-- Contar registros en cada tabla (si existen)
SELECT 
  'transaccion_pago' as table_name,
  COUNT(*) as row_count
FROM transaccion_pago
UNION ALL
SELECT 
  'log_auditoria_acceso',
  COUNT(*)
FROM log_auditoria_acceso
UNION ALL
SELECT 
  'membresia',
  COUNT(*)
FROM membresia
UNION ALL
SELECT 
  'cliente',
  COUNT(*)
FROM cliente;

-- ============================================================
-- 7. CREAR TABLA SI NO EXISTE (log_auditoria_acceso example)
-- ============================================================

-- Descomentar y ejecutar SI la tabla NO existe:
/*
CREATE TABLE IF NOT EXISTS log_auditoria_acceso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuario_sistema(id),
  resultado VARCHAR(50) NOT NULL, -- 'Autorizado' o 'Denegado'
  fecha_acceso TIMESTAMP NOT NULL DEFAULT now(),
  ubicacion VARCHAR(255),
  dispositivo_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-- Crear índices para mejorar queries
CREATE INDEX idx_log_auditoria_resultado 
ON log_auditoria_acceso(resultado);

CREATE INDEX idx_log_auditoria_fecha 
ON log_auditoria_acceso(fecha_acceso DESC);
*/

-- ============================================================
-- 8. VERIFICAR RLS (Row Level Security)
-- ============================================================

-- Ver si RLS está habilitado en cada tabla
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('transaccion_pago', 'log_auditoria_acceso', 'membresia', 'cliente');

-- ============================================================
-- 9. VERIFICAR INDEXES
-- ============================================================

-- Ver índices existentes
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('transaccion_pago', 'log_auditoria_acceso', 'membresia', 'cliente')
ORDER BY tablename, indexname;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================

/*

1. Ejecuta estas queries en orden en Supabase SQL Editor
2. Verifica que todas las tablas requeridas existan
3. Si falta log_auditoria_acceso, usa el CREATE TABLE comentado
4. Asegúrate de que los nombres de columnas coincidan con el código
5. Si hay errores de RLS, verifica las policies en Authentication > Policies

Nombres de columnas esperados:
- log_auditoria_acceso: id, resultado, fecha_acceso, usuario_id
- transaccion_pago: id, monto, estado, fecha_pago
- membresia: id, cliente_id, estado_id, fecha_inicio, fecha_fin
- cliente: id, nombre, email

Si los nombres NO coinciden, actualiza el código en:
  lib/services/dashboard.service.ts

*/
