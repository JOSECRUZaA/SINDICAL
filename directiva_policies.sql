-- Habilitar RLS explícitamente en las tablas de directiva
ALTER TABLE cargos_directiva ENABLE ROW LEVEL SECURITY;
ALTER TABLE directiva ENABLE ROW LEVEL SECURITY;

-- Políticas para 'cargos_directiva'
-- Todos pueden ver los cargos (para llenar el select)
CREATE POLICY "Lectura global cargos directiva" ON cargos_directiva 
FOR SELECT TO authenticated 
USING (true);

-- Solo el Administrador puede modificar los cargos (opcional si hay UI para esto)
CREATE POLICY "Modificacion cargos directiva" ON cargos_directiva 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');

-- Políticas para 'directiva'
-- Todos pueden ver quién está en la directiva
CREATE POLICY "Lectura global directiva" ON directiva 
FOR SELECT TO authenticated 
USING (true);

-- Solo el Administrador puede insertar, actualizar o eliminar cargos en la directiva
CREATE POLICY "Modificacion directiva" ON directiva 
FOR ALL TO authenticated 
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador')
WITH CHECK ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');
