    -- Esquema de Base de Datos para Sistema de Sindicato
    -- Motor: PostgreSQL (Supabase)

    -- Habilitar extensión pgcrypto para UUIDs si no está activa
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    --------------------------------------------------------
    -- 1. CREACIÓN DE TABLAS
    --------------------------------------------------------

    -- 3.1 Perfiles (Identidad y Acceso)
    CREATE TABLE perfiles (
        id_perfil SERIAL PRIMARY KEY,
        auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
        nombres VARCHAR(100) NOT NULL,
        paterno VARCHAR(80),
        materno VARCHAR(80),
        ci VARCHAR(15) UNIQUE NOT NULL,
        expedido CHAR(2) CHECK (expedido IN ('LP','CB','SC','PT','OR','TJ','CH','BE','PD')),
        correo VARCHAR(150) UNIQUE,
        celular VARCHAR(15),
        fotografia VARCHAR(255),
        rol VARCHAR(30) DEFAULT 'Consulta' CHECK (rol IN ('Administrador', 'Secretario', 'Tesorero', 'Controlador', 'Consulta', 'Afiliado')),
        estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1)),
        fecha_registro TIMESTAMPTZ DEFAULT now()
    );

    -- 3.3 Categorias Licencia
    CREATE TABLE categorias_licencia (
        id_categoria SERIAL PRIMARY KEY,
        categoria VARCHAR(10) UNIQUE NOT NULL,
        descripcion TEXT
    );

    -- 3.2 Afiliados
    CREATE TABLE afiliados (
        id_afiliado SERIAL PRIMARY KEY,
        id_perfil INT UNIQUE REFERENCES perfiles(id_perfil) ON DELETE SET NULL,
        id_categoria_licencia INT REFERENCES categorias_licencia(id_categoria),
        numero_afiliado VARCHAR(15) UNIQUE NOT NULL,
        tipo_afiliado VARCHAR(30) CHECK (tipo_afiliado IN ('Socio Propietario', 'Chofer Asalariado', 'Relevo')),
        fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
        estado_organico VARCHAR(20) DEFAULT 'Activo' CHECK (estado_organico IN ('Activo', 'Suspendido', 'Retirado', 'Fallecido')),
        fecha_emision_licencia DATE,
        fecha_vencimiento_licencia DATE
    );

    -- 3.4 Vehiculos
    CREATE TABLE vehiculos (
        id_vehiculo SERIAL PRIMARY KEY,
        id_propietario INT REFERENCES afiliados(id_afiliado),
        numero_disco INT UNIQUE NOT NULL,
        placa VARCHAR(10) UNIQUE NOT NULL,
        numero_linea VARCHAR(10) NOT NULL,
        numero_interno VARCHAR(5),
        marca VARCHAR(50),
        modelo VARCHAR(50),
        anio_fabricacion SMALLINT CHECK (anio_fabricacion >= 1990),
        color VARCHAR(30),
        estado VARCHAR(30) DEFAULT 'Operativo' CHECK (estado IN ('Operativo', 'Restricción Vehicular', 'Restricción Sindical', 'Mantenimiento', 'Baja'))
    );

    -- 3.5 Chofer Vehiculo (Asignacion)
    CREATE TABLE chofer_vehiculo (
        id_asignacion SERIAL PRIMARY KEY,
        id_vehiculo INT REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
        id_chofer INT REFERENCES afiliados(id_afiliado) ON DELETE CASCADE,
        fecha_asignacion DATE DEFAULT CURRENT_DATE,
        fecha_fin DATE CHECK (fecha_fin > fecha_asignacion),
        estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
    );

    -- 3.6 Rutas
    CREATE TABLE rutas (
        id_ruta SERIAL PRIMARY KEY,
        numero_ruta VARCHAR(10) UNIQUE NOT NULL,
        nombre_ruta VARCHAR(150),
        origen VARCHAR(100) NOT NULL,
        destino VARCHAR(100) NOT NULL,
        estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
    );

    -- 3.7 Vehiculo Ruta
    CREATE TABLE vehiculo_ruta (
        id_vehiculo_ruta SERIAL PRIMARY KEY,
        id_vehiculo INT REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
        id_ruta INT REFERENCES rutas(id_ruta) ON DELETE CASCADE,
        fecha_desde DATE DEFAULT CURRENT_DATE,
        fecha_hasta DATE,
        activo BOOLEAN DEFAULT TRUE
    );

    -- 3.8 Asambleas
    CREATE TABLE asambleas (
        id_asamblea SERIAL PRIMARY KEY,
        id_registrador INT REFERENCES perfiles(id_perfil),
        fecha DATE NOT NULL,
        hora TIME,
        tipo VARCHAR(20) CHECK (tipo IN ('Ordinaria', 'Extraordinaria', 'Eleccionaria')),
        lugar VARCHAR(150),
        quorum_minimo SMALLINT,
        acta_url VARCHAR(255)
    );

    -- 3.9 Asistencia Asamblea
    CREATE TABLE asistencia_asamblea (
        id_asistencia SERIAL PRIMARY KEY,
        id_asamblea INT REFERENCES asambleas(id_asamblea) ON DELETE CASCADE,
        id_afiliado INT REFERENCES afiliados(id_afiliado) ON DELETE CASCADE,
        asistio BOOLEAN DEFAULT FALSE,
        justificado BOOLEAN DEFAULT FALSE,
        observacion VARCHAR(255),
        UNIQUE (id_asamblea, id_afiliado)
    );

    -- 3.10 Tipos Cuota
    CREATE TABLE tipos_cuota (
        id_tipo_cuota SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        monto_default DECIMAL(8,2) NOT NULL DEFAULT 0,
        periodicidad VARCHAR(20) CHECK (periodicidad IN ('Mensual', 'Anual', 'Única', 'Extraordinaria')),
        activo BOOLEAN DEFAULT TRUE
    );

    -- 3.11 Tipos Multa
    CREATE TABLE tipos_multa (
        id_tipo_multa SERIAL PRIMARY KEY,
        concepto VARCHAR(150) UNIQUE NOT NULL,
        monto_default DECIMAL(8,2) NOT NULL,
        categoria VARCHAR(50) NOT NULL
    );

    -- 3.12 Obligaciones Financieras
    CREATE TABLE obligaciones_financieras (
        id_obligacion SERIAL PRIMARY KEY,
        id_afiliado INT NOT NULL REFERENCES afiliados(id_afiliado),
        id_tipo_cuota INT REFERENCES tipos_cuota(id_tipo_cuota),
        id_tipo_multa INT REFERENCES tipos_multa(id_tipo_multa),
        id_asamblea INT REFERENCES asambleas(id_asamblea),
        id_emisor INT REFERENCES perfiles(id_perfil),
        id_cobrador INT REFERENCES perfiles(id_perfil),
        tipo_obligacion VARCHAR(20) NOT NULL CHECK (tipo_obligacion IN ('Cuota', 'Multa')),
        concepto VARCHAR(255) NOT NULL,
        gestion INT CHECK (gestion >= 2000),
        mes SMALLINT CHECK (mes BETWEEN 1 AND 12),
        monto_total DECIMAL(8,2) NOT NULL,
        monto_pagado DECIMAL(8,2) DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagado', 'Condonado', 'Fuera de Plazo')),
        fecha_registro DATE DEFAULT CURRENT_DATE,
        fecha_limite DATE,
        fecha_pago TIMESTAMPTZ,
        numero_recibo VARCHAR(50) UNIQUE,
        observacion VARCHAR(255)
    );

    -- 3.13 Cargos Directiva
    CREATE TABLE cargos_directiva (
        id_cargo SERIAL PRIMARY KEY,
        nombre_cargo VARCHAR(80) UNIQUE NOT NULL,
        orden_jerarquico SMALLINT
    );

    -- 3.14 Directiva
    CREATE TABLE directiva (
        id_directiva SERIAL PRIMARY KEY,
        id_afiliado INT REFERENCES afiliados(id_afiliado),
        id_cargo INT REFERENCES cargos_directiva(id_cargo),
        gestion_inicio INT NOT NULL CHECK (gestion_inicio >= 2000),
        gestion_fin INT NOT NULL CHECK (gestion_fin > gestion_inicio),
        activo BOOLEAN DEFAULT TRUE
    );

    -- 3.15 Auditoria
    CREATE TABLE auditoria (
        id_auditoria SERIAL PRIMARY KEY,
        id_perfil INT REFERENCES perfiles(id_perfil),
        tabla_afectada VARCHAR(50) NOT NULL,
        accion VARCHAR(10) CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
        dato_anterior JSONB,
        dato_nuevo JSONB,
        fecha_accion TIMESTAMPTZ DEFAULT now(),
        ip_origen VARCHAR(45)
    );

    --------------------------------------------------------
    -- 2. ROW LEVEL SECURITY (RLS)
    --------------------------------------------------------
    ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;
    ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE obligaciones_financieras ENABLE ROW LEVEL SECURITY;
    ALTER TABLE asambleas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE asistencia_asamblea ENABLE ROW LEVEL SECURITY;
    ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

    -- Políticas para 'perfiles'
    CREATE POLICY "Lectura de perfil propio o Admin" ON perfiles
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid() OR rol = 'Administrador');

    CREATE POLICY "Actualización perfil propio" ON perfiles
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid());

    -- Políticas para 'afiliados'
    CREATE POLICY "Lectura global afiliados" ON afiliados FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Modificacion afiliados (Backend control)" ON afiliados FOR ALL TO authenticated USING (true);

    -- Políticas para 'vehiculos'
    CREATE POLICY "Lectura global vehiculos" ON vehiculos FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Modificacion vehiculos" ON vehiculos FOR ALL TO authenticated USING (true);

    -- Políticas para 'obligaciones_financieras'
    CREATE POLICY "Lectura obligaciones" ON obligaciones_financieras
    FOR SELECT TO authenticated
    USING (
        id_afiliado = (SELECT id_afiliado FROM afiliados a JOIN perfiles p ON a.id_perfil = p.id_perfil WHERE p.auth_user_id = auth.uid())
        OR (SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Tesorero')
    );

    CREATE POLICY "Escritura obligaciones" ON obligaciones_financieras
    FOR ALL TO authenticated
    USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) IN ('Administrador', 'Tesorero', 'Controlador'));

    -- Resto de tablas abiertas a autenticados por simplicidad (ajustable según UI)
    CREATE POLICY "Acceso asambleas" ON asambleas FOR ALL TO authenticated USING (true);
    CREATE POLICY "Acceso asistencia" ON asistencia_asamblea FOR ALL TO authenticated USING (true);

    -- Auditoria (Solo lectura Admin, inserción vía DB/Service)
    CREATE POLICY "Lectura auditoria" ON auditoria FOR SELECT TO authenticated
    USING ((SELECT rol FROM perfiles WHERE auth_user_id = auth.uid()) = 'Administrador');


    --------------------------------------------------------
    -- 3. TRIGGERS Y FUNCIONES
    --------------------------------------------------------

    -- 6. Trigger: Auto-vinculación Auth -> Perfil
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
    INSERT INTO public.perfiles (auth_user_id, nombres, correo, ci, rol)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'nombres','Nuevo'),
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'ci', 'CI-' || extract(epoch from now())::varchar), -- Fallback para CI (NOT NULL)
        'Consulta'
    )
    ON CONFLICT (auth_user_id) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id;
    RETURN NEW;
    END;
    $$;

    CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


    --------------------------------------------------------
    -- 4. VISTAS OPTIMIZADAS
    --------------------------------------------------------

    -- 7.1 vista_busqueda_vehiculos
    CREATE OR REPLACE VIEW vista_busqueda_vehiculos AS
    SELECT 
        v.id_vehiculo,
        v.numero_disco || ' ' || v.placa || ' ' || 
        COALESCE(ap.numero_afiliado, '') || ' ' || COALESCE(pp.nombres, '') || ' ' || COALESCE(pp.paterno, '') || ' ' || COALESCE(pp.ci, '') || ' ' ||
        COALESCE(ac.numero_afiliado, '') || ' ' || COALESCE(pc.nombres, '') || ' ' || COALESCE(pc.paterno, '') || ' ' || COALESCE(pc.ci, '') AS busqueda_texto
    FROM vehiculos v
    LEFT JOIN afiliados ap ON v.id_propietario = ap.id_afiliado
    LEFT JOIN perfiles pp ON ap.id_perfil = pp.id_perfil
    LEFT JOIN chofer_vehiculo cv ON v.id_vehiculo = cv.id_vehiculo AND cv.estado = 1 AND cv.fecha_fin IS NULL
    LEFT JOIN afiliados ac ON cv.id_chofer = ac.id_afiliado
    LEFT JOIN perfiles pc ON ac.id_perfil = pc.id_perfil;


    --------------------------------------------------------
    -- 5. ÍNDICES DE RENDIMIENTO (B-Tree)
    --------------------------------------------------------
    CREATE INDEX idx_perfiles_auth_user_id ON perfiles(auth_user_id);
    CREATE INDEX idx_perfiles_ci ON perfiles(ci);
    CREATE INDEX idx_afiliados_numero ON afiliados(numero_afiliado);
    CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
    CREATE INDEX idx_vehiculos_disco ON vehiculos(numero_disco);
    CREATE INDEX idx_chofer_vehiculo_vigente ON chofer_vehiculo(id_vehiculo, id_chofer) WHERE estado=1 AND fecha_fin IS NULL;
    CREATE INDEX idx_obligaciones_afiliado ON obligaciones_financieras(id_afiliado);
    CREATE INDEX idx_obligaciones_estado ON obligaciones_financieras(estado) WHERE estado='Pendiente';

