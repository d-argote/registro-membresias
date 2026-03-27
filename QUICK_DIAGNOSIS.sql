-- Script Rápido: Ver estructura EXACTA de las tablas

-- ============================================================
-- VER COLUMNAS DE log_auditoria_acceso
-- ============================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'log_auditoria_acceso'
ORDER BY ordinal_position;

-- ============================================================
-- VER COLUMNAS DE transaccion_pago
-- ============================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transaccion_pago'
ORDER BY ordinal_position;

-- ============================================================
-- VER COLUMNAS DE membresia
-- ============================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'membresia'
ORDER BY ordinal_position;

-- ============================================================
-- VER COLUMNAS DE cliente
-- ============================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'cliente'
ORDER BY ordinal_position;

-- ============================================================
-- PRUEBAS DE DATOS - Ejecutar si las queries anteriores funcionan
-- ============================================================

-- Contar registros
SELECT COUNT(*) as total_accesos FROM log_auditoria_acceso;
SELECT COUNT(*) as total_transacciones FROM transaccion_pago;
SELECT COUNT(*) as total_membresias FROM membresia;
SELECT COUNT(*) as total_clientes FROM cliente;

-- Ver estructura de sample data
SELECT * FROM log_auditoria_acceso LIMIT 1;
SELECT * FROM transaccion_pago LIMIT 1;
SELECT * FROM membresia LIMIT 1;
SELECT * FROM cliente LIMIT 1;
