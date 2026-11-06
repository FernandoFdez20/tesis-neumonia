-- ==========================================================
-- ==========================================================

-- 1. TIPOS ENUM
-- HU-03: roles reducidos a los 3 definidos en el CU. 'Médico' y 'Técnico' se
-- eliminaron; el acceso clínico ahora lo tiene 'Enfermera' (operativo) y
-- 'Especialista' (además: examen físico, derivación, validación y PDF).
CREATE TYPE tipo_rol AS ENUM ('Admin', 'Enfermera', 'Especialista');
CREATE TYPE tipo_gravedad AS ENUM ('Baja', 'Moderada', 'Alta', 'Crítica');
-- CORRECCIÓN: Ortografía arreglada y se agregó 'Validado', 'Pendiente de evaluación' y 'Derivado a radiografía'
CREATE TYPE tipo_estado_val AS ENUM (
'Sin atención pendiente',
'Pendiente de evaluación',
'Derivado a radiografía',
'Diagnostico pendiente',
'Pendiente de validación',
'Validado');
-- Nota futura: (Opcional) Si el médico atiende y da de alta sin pedir rayos X, 
-- se puede considerar agregar el estado 'Alta sin radiografía' aquí en el futuro.

CREATE TYPE estado_atencion AS ENUM ('Finalizada', 'En proceso');

-- 2. TABLA: USUARIOS
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    rol tipo_rol NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.1 HU-04: desviaciones de permisos por usuario.
-- El rol aporta la base de permisos (definida en el código, ver
-- backend/app/core/permisos.py). Aquí solo se guardan las diferencias:
-- concede = TRUE suma el permiso, concede = FALSE lo quita.
CREATE TABLE usuario_permisos_override (
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    permiso VARCHAR(50) NOT NULL,
    concede BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_usuario_permiso PRIMARY KEY (usuario_id, permiso)
);

-- 3. TABLA: PACIENTES (Datos maestros y Form 2 + Form 4)
CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NOT NULL, 
    nombres_apellidos VARCHAR(150) NOT NULL,
    sexo VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    otros_antecedentes TEXT,        -- Datos manuales Form 4
    antecedentes_familiares TEXT,   -- Datos manuales Form 4
    ultima_atencion TIMESTAMP,
    en_atencion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Este archivo define SOLO el esquema; no siembra usuarios.
-- No se versionan cuentas ni hashes de contraseña: el primer Administrador
-- se crea desde la API (POST /api/v1/auth/register, requiere un Admin) o con
-- un script de arranque propio.
-- OJO: nunca insertes usuarios con `id` explícito, o la secuencia
-- `usuarios_id_seq` queda sin avanzar y el siguiente alta choca con la PK.

-- 4. TABLA: ENFERMEDADES
CREATE TABLE enfermedades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- 5. TABLA INTERMEDIA: ANTECEDENTES DEL PACIENTE
CREATE TABLE paciente_enfermedades (
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    enfermedad_id INTEGER REFERENCES enfermedades(id) ON DELETE CASCADE,
    PRIMARY KEY (paciente_id, enfermedad_id)
);

CREATE TABLE atenciones_medicas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id), -- ID de la enfermera
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_atencion DATE, -- Fecha y hora seleccionadas; el registro conserva su marca del sistema.
    hora_atencion TIME,
    
    -- Signos Vitales mayormente tomados por la enfermera
    temperatura DECIMAL(4,2),
    frecuencia_cardiaca INTEGER,
    frecuencia_respiratoria INTEGER,
    saturacion_o2 INTEGER,
    presion_sistolica INTEGER,
    presion_diastolica INTEGER,
    tiempo_evolucion_dias INTEGER,
    
    -- Clínico
    motivo_consulta TEXT,
    sintomas_principales TEXT,
    examen_fisico TEXT, -- Registrado por el doctor (Ej: "Se escuchan crepitantes en el pulmón derecho").
    derivado_radiografia BOOLEAN NOT NULL DEFAULT FALSE,
    confusion BOOLEAN DEFAULT FALSE, -- Criterio CRB-65
    
    -- Resultados del Triage (Score CRB-65)
    crb65_puntaje INTEGER,
    crb65_gravedad VARCHAR(20),
    crb65_detalle JSONB,
    
    estado estado_atencion DEFAULT 'En proceso'
);

