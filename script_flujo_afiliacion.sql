-- ==========================================
-- SCRIPT DE FLUJO DE AFILIACIÓN Y HACIENDA
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1. Permitir el estado 'Pendiente' en afiliados
DO $$ 
DECLARE
  const_name text;
BEGIN
  -- Buscar el nombre de la restricción CHECK actual para estado_organico
  SELECT constraint_name INTO const_name 
  FROM information_schema.constraint_column_usage 
  WHERE table_name = 'afiliados' AND column_name = 'estado_organico' LIMIT 1;
  
  IF const_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE afiliados DROP CONSTRAINT ' || const_name;
  END IF;
END $$;

ALTER TABLE afiliados ADD CONSTRAINT afiliados_estado_organico_check 
CHECK (estado_organico IN ('Activo', 'Pendiente', 'Suspendido', 'Retirado', 'Fallecido'));

ALTER TABLE afiliados ALTER COLUMN estado_organico SET DEFAULT 'Pendiente';

-- 2. Asegurar que existe la "Cuota de Ingreso" en tipos_cuota
INSERT INTO tipos_cuota (nombre, monto_default, periodicidad)
VALUES ('Cuota de Ingreso', 500.00, 'Única')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Crear Trigger para dar de alta automáticamente al pagar
CREATE OR REPLACE FUNCTION public.activar_afiliado_por_pago()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la obligación que se acaba de pagar es una Cuota de Ingreso
    IF NEW.estado = 'Pagado' AND OLD.estado != 'Pagado' THEN
        -- Verificar si el concepto contiene "Cuota de Ingreso"
        IF NEW.concepto ILIKE '%Cuota de Ingreso%' THEN
            -- Actualizar el estado del afiliado a Activo
            UPDATE afiliados 
            SET estado_organico = 'Activo' 
            WHERE id_afiliado = NEW.id_afiliado AND estado_organico = 'Pendiente';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_activar_afiliado ON obligaciones_financieras;

CREATE TRIGGER trigger_activar_afiliado
AFTER UPDATE OF estado ON obligaciones_financieras
FOR EACH ROW
EXECUTE FUNCTION public.activar_afiliado_por_pago();


-- 4. Modificar el Trigger de Auth para permitir fusionar cuentas si el CI ya existe en un perfil manual
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    existing_perfil_id INT;
BEGIN
    -- Buscar si ya existe un perfil con este CI (creado manualmente por el Secretario)
    SELECT id_perfil INTO existing_perfil_id 
    FROM public.perfiles 
    WHERE ci = NEW.raw_user_meta_data->>'ci' AND auth_user_id IS NULL;
    
    IF existing_perfil_id IS NOT NULL THEN
        -- Si existe, le adjuntamos el auth_user_id y el correo
        UPDATE public.perfiles 
        SET auth_user_id = NEW.id, 
            correo = NEW.email 
        WHERE id_perfil = existing_perfil_id;
    ELSE
        -- Si no existe, creamos uno nuevo
        INSERT INTO public.perfiles (auth_user_id, nombres, correo, ci, rol)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'nombres','Nuevo'),
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'ci', 'CI-' || extract(epoch from now())::varchar),
            'Afiliado'
        );
    END IF;
RETURN NEW;
END;
$$;


-- 5. Añadir políticas (RLS) para permitir al Admin y Secretario insertar en 'perfiles' sin cuenta web
DROP POLICY IF EXISTS "Insercion de perfiles manual" ON perfiles;
CREATE POLICY "Insercion de perfiles manual" ON perfiles
FOR INSERT TO authenticated
WITH CHECK (
    (SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Secretario')
);

DROP POLICY IF EXISTS "Actualizacion de perfiles manual" ON perfiles;
CREATE POLICY "Actualizacion de perfiles manual" ON perfiles
FOR UPDATE TO authenticated
USING (
    (SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Secretario')
);
