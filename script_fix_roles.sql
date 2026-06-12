-- 1. Actualizar roles existentes en la tabla perfiles
UPDATE perfiles 
SET rol = 'Afiliado' 
WHERE rol IN ('Consulta', 'Chofer', 'Relevo');

-- 2. Eliminar la restricción actual (si existe)
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- 3. Crear la nueva restricción con los roles permitidos
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
CHECK (rol IN ('Administrador', 'Secretario', 'Tesorero', 'Controlador', 'Afiliado'));

-- 4. Cambiar el valor por defecto de la columna rol
ALTER TABLE perfiles ALTER COLUMN rol SET DEFAULT 'Afiliado';

-- 5. Actualizar el trigger para futuros usuarios registrados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
INSERT INTO public.perfiles (auth_user_id, nombres, correo, ci, rol)
VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nombres','Nuevo'),
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'ci', 'CI-' || extract(epoch from now())::varchar),
    'Afiliado'
)
ON CONFLICT (auth_user_id) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id;
RETURN NEW;
END;
$$;
