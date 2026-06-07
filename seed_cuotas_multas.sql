-- Insertar Tipos de Cuota si no existen
INSERT INTO tipos_cuota (nombre, monto_default, periodicidad)
VALUES
('Cuota de Ingreso', 500.00, 'Única'),
('Cuota Mensual', 50.00, 'Mensual'),
('Cuota Semanal', 15.00, 'Extraordinaria'),
('Aporte Pro-Sede', 100.00, 'Extraordinaria')
ON CONFLICT DO NOTHING;

-- Insertar Tipos de Multa relacionados a las asambleas y paros
INSERT INTO tipos_multa (concepto, monto_default, categoria)
VALUES
('Falta a Asamblea Ordinaria', 100.00, 'Asistencia'),
('Falta a Asamblea Extraordinaria', 200.00, 'Asistencia'),
('Falta a Asamblea Magna', 500.00, 'Asistencia'),
('Atraso a Asamblea', 50.00, 'Asistencia'),
('Inasistencia a Paro Movilizado', 300.00, 'Disciplinaria')
ON CONFLICT DO NOTHING;
