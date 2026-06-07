-- Script para Auto-incremento de Número de Afiliado

-- 1. Crear una secuencia para llevar el conteo (ej. 1, 2, 3...)
CREATE SEQUENCE IF NOT EXISTS seq_numero_afiliado START 1;

-- 2. Crear la función que genera el código (Ej. AF-0001)
CREATE OR REPLACE FUNCTION auto_assign_numero_afiliado()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    -- Si es un nuevo registro y no trae número, se lo asignamos
    IF NEW.numero_afiliado IS NULL OR NEW.numero_afiliado = '' THEN
        -- Obtener el siguiente valor de la secuencia
        next_num := nextval('seq_numero_afiliado');
        -- Formatearlo a 4 dígitos con ceros a la izquierda (AF-0001)
        NEW.numero_afiliado := 'AF-' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger que se dispara justo antes de insertar un afiliado
DROP TRIGGER IF EXISTS trigger_auto_numero_afiliado ON afiliados;
CREATE TRIGGER trigger_auto_numero_afiliado
BEFORE INSERT ON afiliados
FOR EACH ROW EXECUTE FUNCTION auto_assign_numero_afiliado();

-- Refrescar la caché
NOTIFY pgrst, 'reload schema';
