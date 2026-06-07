-- Permitir a Administradores modificar y crear perfiles
CREATE POLICY "Administradores pueden actualizar perfiles" ON perfiles
FOR UPDATE TO authenticated
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');

CREATE POLICY "Administradores pueden insertar perfiles" ON perfiles
FOR INSERT TO authenticated
WITH CHECK ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');
