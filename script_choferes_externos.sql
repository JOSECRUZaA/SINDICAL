-- 1. Crear tabla choferes_externos
CREATE TABLE choferes_externos (
    id_chofer_externo SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    paterno VARCHAR(50),
    materno VARCHAR(50),
    ci VARCHAR(20) UNIQUE NOT NULL,
    licencia VARCHAR(20),
    telefono VARCHAR(20),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

-- 2. Modificar chofer_vehiculo para soportar choferes externos
ALTER TABLE chofer_vehiculo ADD COLUMN id_chofer_externo INT REFERENCES choferes_externos(id_chofer_externo) ON DELETE CASCADE;

-- 3. Añadir CHECK constraint para asegurar que se asigne uno u otro
ALTER TABLE chofer_vehiculo ADD CONSTRAINT chofer_vehiculo_driver_check 
CHECK (
    (id_chofer IS NOT NULL AND id_chofer_externo IS NULL) OR 
    (id_chofer IS NULL AND id_chofer_externo IS NOT NULL)
);

-- 4. Habilitar RLS y crear política para la nueva tabla
ALTER TABLE choferes_externos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso global choferes_externos" ON choferes_externos FOR ALL TO authenticated USING (true);
