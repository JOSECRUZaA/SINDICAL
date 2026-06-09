-- Habilitar RLS en tablas secundarias relacionadas
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo_ruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE chofer_vehiculo ENABLE ROW LEVEL SECURITY;

-- Políticas para 'rutas'
DROP POLICY IF EXISTS "Lectura global rutas" ON rutas;
CREATE POLICY "Lectura global rutas" ON rutas 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion rutas Administrador" ON rutas;
CREATE POLICY "Modificacion rutas Administrador" ON rutas 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador')
WITH CHECK ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');

-- Políticas para 'vehiculo_ruta'
DROP POLICY IF EXISTS "Lectura global vehiculo_ruta" ON vehiculo_ruta;
CREATE POLICY "Lectura global vehiculo_ruta" ON vehiculo_ruta 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion vehiculo_ruta Administrador" ON vehiculo_ruta;
CREATE POLICY "Modificacion vehiculo_ruta Administrador" ON vehiculo_ruta 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Secretario', 'Controlador'));

-- Políticas para 'chofer_vehiculo'
DROP POLICY IF EXISTS "Lectura global chofer_vehiculo" ON chofer_vehiculo;
CREATE POLICY "Lectura global chofer_vehiculo" ON chofer_vehiculo 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion chofer_vehiculo Administrador" ON chofer_vehiculo;
CREATE POLICY "Modificacion chofer_vehiculo Administrador" ON chofer_vehiculo 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Secretario', 'Controlador'));
