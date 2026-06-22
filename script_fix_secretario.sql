-- Eliminar las políticas anteriores de administrador para perfiles
DROP POLICY IF EXISTS "Administradores pueden actualizar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Administradores pueden insertar perfiles" ON perfiles;

-- Crear nuevas políticas permitiendo a Administradores y Secretarios
CREATE POLICY "Administradores pueden actualizar perfiles" ON perfiles
FOR UPDATE TO authenticated
USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Secretario'));

CREATE POLICY "Administradores pueden insertar perfiles" ON perfiles
FOR INSERT TO authenticated
WITH CHECK ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Secretario'));
