-- ================================================================
-- FUNCIÓN 6: DETECTAR NO-SHOWS AUTOMÁTICAMENTE  
-- ================================================================
CREATE OR REPLACE FUNCTION detectar_no_shows()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_citas_actualizadas INTEGER := 0;
    v_resultados JSON;
BEGIN
    -- Actualizar citas que ya pasaron y están pendientes a 'no_show'
    UPDATE appointments 
    SET 
        estado = 'no_show',
        updated_at = NOW()
    WHERE 
        estado IN ('pendiente_confirmacion', 'confirmado')
        AND fecha_original < NOW() - INTERVAL '30 minutes' -- 30 min de gracia
        AND DATE(fecha_original AT TIME ZONE 'America/Mexico_City') = CURRENT_DATE;
    
    GET DIAGNOSTICS v_citas_actualizadas = ROW_COUNT;
    
    -- Registrar eventos en timeline para las citas marcadas como no-show
    INSERT INTO appointment_timeline (
        google_event_id,
        evento_tipo,
        descripcion,
        usuario_origen,
        metadata
    )
    SELECT 
        google_event_id,
        'no_show_detectado',
        'No-show detectado automáticamente - Cita no confirmada después de la hora programada',
        'sistema_automatico',
        json_build_object(
            'fecha_deteccion', NOW(),
            'tiempo_transcurrido', EXTRACT(EPOCH FROM (NOW() - fecha_original))/60,
            'estado_anterior', 'pendiente_confirmacion'
        )
    FROM appointments 
    WHERE estado = 'no_show' 
    AND updated_at > NOW() - INTERVAL '1 minute'; -- Solo las recién actualizadas
    
    -- Actualizar métricas del día si hay cambios
    IF v_citas_actualizadas > 0 THEN
        PERFORM actualizar_metricas_dia(CURRENT_DATE);
    END IF;
    
    -- Preparar resultado
    SELECT json_build_object(
        'timestamp', NOW(),
        'citas_actualizadas', v_citas_actualizadas,
        'mensaje', CASE 
            WHEN v_citas_actualizadas = 0 THEN 'No se encontraron no-shows para actualizar'
            WHEN v_citas_actualizadas = 1 THEN '1 cita marcada como no-show'
            ELSE v_citas_actualizadas || ' citas marcadas como no-show'
        END,
        'exito', true,
        'detalles', json_build_object(
            'fecha_proceso', CURRENT_DATE,
            'criterio_usado', 'Citas con más de 30 minutos de retraso',
            'estados_revisados', ARRAY['pendiente_confirmacion', 'confirmado']
        )
    ) INTO v_resultados;
    
    RETURN v_resultados;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'timestamp', NOW(),
        'citas_actualizadas', 0,
        'mensaje', 'Error al detectar no-shows: ' || SQLERRM,
        'exito', false,
        'error', SQLERRM
    );
END;
$$;

-- TEST
SELECT detectar_no_shows();