-- Corrección definitiva del Trigger de Auditoría
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    current_user_uuid UUID;
    perfil_id INT;
    registro_id VARCHAR(255);
BEGIN
    -- Intentar obtener el UUID de Auth de Supabase
    current_user_uuid := auth.uid();
    
    -- Buscamos el id_perfil usando auth_user_id (NO id_auth)
    IF current_user_uuid IS NOT NULL THEN
        SELECT id_perfil INTO perfil_id FROM public.perfiles WHERE auth_user_id = current_user_uuid LIMIT 1;
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
        IF row_to_json(OLD)::jsonb IS DISTINCT FROM row_to_json(NEW)::jsonb THEN
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
