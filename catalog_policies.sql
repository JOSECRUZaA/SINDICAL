-- Asegurar que el resto de catálogos tengan RLS y políticas
ALTER TABLE tipos_cuota ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_multa ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_licencia ENABLE ROW LEVEL SECURITY;

-- Políticas tipos_cuota
DROP POLICY IF EXISTS "Lectura global tipos_cuota" ON tipos_cuota;
CREATE POLICY "Lectura global tipos_cuota" ON tipos_cuota 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion tipos_cuota Admin" ON tipos_cuota;
CREATE POLICY "Modificacion tipos_cuota Admin" ON tipos_cuota 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');

-- Políticas tipos_multa
DROP POLICY IF EXISTS "Lectura global tipos_multa" ON tipos_multa;
CREATE POLICY "Lectura global tipos_multa" ON tipos_multa 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion tipos_multa Admin" ON tipos_multa;
CREATE POLICY "Modificacion tipos_multa Admin" ON tipos_multa 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');

-- Políticas categorias_licencia
DROP POLICY IF EXISTS "Lectura global categorias" ON categorias_licencia;
CREATE POLICY "Lectura global categorias" ON categorias_licencia 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion categorias Admin" ON categorias_licencia;
CREATE POLICY "Modificacion categorias Admin" ON categorias_licencia 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');