-- se registra al momento de pasar con el doctor da veredicto o manda hacer radiografia     
CREATE TABLE diagnosticos (
    id SERIAL PRIMARY KEY,
    atencion_medica_id INTEGER NOT NULL REFERENCES atenciones_medicas(id) ON DELETE CASCADE,
    
    -- Resultados IA Consolidado (opcional o calculado luego)
    enfermo BOOLEAN,
    -- nivel_gravedad_ia VARCHAR(50), -- Reservado Etapa 2 (marcado de áreas)
    
    -- Confianzas de otros módulos
    -- confianza_clinica NUMERIC(5,2), -- Reservado para Fusión Multimodal
    -- confianza_riesgo NUMERIC(5,2), -- Reservado para Fusión Multimodal
    
    -- hallazgos_json JSONB, -- Reservado Etapa 2 (Mapas de calor / Bounding boxes)
    
    -- Priorización Dinámica (Fusión de CRB-65 + IA)
    prioridad_final tipo_gravedad,
    prioridad_detalle JSONB,
    
    -- Imagen representativa (la de mayor probabilidad IA)
    imagen_referencia_id INTEGER,
    
    -- Validación médica
    estado_validacion tipo_estado_val DEFAULT 'Diagnostico pendiente',
    clasificacion_medico VARCHAR(50),      -- 'Neumonía', 'Sano', 'Otro diagnóstico'
    diagnostico_final_medico BOOLEAN,      -- True si Neumonía, False caso contrario
    concordancia_ia VARCHAR(20),           -- 'Confirmado' o 'Corregido'
    diagnostico_descripcion TEXT,  -- lo registra el medico
    validado_por_id INTEGER REFERENCES usuarios(id), -- ID del médico que validó
    fecha_validacion TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA HIJA PARA MÚLTIPLES IMÁGENES
CREATE TABLE diagnostico_imagenes (
    id SERIAL PRIMARY KEY,
    diagnostico_id INTEGER NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
    imagen_url TEXT NOT NULL,
    orden INTEGER DEFAULT 1,
    tipo_vista VARCHAR(10),
    
    -- Resultados independientes por imagen
    probabilidad_ia NUMERIC(5,4),
    confianza_radiografica NUMERIC(5,2),
    hallazgo_positivo BOOLEAN,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- TABLA: NOTIFICACIONES PERSISTENTES DE CASOS PRIORITARIOS
-- Se crea automáticamente con prioridad Alta/Crítica y solo se cierra
-- por validación de la atención (automático) o descarte explícito (manual).
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    diagnostico_id INTEGER NOT NULL UNIQUE REFERENCES diagnosticos(id) ON DELETE CASCADE,
    prioridad VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE NOT NULL,
    cerrada BOOLEAN DEFAULT FALSE NOT NULL,
    motivo_cierre VARCHAR(20),  -- 'manual' | 'validacion' | 'recalculada'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP
);


-- ==========================================================
-- INSERTS DE CONFIGURACIÓN
-- ==========================================================

INSERT INTO enfermedades (nombre) VALUES 
('Diabetes mellitus'), ('Hipertensión arterial'), ('EPOC'), ('Asma'), 
('Insuficiencia cardiaca'), ('Enfermedad renal cronica'), ('VIH/SIDA'), 
('Cancer'), ('Cirrosis hepatica'), ('Artritis reumatoide');
-- foreign key de imagen de referencia
ALTER TABLE diagnosticos ADD CONSTRAINT fk_diagnostico_imagen_ref FOREIGN KEY (imagen_referencia_id) REFERENCES diagnostico_imagenes(id) ON DELETE SET NULL;
