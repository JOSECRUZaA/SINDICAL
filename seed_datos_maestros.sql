-- Script Semilla de Datos Maestros para Sindicato

-- 1. Rutas
INSERT INTO rutas (numero_ruta, nombre_ruta, origen, destino) VALUES
('243', 'Ceja - Pérez Velasco', 'Ceja (El Alto)', 'Pérez Velasco (La Paz)'),
('501', 'Satélite - San Francisco', 'Ciudad Satélite', 'Plaza San Francisco'),
('99', 'Villa Fátima - Prado', 'Terminal Minasa', 'El Prado');

-- 2. Tipos de Cuota
INSERT INTO tipos_cuota (nombre, monto_default, periodicidad) VALUES
('Cuota Mensual Ordinaria', 50.00, 'Mensual'),
('Fondo de Pro-Sede', 100.00, 'Mensual'),
('Aporte Día del Chofer', 30.00, 'Anual');

-- 3. Tipos de Multa
INSERT INTO tipos_multa (concepto, monto_default, categoria) VALUES
('Inasistencia a Asamblea Ordinaria', 100.00, 'Asambleas'),
('Inasistencia a Asamblea Extraordinaria', 200.00, 'Asambleas'),
('Abandono de Ruta', 150.00, 'Operaciones'),
('Falta de Respeto a Directiva', 300.00, 'Disciplina');

-- 4. Cargos Directiva
INSERT INTO cargos_directiva (nombre_cargo, orden_jerarquico) VALUES
('Secretario General', 1),
('Secretario de Relaciones', 2),
('Secretario de Hacienda', 3),
('Secretario de Actas', 4),
('Secretario de Conflictos', 5),
('Vocal', 6);
