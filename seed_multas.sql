-- Inserción de catálogo base de multas
INSERT INTO tipos_multa (concepto, monto_base, estado) VALUES
('Atraso en Ruta (minuto)', 2.00, 1),
('Falla Mecánica Leve', 20.00, 1),
('Falla Mecánica Grave (Sin auxilio)', 50.00, 1),
('Inasistencia a Reunión Ordinaria', 100.00, 1),
('Desvío de Ruta Autorizada', 80.00, 1),
('Falta de Higiene en Unidad', 30.00, 1),
('Mal Trato al Pasajero', 50.00, 1),
('Conducción Peligrosa', 200.00, 1);
