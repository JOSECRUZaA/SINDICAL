-- Corrección de la tabla Directiva para aceptar fechas completas

-- 1. Eliminar restricciones antiguas si existen
ALTER TABLE directiva DROP CONSTRAINT IF EXISTS directiva_gestion_inicio_check;
ALTER TABLE directiva DROP CONSTRAINT IF EXISTS directiva_gestion_fin_check;
ALTER TABLE directiva DROP CONSTRAINT IF EXISTS directiva_check; -- por si acaso

-- 2. Cambiar los tipos de datos de INT a DATE y permitir nulos en la fecha final
ALTER TABLE directiva ALTER COLUMN gestion_inicio TYPE DATE USING CURRENT_DATE;
ALTER TABLE directiva ALTER COLUMN gestion_fin DROP NOT NULL;
ALTER TABLE directiva ALTER COLUMN gestion_fin TYPE DATE USING NULL;

-- 3. Asegurar que haya una columna estado si el frontend la necesita (a veces se llama activo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='directiva' AND column_name='estado') THEN
        ALTER TABLE directiva ADD COLUMN estado SMALLINT DEFAULT 1;
        -- Si existe la columna activo, la borramos para no duplicar
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='directiva' AND column_name='activo') THEN
            ALTER TABLE directiva DROP COLUMN activo;
        END IF;
    END IF;
END $$;

-- 4. Actualizar la caché
NOTIFY pgrst, 'reload schema';
