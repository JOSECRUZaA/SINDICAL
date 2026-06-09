-- Añadir columnas de coordenadas a la tabla rutas
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS origen_lat DECIMAL(10, 8);
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS origen_lng DECIMAL(11, 8);
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS destino_lat DECIMAL(10, 8);
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS destino_lng DECIMAL(11, 8);

-- Valores por defecto opcionales (puedes dejarlos nulos)
-- Si ya tienes datos, se mantendrán los campos de texto existentes y las coordenadas en nulo.
