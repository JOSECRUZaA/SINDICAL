-- 1. Eliminar la restricción actual (que solo permitía 3 tipos)
ALTER TABLE asambleas DROP CONSTRAINT IF EXISTS asambleas_tipo_check;

-- 2. Añadir la nueva restricción con todos los tipos requeridos
ALTER TABLE asambleas ADD CONSTRAINT asambleas_tipo_check 
CHECK (tipo IN ('Ordinaria', 'Extraordinaria', 'Eleccionaria', 'Magna', 'Directiva'));
