-- Función para registrar nueva cita
CREATE OR REPLACE FUNCTION registrar_cita(
    p_google_event_id TEXT,
    p_paciente TEXT,
    p_telefono TEXT,
    p_fecha_cita TIMESTAMPTZ,
    p_estado TEXT DEFAULT 'pendiente_confirmacion'
) RETURNS TABLE (
    id TEXT,
    paciente TEXT,
    estado TEXT,
    fecha_cita TIMESTAMPTZ,
    accion TEXT
) AS $$
DECLARE
    v_accion TEXT;
BEGIN
    -- Intentar insertar o actualizar
    INSERT INTO appointments (
        google_event_id,
        paciente,
        telefono,
        fecha_original,
        estado
    ) VALUES (
        p_google_event_id,
        p_paciente,
        p_telefono,
        p_fecha_cita,
        p_estado
    )
    ON CONFLICT (google_event_id) DO UPDATE SET
        paciente = EXCLUDED.paciente,
        telefono = EXCLUDED.telefono,
        fecha_original = EXCLUDED.fecha_original,
        estado = EXCLUDED.estado,
        updated_at = NOW()
    RETURNING 
        appointments.google_event_id,
        appointments.paciente,
        appointments.estado,
        appointments.fecha_original,
        CASE 
            WHEN appointments.created_at = appointments.updated_at THEN 'CREADA'
            ELSE 'ACTUALIZADA'
        END INTO id, paciente, estado, fecha_cita, v_accion;
    
    -- Registrar en n8n_mensajes para tracking
    INSERT INTO n8n_mensajes (
        phone_number,
        nombre,
        pregunta,
        respuesta,
        fecha_recibido,
        fecha_respuesta
    ) VALUES (
        p_telefono,
        p_paciente,
        'Sistema: Cita agendada para ' || TO_CHAR(p_fecha_cita AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY HH24:MI'),
        'Cita registrada - Estado: ' || p_estado || ' - ID: ' || p_google_event_id,
        NOW(),
        NOW()
    );
    
    RETURN QUERY SELECT id, paciente, estado, fecha_cita, v_accion;
END;
$$ LANGUAGE plpgsql;

-- Función para confirmar cita
CREATE OR REPLACE FUNCTION confirmar_cita(
    p_telefono TEXT
) RETURNS TABLE (
    citas_confirmadas INT,
    mensaje TEXT
) AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE appointments 
    SET 
        estado = 'confirmado',
        updated_at = NOW()
    WHERE telefono = p_telefono
    AND fecha_original > NOW()
    AND estado = 'pendiente_confirmacion';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            v_count,
            'Cita(s) confirmada(s) exitosamente'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            0,
            'No se encontraron citas pendientes de confirmar'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para reagendar cita
CREATE OR REPLACE FUNCTION reagendar_cita(
    p_google_event_id TEXT,
    p_nueva_fecha TIMESTAMPTZ,
    p_nuevo_event_id TEXT DEFAULT NULL
) RETURNS TABLE (
    mensaje TEXT,
    nuevo_id TEXT,
    nueva_fecha TIMESTAMPTZ
) AS $$
DECLARE
    v_paciente TEXT;
    v_telefono TEXT;
    v_nuevo_id TEXT;
BEGIN
    -- Obtener datos de la cita original
    SELECT paciente, telefono INTO v_paciente, v_telefono
    FROM appointments
    WHERE google_event_id = p_google_event_id;
    
    IF v_paciente IS NULL THEN
        RETURN QUERY SELECT 
            'Cita no encontrada'::TEXT,
            NULL::TEXT,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;
    
    -- Marcar cita original como reagendada
    UPDATE appointments 
    SET estado = 'reagendado', updated_at = NOW()
    WHERE google_event_id = p_google_event_id;
    
    -- Crear nueva cita
    v_nuevo_id := COALESCE(p_nuevo_event_id, 'NEW_' || p_google_event_id);
    
    INSERT INTO appointments (
        google_event_id,
        paciente,
        telefono,
        fecha_original,
        estado
    ) VALUES (
        v_nuevo_id,
        v_paciente,
        v_telefono,
        p_nueva_fecha,
        'pendiente_confirmacion'
    );
    
    RETURN QUERY SELECT 
        'Cita reagendada exitosamente'::TEXT,
        v_nuevo_id,
        p_nueva_fecha;
END;
$$ LANGUAGE plpgsql;

-- Vista para ver citas activas
CREATE OR REPLACE VIEW v_citas_activas AS
SELECT 
    google_event_id,
    paciente,
    telefono,
    fecha_original,
    fecha_original AT TIME ZONE 'America/Mexico_City' as fecha_mexico,
    estado,
    CASE 
        WHEN fecha_original < NOW() THEN 'PASADA'
        WHEN fecha_original < NOW() + INTERVAL '24 hours' THEN 'HOY/MAÑANA'
        WHEN fecha_original < NOW() + INTERVAL '7 days' THEN 'ESTA_SEMANA'
        ELSE 'FUTURA'
    END as proximidad,
    created_at,
    updated_at
FROM appointments
WHERE estado != 'reagendado'
ORDER BY fecha_original;