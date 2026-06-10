-- 1. Añadir columna id_registro_afectado a la tabla auditoria
ALTER TABLE auditoria ADD COLUMN IF NOT EXISTS id_registro_afectado VARCHAR(255);

-- 2. Crear la función central de auditoría (Trigger)
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    current_user_uuid UUID;
    perfil_id INT;
    registro_id VARCHAR(255);
BEGIN
    -- Intentar obtener el UUID de Auth de Supabase (solo disponible vía API JWT)
    current_user_uuid := auth.uid();
    
    -- Si existe un usuario logueado, buscar su id_perfil correspondiente
    IF current_user_uuid IS NOT NULL THEN
        SELECT id_perfil INTO perfil_id FROM public.perfiles WHERE id_auth = current_user_uuid LIMIT 1;
    END IF;

    -- Extraer el ID principal afectado de forma dinámica según la tabla
    IF TG_TABLE_NAME = 'afiliados' THEN
        IF TG_OP = 'DELETE' THEN registro_id := OLD.id_afiliado::text; ELSE registro_id := NEW.id_afiliado::text; END IF;
    ELSIF TG_TABLE_NAME = 'vehiculos' THEN
        IF TG_OP = 'DELETE' THEN registro_id := OLD.id_vehiculo::text; ELSE registro_id := NEW.id_vehiculo::text; END IF;
    ELSIF TG_TABLE_NAME = 'obligaciones_financieras' THEN
        IF TG_OP = 'DELETE' THEN registro_id := OLD.id_obligacion::text; ELSE registro_id := NEW.id_obligacion::text; END IF;
    ELSIF TG_TABLE_NAME = 'directiva' THEN
        IF TG_OP = 'DELETE' THEN registro_id := OLD.id_directiva::text; ELSE registro_id := NEW.id_directiva::text; END IF;
    END IF;

    -- Guardar el log según el tipo de acción
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (id_perfil, tabla_afectada, accion, dato_nuevo, id_registro_afectado)
        VALUES (perfil_id, TG_TABLE_NAME, TG_OP, row_to_json(NEW), registro_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo registrar si hubo cambios reales en los datos
        IF row_to_json(OLD) IS DISTINCT FROM row_to_json(NEW) THEN
            INSERT INTO auditoria (id_perfil, tabla_afectada, accion, dato_anterior, dato_nuevo, id_registro_afectado)
            VALUES (perfil_id, TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), registro_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (id_perfil, tabla_afectada, accion, dato_anterior, id_registro_afectado)
        VALUES (perfil_id, TG_TABLE_NAME, TG_OP, row_to_json(OLD), registro_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vincular los triggers a las tablas clave (eliminamos si existen para poder recrearlos)
DROP TRIGGER IF EXISTS audit_afiliados_trigger ON afiliados;
CREATE TRIGGER audit_afiliados_trigger AFTER INSERT OR UPDATE OR DELETE ON afiliados FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS audit_vehiculos_trigger ON vehiculos;
CREATE TRIGGER audit_vehiculos_trigger AFTER INSERT OR UPDATE OR DELETE ON vehiculos FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS audit_obligaciones_trigger ON obligaciones_financieras;
CREATE TRIGGER audit_obligaciones_trigger AFTER INSERT OR UPDATE OR DELETE ON obligaciones_financieras FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS audit_directiva_trigger ON directiva;
CREATE TRIGGER audit_directiva_trigger AFTER INSERT OR UPDATE OR DELETE ON directiva FOR EACH ROW EXECUTE FUNCTION log_audit_action();
