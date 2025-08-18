-- =============================================================================
-- SUPABASE TO POSTGRESQL FUNCTIONS MIGRATION SCRIPT
-- =============================================================================
-- This script contains ALL custom business logic functions from Supabase
-- Generated on: 2025-08-18
-- 
-- IMPORTANT: Execute this script AFTER creating all the necessary tables,
-- views, and types in your target PostgreSQL database.
-- =============================================================================

-- Start transaction
BEGIN;

-- =============================================================================
-- 1. CORE BUSINESS LOGIC FUNCTIONS
-- =============================================================================

-- Function: actualizar_metricas_dia
-- Purpose: Updates daily appointment metrics and analytics
CREATE OR REPLACE FUNCTION public.actualizar_metricas_dia(p_fecha date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_metrics RECORD;
    v_result JSON;
BEGIN
    -- Calcular todas las métricas del día
    WITH citas_dia AS (
        SELECT 
            a.*,
            EXTRACT(HOUR FROM a.fecha_original AT TIME ZONE 'America/Mexico_City') as hora_cita,
            EXTRACT(DOW FROM a.fecha_original AT TIME ZONE 'America/Mexico_City') as dia_semana,
            EXISTS(
                SELECT 1 FROM appointments a2 
                WHERE a2.telefono = a.telefono 
                AND a2.google_event_id != a.google_event_id
                AND a2.fecha_original < a.fecha_original
            ) as es_recurrente
        FROM appointments a
        WHERE DATE(a.fecha_original AT TIME ZONE 'America/Mexico_City') = p_fecha
    ),
    recordatorios_dia AS (
        SELECT 
            google_event_id,
            COUNT(*) as num_recordatorios
        FROM appointment_timeline
        WHERE evento_tipo IN ('notificacion_enviada', 'recordatorio_enviado')
        AND google_event_id IN (SELECT google_event_id FROM citas_dia)
        GROUP BY google_event_id
    ),
    tiempos_confirmacion AS (
        SELECT 
            cd.google_event_id,
            cd.tiempo_hasta_confirmacion,
            CASE 
                WHEN cd.tiempo_hasta_confirmacion < INTERVAL '5 minutes' THEN 'menos_5min'
                WHEN cd.tiempo_hasta_confirmacion < INTERVAL '30 minutes' THEN '5_30min'
                WHEN cd.tiempo_hasta_confirmacion < INTERVAL '2 hours' THEN '30min_2h'
                WHEN cd.tiempo_hasta_confirmacion < INTERVAL '24 hours' THEN '2h_24h'
                ELSE 'mas_24h'
            END as rango_tiempo
        FROM citas_dia cd
        WHERE cd.estado = 'confirmado' 
        AND cd.tiempo_hasta_confirmacion IS NOT NULL
    )
    SELECT 
        -- Contadores básicos
        COUNT(*) as total_agendadas,
        COUNT(*) FILTER (WHERE cd.estado = 'confirmado') as total_confirmadas,
        COUNT(*) FILTER (WHERE cd.estado = 'cancelado') as total_canceladas,
        COUNT(*) FILTER (WHERE cd.estado = 'completado') as total_completadas,
        COUNT(*) FILTER (WHERE cd.estado = 'no_show') as total_no_show,
        
        -- Tiempos
        AVG(cd.tiempo_hasta_confirmacion) FILTER (WHERE cd.estado = 'confirmado') as tiempo_promedio,
        MIN(cd.tiempo_hasta_confirmacion) FILTER (WHERE cd.estado = 'confirmado') as tiempo_minimo,
        MAX(cd.tiempo_hasta_confirmacion) FILTER (WHERE cd.estado = 'confirmado') as tiempo_maximo,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cd.tiempo_hasta_confirmacion) 
            FILTER (WHERE cd.estado = 'confirmado') as tiempo_mediano,
        
        -- Distribución temporal
        COUNT(*) FILTER (WHERE tc.rango_tiempo = 'menos_5min') as conf_menos_5min,
        COUNT(*) FILTER (WHERE tc.rango_tiempo = '5_30min') as conf_5_30min,
        COUNT(*) FILTER (WHERE tc.rango_tiempo = '30min_2h') as conf_30min_2h,
        COUNT(*) FILTER (WHERE tc.rango_tiempo = '2h_24h') as conf_2h_24h,
        COUNT(*) FILTER (WHERE tc.rango_tiempo = 'mas_24h') as conf_mas_24h,
        
        -- Horarios
        COUNT(*) FILTER (WHERE cd.hora_cita BETWEEN 10 AND 11) as citas_manana,
        COUNT(*) FILTER (WHERE cd.hora_cita BETWEEN 12 AND 13) as citas_mediodia,
        MODE() WITHIN GROUP (ORDER BY cd.hora_cita || ':' || 
            CASE WHEN EXTRACT(MINUTE FROM cd.fecha_original) = 0 THEN '00' ELSE '30' END) as hora_pico,
        
        -- Pacientes
        COUNT(*) FILTER (WHERE NOT cd.es_recurrente) as pacientes_nuevos,
        COUNT(*) FILTER (WHERE cd.es_recurrente) as pacientes_recurrentes,
        COUNT(DISTINCT cd.telefono) FILTER (WHERE cd.telefono IN (
            SELECT telefono FROM citas_dia GROUP BY telefono HAVING COUNT(*) > 1
        )) as pacientes_multiples,
        
        -- Recordatorios
        SUM(COALESCE(r.num_recordatorios, 0))::INTEGER as total_recordatorios,
        AVG(COALESCE(r.num_recordatorios, 0))::DECIMAL(3,1) as promedio_recordatorios,
        COUNT(*) FILTER (WHERE cd.estado = 'confirmado' AND r.num_recordatorios IS NULL) as conf_sin_recordatorio,
        COUNT(*) FILTER (WHERE cd.estado = 'confirmado' AND r.num_recordatorios > 0) as conf_con_recordatorio,
        
        -- Día de la semana
        MAX(cd.dia_semana)::INTEGER as dia_semana
        
    INTO v_metrics
    FROM citas_dia cd
    LEFT JOIN recordatorios_dia r ON cd.google_event_id = r.google_event_id
    LEFT JOIN tiempos_confirmacion tc ON cd.google_event_id = tc.google_event_id;
    
    -- Insertar o actualizar métricas
    INSERT INTO appointment_analytics (
        fecha,
        total_agendadas,
        total_confirmadas,
        total_canceladas,
        total_completadas,
        total_no_show,
        tiempo_promedio_confirmacion,
        tiempo_minimo_confirmacion,
        tiempo_maximo_confirmacion,
        tiempo_mediano_confirmacion,
        tasa_confirmacion,
        tasa_cancelacion,
        tasa_no_show,
        tasa_completadas,
        confirmadas_menos_5min,
        confirmadas_5_30min,
        confirmadas_30min_2h,
        confirmadas_2h_24h,
        confirmadas_mas_24h,
        citas_manana,
        citas_mediodia,
        hora_pico,
        pacientes_nuevos,
        pacientes_recurrentes,
        pacientes_multiples_citas,
        total_recordatorios_enviados,
        promedio_recordatorios_por_cita,
        citas_confirmadas_sin_recordatorio,
        citas_confirmadas_con_recordatorio,
        dia_semana,
        updated_at
    ) VALUES (
        p_fecha,
        COALESCE(v_metrics.total_agendadas, 0),
        COALESCE(v_metrics.total_confirmadas, 0),
        COALESCE(v_metrics.total_canceladas, 0),
        COALESCE(v_metrics.total_completadas, 0),
        COALESCE(v_metrics.total_no_show, 0),
        v_metrics.tiempo_promedio,
        v_metrics.tiempo_minimo,
        v_metrics.tiempo_maximo,
        v_metrics.tiempo_mediano,
        CASE WHEN v_metrics.total_agendadas > 0 
            THEN ROUND((v_metrics.total_confirmadas::DECIMAL * 100 / v_metrics.total_agendadas), 2)
            ELSE 0 END,
        CASE WHEN v_metrics.total_agendadas > 0 
            THEN ROUND((v_metrics.total_canceladas::DECIMAL * 100 / v_metrics.total_agendadas), 2)
            ELSE 0 END,
        CASE WHEN v_metrics.total_agendadas > 0 
            THEN ROUND((v_metrics.total_no_show::DECIMAL * 100 / v_metrics.total_agendadas), 2)
            ELSE 0 END,
        CASE WHEN v_metrics.total_agendadas > 0 
            THEN ROUND((v_metrics.total_completadas::DECIMAL * 100 / v_metrics.total_agendadas), 2)
            ELSE 0 END,
        COALESCE(v_metrics.conf_menos_5min, 0),
        COALESCE(v_metrics.conf_5_30min, 0),
        COALESCE(v_metrics.conf_30min_2h, 0),
        COALESCE(v_metrics.conf_2h_24h, 0),
        COALESCE(v_metrics.conf_mas_24h, 0),
        COALESCE(v_metrics.citas_manana, 0),
        COALESCE(v_metrics.citas_mediodia, 0),
        v_metrics.hora_pico,
        COALESCE(v_metrics.pacientes_nuevos, 0),
        COALESCE(v_metrics.pacientes_recurrentes, 0),
        COALESCE(v_metrics.pacientes_multiples, 0),
        COALESCE(v_metrics.total_recordatorios, 0),
        COALESCE(v_metrics.promedio_recordatorios, 0),
        COALESCE(v_metrics.conf_sin_recordatorio, 0),
        COALESCE(v_metrics.conf_con_recordatorio, 0),
        v_metrics.dia_semana,
        NOW()
    )
    ON CONFLICT (fecha) DO UPDATE SET
        total_agendadas = EXCLUDED.total_agendadas,
        total_confirmadas = EXCLUDED.total_confirmadas,
        total_canceladas = EXCLUDED.total_canceladas,
        total_completadas = EXCLUDED.total_completadas,
        total_no_show = EXCLUDED.total_no_show,
        tiempo_promedio_confirmacion = EXCLUDED.tiempo_promedio_confirmacion,
        tiempo_minimo_confirmacion = EXCLUDED.tiempo_minimo_confirmacion,
        tiempo_maximo_confirmacion = EXCLUDED.tiempo_maximo_confirmacion,
        tiempo_mediano_confirmacion = EXCLUDED.tiempo_mediano_confirmacion,
        tasa_confirmacion = EXCLUDED.tasa_confirmacion,
        tasa_cancelacion = EXCLUDED.tasa_cancelacion,
        tasa_no_show = EXCLUDED.tasa_no_show,
        tasa_completadas = EXCLUDED.tasa_completadas,
        confirmadas_menos_5min = EXCLUDED.confirmadas_menos_5min,
        confirmadas_5_30min = EXCLUDED.confirmadas_5_30min,
        confirmadas_30min_2h = EXCLUDED.confirmadas_30min_2h,
        confirmadas_2h_24h = EXCLUDED.confirmadas_2h_24h,
        confirmadas_mas_24h = EXCLUDED.confirmadas_mas_24h,
        citas_manana = EXCLUDED.citas_manana,
        citas_mediodia = EXCLUDED.citas_mediodia,
        hora_pico = EXCLUDED.hora_pico,
        pacientes_nuevos = EXCLUDED.pacientes_nuevos,
        pacientes_recurrentes = EXCLUDED.pacientes_recurrentes,
        pacientes_multiples_citas = EXCLUDED.pacientes_multiples_citas,
        total_recordatorios_enviados = EXCLUDED.total_recordatorios_enviados,
        promedio_recordatorios_por_cita = EXCLUDED.promedio_recordatorios_por_cita,
        citas_confirmadas_sin_recordatorio = EXCLUDED.citas_confirmadas_sin_recordatorio,
        citas_confirmadas_con_recordatorio = EXCLUDED.citas_confirmadas_con_recordatorio,
        dia_semana = EXCLUDED.dia_semana,
        updated_at = NOW();
    
    -- Retornar resumen
    SELECT json_build_object(
        'fecha', p_fecha,
        'metricas_actualizadas', true,
        'total_citas', v_metrics.total_agendadas,
        'tasa_confirmacion', CASE WHEN v_metrics.total_agendadas > 0 
            THEN ROUND((v_metrics.total_confirmadas::DECIMAL * 100 / v_metrics.total_agendadas), 2)
            ELSE 0 END
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$;

-- Function: calcular_kpis_diarios
-- Purpose: Calculates daily KPIs for WhatsApp metrics
CREATE OR REPLACE FUNCTION public.calcular_kpis_diarios()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_enviados INTEGER;
    v_total_recibidos INTEGER;
    v_total_errores INTEGER;
    v_usuarios_unicos INTEGER;
    v_imagenes_enviadas INTEGER;
    v_imagenes_recibidas INTEGER;
    v_audios_enviados INTEGER;
    v_audios_recibidos INTEGER;
    v_documentos_recibidos INTEGER;
    v_videos_recibidos INTEGER;
    v_sesiones_nuevas INTEGER;
    v_tiempo_respuesta_promedio INTERVAL;
BEGIN
    SELECT 
        COALESCE(mensajes_enviados, 0),
        COALESCE(mensajes_recibidos, 0),
        COALESCE(imagenes_enviadas, 0),
        COALESCE(imagenes_recibidas, 0),
        COALESCE(audios_enviados, 0),
        COALESCE(audios_recibidos, 0),
        COALESCE(documentos_recibidos, 0),
        COALESCE(videos_recibidos, 0)
    INTO 
        v_total_enviados,
        v_total_recibidos,
        v_imagenes_enviadas,
        v_imagenes_recibidas,
        v_audios_enviados,
        v_audios_recibidos,
        v_documentos_recibidos,
        v_videos_recibidos
    FROM evolution_metricas
    WHERE id = 1;
    
    IF v_total_enviados IS NULL THEN
        v_total_enviados := 0;
        v_total_recibidos := 0;
    END IF;
    
    SELECT COUNT(*) INTO v_total_errores
    FROM n8n_errores_whatsapp
    WHERE DATE(fecha_error) = CURRENT_DATE;
    
    SELECT COUNT(DISTINCT telefono) INTO v_usuarios_unicos
    FROM n8n_sesiones_chat
    WHERE DATE(timestamp_inicio) = CURRENT_DATE;
    
    SELECT COUNT(*) INTO v_sesiones_nuevas
    FROM n8n_sesiones_chat
    WHERE DATE(timestamp_inicio) = CURRENT_DATE;
    
    SELECT AVG(fecha_respuesta - fecha_recibido) INTO v_tiempo_respuesta_promedio
    FROM n8n_mensajes
    WHERE fecha_respuesta IS NOT NULL
      AND DATE(fecha_recibido) = CURRENT_DATE;
    
    INSERT INTO kpi_historico (
        fecha_kpi,
        tasa_entrega,
        tasa_error,
        tasa_imagenes_recibidas,
        tasa_audios_recibidos,
        tasa_imagenes_enviadas,
        tasa_audios_enviados,
        tasa_multimedia_total,
        tasa_respuesta,
        conversaciones_iniciadas_usuario,
        usuarios_unicos,
        tiempo_promedio_respuesta,
        mensajes_documentos_recibidos
    )
    VALUES (
        CURRENT_TIMESTAMP,
        CASE 
            WHEN v_total_enviados > 0 
            THEN ROUND((v_total_enviados::NUMERIC - v_total_errores) / v_total_enviados * 100, 2)::VARCHAR || '%'
            ELSE '100%'
        END,
        CASE 
            WHEN v_total_enviados > 0 
            THEN ROUND(v_total_errores::NUMERIC / v_total_enviados * 100, 2)::VARCHAR || '%'
            ELSE '0%'
        END,
        CASE 
            WHEN v_total_recibidos > 0 
            THEN ROUND(v_imagenes_recibidas::NUMERIC / v_total_recibidos * 100, 2)::VARCHAR || '%'
            ELSE '0%'
        END,
        CASE 
            WHEN v_total_recibidos > 0 
            THEN ROUND(v_audios_recibidos::NUMERIC / v_total_recibidos * 100, 2)::VARCHAR || '%'
            ELSE '0%'
        END,
        CASE 
            WHEN v_total_enviados > 0 
            THEN ROUND(v_imagenes_enviadas::NUMERIC / v_total_enviados * 100, 2)::VARCHAR || '%'
            ELSE '0%'
        END,
        CASE 
            WHEN v_total_enviados > 0 
            THEN ROUND(v_audios_enviados::NUMERIC / v_total_enviados * 100, 2)::VARCHAR || '%'
            ELSE '0%'
        END,
        CASE 
            WHEN (v_total_enviados + v_total_recibidos) > 0 
            THEN ROUND(
                (v_imagenes_enviadas + v_imagenes_recibidas + 
                 v_audios_enviados + v_audios_recibidos + 
                 v_videos_recibidos + v_documentos_recibidos)::NUMERIC / 
                (v_total_enviados + v_total_recibidos) * 100, 2
            )::VARCHAR || '%'
            ELSE '0%'
        END,
        CASE 
            WHEN v_total_recibidos > 0 
            THEN ROUND(v_total_enviados::NUMERIC / v_total_recibidos * 100, 2)::VARCHAR || '%'
            ELSE '0%'
        END,
        v_sesiones_nuevas,
        v_usuarios_unicos,
        v_tiempo_respuesta_promedio,
        v_documentos_recibidos
    );
    
    RAISE NOTICE 'KPIs calculados: Enviados=%, Recibidos=%, Usuarios=%, Errores=%', 
                 v_total_enviados, v_total_recibidos, v_usuarios_unicos, v_total_errores;
END;
$function$;

-- =============================================================================
-- 2. DASHBOARD AND ANALYTICS FUNCTIONS
-- =============================================================================

-- Function: get_dashboard_today
-- Purpose: Returns today's dashboard metrics in JSON format
CREATE OR REPLACE FUNCTION public.get_dashboard_today()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'Citas Hoy', COALESCE(total_agendadas, 0),
        'Confirmadas', COALESCE(total_confirmadas, 0),
        'Tasa Confirmación', COALESCE(ROUND(tasa_confirmacion, 1), 0) || '%',
        'No Shows', COALESCE(total_no_show, 0),
        'Tasa No-Show', COALESCE(ROUND(tasa_no_show, 1), 0) || '%',
        'Tiempo Promedio', CASE 
            WHEN tiempo_promedio_confirmacion IS NOT NULL 
            THEN ROUND(EXTRACT(EPOCH FROM tiempo_promedio_confirmacion)/60, 0) || ' min'
            ELSE 'N/A'
        END,
        'Hora Pico', COALESCE(hora_pico, 'N/A'),
        'Estado General', COALESCE(estado_confirmaciones, 'Sin datos'),
        'last_updated', NOW()
    ) INTO v_result
    FROM v_dashboard_hoy;
    
    -- Si no hay datos de hoy, retornar estructura vacía
    IF v_result IS NULL THEN
        v_result := json_build_object(
            'Citas Hoy', 0,
            'Confirmadas', 0,
            'Tasa Confirmación', '0%',
            'No Shows', 0,
            'Tasa No-Show', '0%',
            'Tiempo Promedio', 'N/A',
            'Hora Pico', 'N/A',
            'Estado General', 'Sin citas hoy',
            'last_updated', NOW()
        );
    END IF;
    
    RETURN json_build_array(v_result);
END;
$function$;

-- Function: get_weekly_metrics
-- Purpose: Returns weekly metrics for dashboard
CREATE OR REPLACE FUNCTION public.get_weekly_metrics()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'periodo', periodo,
                'rango_fechas', rango_fechas,        -- Era 'rangoFechas'
                'fecha_inicio', inicio,               -- Era 'fechaInicio'
                'fecha_fin', fin,                     -- Era 'fechaFin'
                'total_agendadas', total_agendadas,  -- Era 'totalAgendadas'
                'confirmadas', confirmadas,
                'pendientes', pendientes,
                'no_shows', no_shows,                -- Era 'noShows'
                'canceladas', canceladas,
                'completadas', completadas,
                'tasa_confirmacion', tasa_confirmacion,  -- Era 'tasaConfirmacion'
                'icono', icono,
                'orden', orden,
                'estado_semana', CASE                    -- Era 'estadoSemana'
                    WHEN orden = -1 THEN 'pasada'
                    WHEN orden = 0 THEN 'actual'
                    ELSE 'futura'
                END
            ) ORDER BY orden
        )
        FROM v_metricas_semanales
    );
END;
$function$;

-- Function: get_trends_data
-- Purpose: Returns trend data for analytics charts
CREATE OR REPLACE FUNCTION public.get_trends_data(days_back integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'fecha', fecha,
                    'date', fecha::text, -- Para compatibilidad
                    'day', TO_CHAR(fecha, 'DD/MM'),
                    'scheduled', COALESCE(total_agendadas, 0),
                    'confirmed', COALESCE(total_confirmadas, 0),
                    'noShows', COALESCE(total_no_show, 0),
                    'confirmationRate', COALESCE(ROUND(tasa_confirmacion, 1), 0),
                    'noShowRate', COALESCE(ROUND(tasa_no_show, 1), 0)
                ) ORDER BY fecha
            )
            FROM appointment_analytics
            WHERE fecha >= CURRENT_DATE - INTERVAL '1 day' * days_back
            AND fecha <= CURRENT_DATE
        ),
        '[]'::json
    );
END;
$function$;

-- =============================================================================
-- 3. APPOINTMENT MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function: confirmar_cita
-- Purpose: Confirms appointments for a given phone number
CREATE OR REPLACE FUNCTION public.confirmar_cita(p_telefono text)
 RETURNS TABLE(citas_confirmadas integer, mensaje text)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Function: registrar_cita
-- Purpose: Registers or updates an appointment
CREATE OR REPLACE FUNCTION public.registrar_cita(p_google_event_id text, p_paciente text, p_telefono text, p_fecha_cita timestamp with time zone, p_estado text DEFAULT 'pendiente_confirmacion'::text)
 RETURNS TABLE(id text, paciente text, estado text, fecha_cita timestamp with time zone, accion text)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Function: detectar_no_shows
-- Purpose: Detects and marks no-show appointments
CREATE OR REPLACE FUNCTION public.detectar_no_shows()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_no_shows_detectados INTEGER;
    v_result JSON;
BEGIN
    -- Crear tabla temporal
    CREATE TEMP TABLE IF NOT EXISTS temp_no_shows (
        google_event_id TEXT,
        paciente TEXT,
        fecha_original TIMESTAMPTZ,
        estado_anterior TEXT
    );
    
    TRUNCATE temp_no_shows;
    
    -- Detectar no-shows
    INSERT INTO temp_no_shows
    SELECT 
        google_event_id,
        paciente,
        fecha_original,
        estado
    FROM appointments
    WHERE 
        estado = 'pendiente_confirmacion'
        AND fecha_original < NOW()
        AND fecha_original >= NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS v_no_shows_detectados = ROW_COUNT;
    
    -- Actualizar estados
    UPDATE appointments
    SET 
        estado = 'no_show',
        updated_at = NOW(),
        observaciones = COALESCE(observaciones, '') || 
            E'\\n[' || TO_CHAR(NOW(), 'DD/MM HH24:MI') || '] Marcado como no-show'
    WHERE google_event_id IN (
        SELECT google_event_id FROM temp_no_shows
    );
    
    -- Construir JSON de resultado
    SELECT json_build_object(
        'success', true,
        'no_shows_detectados', v_no_shows_detectados,
        'timestamp', NOW(),
        'detalles', (
            SELECT json_agg(
                json_build_object(
                    'google_event_id', google_event_id,
                    'paciente', paciente,
                    'fecha_original', fecha_original
                )
            )
            FROM temp_no_shows
        )
    ) INTO v_result;
    
    DROP TABLE IF EXISTS temp_no_shows;
    
    RETURN v_result;  -- RETURN OBLIGATORIO
END;
$function$;

-- Function: registrar_recordatorio_enviado
-- Purpose: Registers sent reminders for appointments
CREATE OR REPLACE FUNCTION public.registrar_recordatorio_enviado(p_google_event_id text, p_tipo_recordatorio text DEFAULT 'recordatorio_ai'::text, p_mensaje text DEFAULT NULL::text)
 RETURNS TABLE(recordatorio_numero integer, mensaje text, primera_notificacion boolean)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_count INT;
    v_fecha_actual TIMESTAMP;
    v_es_primero BOOLEAN;
    v_existe BOOLEAN;
BEGIN
    v_fecha_actual := NOW();
    
    -- Verificar si el appointment existe
    SELECT EXISTS(
        SELECT 1 FROM appointments 
        WHERE google_event_id = p_google_event_id
    ) INTO v_existe;
    
    IF NOT v_existe THEN
        RETURN QUERY 
        SELECT 
            0::INT,
            'Error: No se encontró appointment con ID ' || p_google_event_id,
            FALSE;
        RETURN;
    END IF;
    
    -- Contar recordatorios previos
    SELECT 
        CASE 
            WHEN fecha_notificacion IS NULL THEN 0 
            ELSE 1 
        END 
    INTO v_count
    FROM appointments 
    WHERE google_event_id = p_google_event_id;
    
    v_es_primero := (v_count = 0);
    
    -- Marcar que viene de función de recordatorio para que el trigger no duplique
    PERFORM set_config('app.source', 'recordatorio_function', true);
    
    -- Actualizar appointment
    UPDATE appointments 
    SET 
        fecha_recordatorio = v_fecha_actual,
        fecha_notificacion = CASE 
            WHEN fecha_notificacion IS NULL THEN v_fecha_actual 
            ELSE fecha_notificacion 
        END,
        tipo_recordatorio = p_tipo_recordatorio,
        observaciones = COALESCE(observaciones || E'\\n', '') || 
                       '[' || TO_CHAR(v_fecha_actual, 'DD/MM HH24:MI') || '] ' ||
                       CASE 
                           WHEN v_es_primero THEN 'Primer recordatorio'
                           ELSE 'Recordatorio adicional'
                       END || ': ' || COALESCE(p_mensaje, 'Automático')
    WHERE google_event_id = p_google_event_id;
    
    -- Resetear la marca
    PERFORM set_config('app.source', '', true);
    
    -- Si el appointment ya estaba confirmado, calcular tiempo
    IF v_es_primero THEN
        UPDATE appointments
        SET tiempo_hasta_confirmacion = 
            CASE 
                WHEN estado = 'confirmado' 
                THEN updated_at - v_fecha_actual
                ELSE NULL
            END
        WHERE google_event_id = p_google_event_id;
    END IF;
    
    -- Devolver resultado
    RETURN QUERY 
    SELECT 
        (v_count + 1)::INT,
        ('Recordatorio #' || (v_count + 1)::TEXT || ' registrado exitosamente para ' || p_google_event_id)::TEXT,
        v_es_primero;
END;
$function$;

-- Function: marcar_cita_completada
-- Purpose: Marks an appointment as completed
CREATE OR REPLACE FUNCTION public.marcar_cita_completada(p_google_event_id text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_result JSON;
BEGIN
    UPDATE appointments
    SET 
        estado = 'completado',
        updated_at = NOW()
    WHERE 
        google_event_id = p_google_event_id
        AND estado = 'confirmado'
        AND fecha_original < NOW();
    
    IF FOUND THEN
        v_result := json_build_object(
            'exito', true,
            'mensaje', 'Cita marcada como completada'
        );
    ELSE
        v_result := json_build_object(
            'exito', false,
            'mensaje', 'No se pudo actualizar la cita'
        );
    END IF;
    
    RETURN v_result;
END;
$function$;

-- Function: reagendar_cita
-- Purpose: Reschedules an appointment
CREATE OR REPLACE FUNCTION public.reagendar_cita(p_google_event_id text, p_nueva_fecha timestamp with time zone, p_nuevo_event_id text DEFAULT NULL::text)
 RETURNS TABLE(mensaje text, nuevo_id text, nueva_fecha timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Function: obtener_timeline_cita
-- Purpose: Gets the timeline events for an appointment
CREATE OR REPLACE FUNCTION public.obtener_timeline_cita(p_google_event_id text)
 RETURNS TABLE(evento text, fecha timestamp without time zone, descripcion text, tiempo_transcurrido text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        evento_tipo,
        fecha_evento,
        appointment_timeline.descripcion,
        CASE 
            WHEN fecha_evento > NOW() - INTERVAL '1 hour' THEN 
                'Hace ' || EXTRACT(MINUTE FROM (NOW() - fecha_evento)) || ' minutos'
            WHEN fecha_evento > NOW() - INTERVAL '24 hours' THEN 
                'Hace ' || EXTRACT(HOUR FROM (NOW() - fecha_evento)) || ' horas'
            ELSE 
                TO_CHAR(fecha_evento, 'DD/MM/YYYY HH24:MI')
        END as tiempo
    FROM appointment_timeline
    WHERE google_event_id = p_google_event_id
    ORDER BY fecha_evento DESC;
END;
$function$;

-- =============================================================================
-- 4. WHATSAPP PROCESSING FUNCTIONS
-- =============================================================================

-- Function: procesar_metrica_whatsapp
-- Purpose: Processes WhatsApp metrics and session management
CREATE OR REPLACE FUNCTION public.procesar_metrica_whatsapp(p_imagenes integer, p_audios integer, p_documentos integer, p_videos integer, p_stickers integer, p_mensajes integer, p_abiertos integer, p_optout integer, p_unicos integer, p_numero character varying, p_timestamp timestamp without time zone, p_message_id character varying, p_nombre_paciente character varying)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_es_chat_nuevo BOOLEAN;
  v_ultima_sesion TIMESTAMP;
  v_session_id UUID;
BEGIN
  -- 1. Verificar si es un chat nuevo (>24 horas)
  SELECT MAX(created_at) INTO v_ultima_sesion
  FROM n8n_historico_mensagens
  WHERE message->>'telefono' = p_numero;
  
  v_es_chat_nuevo := (v_ultima_sesion IS NULL OR 
                      p_timestamp - v_ultima_sesion > INTERVAL '24 hours');
  
  -- 2. Actualizar métricas acumuladas
  INSERT INTO evolution_metricas (
    id, imagenes_recibidas, audios_recibidos, 
    documentos_recibidos, videos_recibidos, stickers_recibidos, 
    mensajes_recibidos, mensajes_abiertos, usuarios_optout, 
    usuarios_unicos, total_chats
  )
  VALUES (
    1, p_imagenes, p_audios, p_documentos, p_videos, p_stickers, 
    p_mensajes, p_abiertos, p_optout, p_unicos, 
    CASE WHEN v_es_chat_nuevo THEN 1 ELSE 0 END
  )
  ON CONFLICT (id) DO UPDATE SET
    imagenes_recibidas = evolution_metricas.imagenes_recibidas + EXCLUDED.imagenes_recibidas,
    audios_recibidos = evolution_metricas.audios_recibidos + EXCLUDED.audios_recibidos,
    documentos_recibidos = evolution_metricas.documentos_recibidos + EXCLUDED.documentos_recibidos,
    videos_recibidos = evolution_metricas.videos_recibidos + EXCLUDED.videos_recibidos,
    stickers_recibidos = evolution_metricas.stickers_recibidos + EXCLUDED.stickers_recibidos,
    mensajes_recibidos = evolution_metricas.mensajes_recibidos + EXCLUDED.mensajes_recibidos,
    mensajes_abiertos = evolution_metricas.mensajes_abiertos + EXCLUDED.mensajes_abiertos,
    usuarios_optout = evolution_metricas.usuarios_optout + EXCLUDED.usuarios_optout,
    usuarios_unicos = evolution_metricas.usuarios_unicos + EXCLUDED.usuarios_unicos,
    total_chats = evolution_metricas.total_chats + EXCLUDED.total_chats;
  
  -- 3. Gestionar sesiones de chat
  IF v_es_chat_nuevo THEN
    -- Cerrar sesión anterior si existe
    UPDATE n8n_sesiones_chat 
    SET timestamp_fin = v_ultima_sesion,
        duracion_sesion = v_ultima_sesion - timestamp_inicio
    WHERE telefono = p_numero 
      AND timestamp_fin IS NULL;
    
    -- Crear nueva sesión
    v_session_id := gen_random_uuid();
    INSERT INTO n8n_sesiones_chat (
      session_id,
      timestamp_inicio,
      telefono,
      nombre_usuario,
      canal_comunicacion,
      total_mensajes
    )
    VALUES (
      v_session_id,
      p_timestamp,
      p_numero,
      p_nombre_paciente,
      'whatsapp',
      1
    );
  ELSE
    -- Obtener session_id activo
    SELECT session_id INTO v_session_id
    FROM n8n_sesiones_chat
    WHERE telefono = p_numero 
      AND timestamp_fin IS NULL
    ORDER BY timestamp_inicio DESC
    LIMIT 1;
    
    -- Si no hay sesión activa, crear una nueva
    IF v_session_id IS NULL THEN
      v_session_id := gen_random_uuid();
      INSERT INTO n8n_sesiones_chat (
        session_id,
        timestamp_inicio,
        telefono,
        nombre_usuario,
        canal_comunicacion,
        total_mensajes
      )
      VALUES (
        v_session_id,
        p_timestamp,
        p_numero,
        p_nombre_paciente,
        'whatsapp',
        1
      );
    ELSE
      -- Incrementar contador de mensajes
      UPDATE n8n_sesiones_chat 
      SET total_mensajes = COALESCE(total_mensajes, 0) + 1
      WHERE session_id = v_session_id;
    END IF;
  END IF;
  
  -- 4. Registrar mensaje en histórico con estructura JSONB
  INSERT INTO n8n_historico_mensagens (
    session_id,
    message,
    created_at
  )
  VALUES (
    v_session_id::VARCHAR,
    jsonb_build_object(
      'telefono', p_numero,
      'nombre_usuario', p_nombre_paciente,
      'tipo_mensaje', CASE 
        WHEN p_imagenes > 0 THEN 'imagen'
        WHEN p_audios > 0 THEN 'audio'
        WHEN p_videos > 0 THEN 'video'
        WHEN p_documentos > 0 THEN 'documento'
        WHEN p_stickers > 0 THEN 'sticker'
        ELSE 'texto'
      END,
      'message_id', p_message_id,
      'es_chat_nuevo', v_es_chat_nuevo,
      'timestamp', p_timestamp
    ),
    p_timestamp
  );
  
  -- 5. Registrar/actualizar usuario único (CORREGIDO)
  INSERT INTO n8n_usuarios_unicos (numero, nombre_paciente)
  VALUES (p_numero, p_nombre_paciente)
  ON CONFLICT (numero) DO UPDATE
  SET nombre_paciente = CASE 
    WHEN n8n_usuarios_unicos.nombre_paciente IS NULL 
      OR BTRIM(n8n_usuarios_unicos.nombre_paciente) = ''
      OR LOWER(n8n_usuarios_unicos.nombre_paciente) = 'desconocido'
    THEN EXCLUDED.nombre_paciente
    ELSE n8n_usuarios_unicos.nombre_paciente
  END;

END;
$function$;

-- Function: procesar_error_whatsapp
-- Purpose: Processes WhatsApp errors with retry logic
CREATE OR REPLACE FUNCTION public.procesar_error_whatsapp(p_telefono character varying, p_nombre character varying, p_mensaje text, p_error text, p_event_id character varying DEFAULT NULL::character varying)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_error_id INTEGER;
    v_intentos INTEGER;
    v_max_intentos INTEGER := 3;
BEGIN
    -- Verificar si ya existe un error pendiente para este mensaje
    SELECT id, intentos INTO v_error_id, v_intentos
    FROM n8n_errores_whatsapp
    WHERE telefono = p_telefono 
      AND mensaje_pendiente = p_mensaje
      AND estado = 'pendiente'
    ORDER BY fecha_error DESC
    LIMIT 1;
    
    IF v_error_id IS NOT NULL THEN
        -- Actualizar error existente
        UPDATE n8n_errores_whatsapp
        SET 
            intentos = v_intentos + 1,
            ultimo_intento = CURRENT_TIMESTAMP,
            error_message = p_error,
            updated_at = CURRENT_TIMESTAMP,
            estado = CASE 
                WHEN v_intentos + 1 >= v_max_intentos THEN 'fallido'
                ELSE 'pendiente'
            END,
            observaciones = CONCAT(
                COALESCE(observaciones, ''),
                E'\\n',
                TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS'),
                ' - Intento ',
                (v_intentos + 1)::TEXT,
                ': ',
                p_error
            )
        WHERE id = v_error_id;
        
        RAISE NOTICE 'Error actualizado. ID: %, Intentos: %', v_error_id, v_intentos + 1;
    ELSE
        -- Insertar nuevo error
        INSERT INTO n8n_errores_whatsapp (
            telefono, 
            nombre_paciente, 
            mensaje_pendiente, 
            error_message, 
            event_id, 
            intentos,
            estado,
            fecha_error,
            observaciones
        )
        VALUES (
            p_telefono, 
            p_nombre, 
            p_mensaje, 
            p_error, 
            p_event_id, 
            1,
            'pendiente',
            CURRENT_TIMESTAMP,
            TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') || ' - Intento 1: ' || p_error
        )
        RETURNING id INTO v_error_id;
        
        RAISE NOTICE 'Nuevo error registrado. ID: %', v_error_id;
    END IF;
    
    -- Si supera el máximo de intentos, archivar en histórico
    IF v_intentos + 1 >= v_max_intentos THEN
        -- Verificar si existe la tabla histórico
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_name = 'n8n_errores_whatsapp_historico') THEN
            INSERT INTO n8n_errores_whatsapp_historico
            SELECT *, CURRENT_TIMESTAMP as archived_at 
            FROM n8n_errores_whatsapp 
            WHERE id = v_error_id;
            
            RAISE NOTICE 'Error archivado en histórico después de % intentos', v_max_intentos;
        END IF;
    END IF;
    
    RETURN v_error_id;
END;
$function$;

-- =============================================================================
-- 5. ALERT AND MONITORING FUNCTIONS
-- =============================================================================

-- Function: generar_alertas
-- Purpose: Generates system alerts based on metrics
CREATE OR REPLACE FUNCTION public.generar_alertas()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_alertas JSON[];
    v_alerta JSON;
BEGIN
    -- Alerta de alta tasa de no-show
    IF EXISTS (
        SELECT 1 FROM appointment_analytics
        WHERE fecha = CURRENT_DATE
        AND tasa_no_show > 30
        AND total_agendadas > 5
    ) THEN
        v_alerta := json_build_object(
            'tipo', 'warning',
            'prioridad', 'alta',
            'mensaje', 'Alta tasa de no-show hoy',
            'valor', (SELECT tasa_no_show FROM appointment_analytics WHERE fecha = CURRENT_DATE),
            'objetivo', '≤ 20%',
            'accion', 'Revisar proceso de confirmación y recordatorios',
            'timestamp', NOW()
        );
        v_alertas := array_append(v_alertas, v_alerta);
    END IF;
    
    -- Alerta de baja confirmación
    IF EXISTS (
        SELECT 1 FROM appointment_analytics
        WHERE fecha = CURRENT_DATE
        AND tasa_confirmacion < 50
        AND total_agendadas > 5
    ) THEN
        v_alerta := json_build_object(
            'tipo', 'danger',
            'prioridad', 'critica',
            'mensaje', 'Tasa de confirmación muy baja',
            'valor', (SELECT tasa_confirmacion FROM appointment_analytics WHERE fecha = CURRENT_DATE),
            'objetivo', '≥ 70%',
            'accion', 'Aumentar frecuencia de recordatorios',
            'timestamp', NOW()
        );
        v_alertas := array_append(v_alertas, v_alerta);
    END IF;
    
    -- Alerta de pacientes problemáticos
    IF EXISTS (
        SELECT 1 FROM v_pacientes_problematicos
        WHERE total_no_shows >= 3
    ) THEN
        v_alerta := json_build_object(
            'tipo', 'info',
            'prioridad', 'media',
            'mensaje', 'Pacientes con múltiples no-shows detectados',
            'cantidad', (SELECT COUNT(*) FROM v_pacientes_problematicos WHERE total_no_shows >= 3),
            'accion', 'Considerar restricciones o confirmación obligatoria',
            'timestamp', NOW()
        );
        v_alertas := array_append(v_alertas, v_alerta);
    END IF;
    
    -- Alerta de tendencia negativa
    WITH tendencia_semana AS (
        SELECT 
            AVG(tasa_confirmacion) as promedio_actual,
            LAG(AVG(tasa_confirmacion)) OVER (ORDER BY DATE_TRUNC('week', fecha)) as promedio_anterior
        FROM appointment_analytics
        WHERE fecha >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY DATE_TRUNC('week', fecha)
        ORDER BY DATE_TRUNC('week', fecha) DESC
        LIMIT 1
    )
    SELECT promedio_actual, promedio_anterior INTO v_alerta
    FROM tendencia_semana;
    
    IF v_alerta->>'promedio_actual' IS NOT NULL AND v_alerta->>'promedio_anterior' IS NOT NULL THEN
        IF (v_alerta->>'promedio_actual')::DECIMAL < (v_alerta->>'promedio_anterior')::DECIMAL - 10 THEN
            v_alerta := json_build_object(
                'tipo', 'warning',
                'prioridad', 'alta',
                'mensaje', 'Tendencia negativa en confirmaciones',
                'diferencia', ROUND((v_alerta->>'promedio_anterior')::DECIMAL - (v_alerta->>'promedio_actual')::DECIMAL, 1),
                'accion', 'Analizar causas de la disminución',
                'timestamp', NOW()
            );
            v_alertas := array_append(v_alertas, v_alerta);
        END IF;
    END IF;
    
    RETURN json_build_object(
        'fecha', NOW(),
        'alertas', COALESCE(v_alertas, ARRAY[]::JSON[]),
        'total_alertas', COALESCE(array_length(v_alertas, 1), 0),
        'hay_alertas_criticas', EXISTS(
            SELECT 1 FROM unnest(COALESCE(v_alertas, ARRAY[]::JSON[])) AS alerta 
            WHERE alerta->>'prioridad' = 'critica'
        )
    );
END;
$function$;

-- Function: get_alerts
-- Purpose: Wrapper function to get alerts
CREATE OR REPLACE FUNCTION public.get_alerts()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_alertas JSON;
BEGIN
    -- Usar la función generar_alertas() que ya tienes
    SELECT generar_alertas() INTO v_alertas;
    RETURN v_alertas;
END;
$function$;

-- =============================================================================
-- 6. MAINTENANCE AND JOB FUNCTIONS
-- =============================================================================

-- Function: job_proceso_nocturno
-- Purpose: Nightly maintenance job
CREATE OR REPLACE FUNCTION public.job_proceso_nocturno()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_resultado JSON;
    v_no_shows JSON;
    v_metricas_hoy JSON;
    v_metricas_ayer JSON;
    v_citas_completadas INTEGER;
BEGIN
    -- 1. Detectar no-shows
    SELECT detectar_no_shows() INTO v_no_shows;
    
    -- 2. Actualizar métricas de hoy
    SELECT actualizar_metricas_dia(CURRENT_DATE) INTO v_metricas_hoy;
    
    -- 3. Actualizar métricas de ayer (CORREGIDO: usar DATE())
    SELECT actualizar_metricas_dia(DATE(CURRENT_DATE - INTERVAL '1 day')) INTO v_metricas_ayer;
    
    -- 4. Marcar citas completadas (confirmadas y pasadas)
    UPDATE appointments
    SET estado = 'completado'
    WHERE 
        estado = 'confirmado'
        AND fecha_original < CURRENT_DATE
        AND fecha_original > CURRENT_DATE - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_citas_completadas = ROW_COUNT;
    
    -- 5. Limpiar timeline antiguo (opcional, mantener solo 6 meses)
    DELETE FROM appointment_timeline 
    WHERE fecha_evento < NOW() - INTERVAL '6 months'
    AND evento_tipo NOT IN ('cita_creada', 'cita_cancelada', 'cita_completada', 'no_show');
    
    v_resultado := json_build_object(
        'proceso', 'job_nocturno',
        'fecha', NOW(),
        'resultados', json_build_object(
            'no_shows_detectados', v_no_shows,
            'metricas_actualizadas', json_build_array(v_metricas_hoy, v_metricas_ayer),
            'citas_completadas', v_citas_completadas
        ),
        'exito', true
    );
    
    RETURN v_resultado;
END;
$function$;

-- Function: limpiar_datos_antiguos
-- Purpose: Cleans old data from the system
CREATE OR REPLACE FUNCTION public.limpiar_datos_antiguos(p_dias_errores integer DEFAULT 30, p_dias_kpi integer DEFAULT 7, p_dias_logs integer DEFAULT 90)
 RETURNS TABLE(errores_movidos integer, kpis_eliminados integer, logs_eliminados integer, mensaje text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_errores_movidos INTEGER := 0;
    v_kpis_eliminados INTEGER := 0;
    v_logs_eliminados INTEGER := 0;
    v_mensaje TEXT;
BEGIN
    -- Mover errores antiguos al histórico
    BEGIN
        WITH moved AS (
            DELETE FROM n8n_errores_whatsapp 
            WHERE estado IN ('enviado_reintento', 'fallido')
              AND fecha_error < CURRENT_DATE - (p_dias_errores || ' days')::INTERVAL
            RETURNING *
        )
        INSERT INTO n8n_errores_whatsapp_historico
        SELECT 
            m.*,
            CASE 
                WHEN m.id_original IS NULL THEN m.id 
                ELSE m.id_original 
            END as id_original_final,
            CURRENT_TIMESTAMP as fecha_archivado_final,
            'Limpieza automática después de ' || p_dias_errores || ' días' as motivo_archivado_final
        FROM moved m;
        
        GET DIAGNOSTICS v_errores_movidos = ROW_COUNT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Si hay error, intentar inserción columna por columna
        WITH moved AS (
            DELETE FROM n8n_errores_whatsapp 
            WHERE estado IN ('enviado_reintento', 'fallido')
              AND fecha_error < CURRENT_DATE - (p_dias_errores || ' days')::INTERVAL
            RETURNING *
        )
        INSERT INTO n8n_errores_whatsapp_historico (
            id, workflow_id, mensaje_id, tipo_error, mensaje_error,
            codigo_error, fecha_error, estado, intentos, metadata,
            fecha_actualizacion, resuelto_timestamp, resuelto_por,
            notas_resolucion, prioridad, fecha_cita, 
            mensaje_pendiente, event_id, tipo_notificacion, created_at,
            id_original, fecha_archivado, motivo_archivado
        )
        SELECT 
            id, workflow_id, mensaje_id, tipo_error, mensaje_error,
            codigo_error, fecha_error, estado, intentos, metadata,
            fecha_actualizacion, resuelto_timestamp, resuelto_por,
            notas_resolucion, prioridad, fecha_cita,
            mensaje_pendiente, event_id, tipo_notificacion, 
            COALESCE(created_at, CURRENT_TIMESTAMP),
            id as id_original,
            CURRENT_TIMESTAMP as fecha_archivado,
            'Limpieza automática después de ' || p_dias_errores || ' días'
        FROM moved;
        
        GET DIAGNOSTICS v_errores_movidos = ROW_COUNT;
    END;
    
    -- Eliminar KPIs antiguos
    DELETE FROM kpi_historico 
    WHERE fecha_kpi < CURRENT_DATE - (p_dias_kpi || ' days')::INTERVAL;
    GET DIAGNOSTICS v_kpis_eliminados = ROW_COUNT;
    
    -- Eliminar logs antiguos
    DELETE FROM n8n_logs_procesamiento 
    WHERE timestamp < CURRENT_DATE - (p_dias_logs || ' days')::INTERVAL;
    GET DIAGNOSTICS v_logs_eliminados = ROW_COUNT;
    
    -- Construir mensaje de resumen
    v_mensaje := format('Limpieza completada: %s errores archivados, %s KPIs eliminados, %s logs eliminados',
                       v_errores_movidos, v_kpis_eliminados, v_logs_eliminados);
    
    RETURN QUERY SELECT v_errores_movidos, v_kpis_eliminados, v_logs_eliminados, v_mensaje;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en limpieza: %', SQLERRM;
    RETURN QUERY SELECT 0, 0, 0, 'Error: ' || SQLERRM;
END;
$function$;

-- =============================================================================
-- 7. TRIGGER FUNCTIONS
-- =============================================================================

-- Function: update_modified_column
-- Purpose: Updates the updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$function$;

-- Function: calcular_tiempo_confirmacion
-- Purpose: Calculates confirmation time when appointment is confirmed
CREATE OR REPLACE FUNCTION public.calcular_tiempo_confirmacion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'confirmado' AND NEW.fecha_notificacion IS NOT NULL THEN
        NEW.tiempo_hasta_confirmacion := NEW.updated_at - NEW.fecha_notificacion;
    END IF;
    RETURN NEW;
END;
$function$;

-- Function: registrar_evento_timeline
-- Purpose: Registers significant events in appointment timeline
CREATE OR REPLACE FUNCTION public.registrar_evento_timeline()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_evento_tipo TEXT;
    v_metadata JSONB;
    v_descripcion TEXT;
    v_usuario TEXT;
BEGIN
    -- Si el cambio viene de la función de recordatorio, no hacer nada
    IF current_setting('app.source', true) = 'recordatorio_function' THEN
        RETURN NEW;
    END IF;
    
    -- Obtener usuario actual o usar 'sistema'
    v_usuario := COALESCE(current_setting('app.current_user', true), 'sistema');
    
    -- Solo procesar cambios significativos
    IF TG_OP = 'INSERT' THEN
        v_evento_tipo := 'cita_creada';
        v_metadata := jsonb_build_object('accion', 'INSERT', 'datos', to_jsonb(NEW));
        v_descripcion := 'Cita creada para ' || NEW.paciente;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo registrar si hay cambios importantes
        IF OLD.estado IS DISTINCT FROM NEW.estado THEN
            CASE NEW.estado
                WHEN 'confirmado' THEN 
                    v_evento_tipo := 'cita_confirmada';
                    v_descripcion := 'Cita confirmada - ' || NEW.paciente;
                WHEN 'cancelado' THEN 
                    v_evento_tipo := 'cita_cancelada';
                    v_descripcion := 'Cita cancelada - ' || NEW.paciente;
                WHEN 'completado' THEN 
                    v_evento_tipo := 'cita_completada';
                    v_descripcion := 'Cita completada - ' || NEW.paciente;
                WHEN 'no_show' THEN 
                    v_evento_tipo := 'no_show';
                    v_descripcion := 'Paciente no asistió - ' || NEW.paciente;
                ELSE 
                    RETURN NEW; -- No registrar otros cambios de estado
            END CASE;
            
        ELSIF OLD.fecha_original IS DISTINCT FROM NEW.fecha_original THEN
            v_evento_tipo := 'cita_reagendada';
            v_descripcion := 'Cita reagendada - ' || NEW.paciente;
            
        -- NO registrar cambios en fecha_recordatorio o fecha_notificacion
        ELSIF OLD.fecha_notificacion IS DISTINCT FROM NEW.fecha_notificacion 
           OR OLD.fecha_recordatorio IS DISTINCT FROM NEW.fecha_recordatorio THEN
            RETURN NEW; -- Salir sin registrar
            
        ELSE
            -- Solo registrar si cambian campos importantes
            IF OLD.paciente IS DISTINCT FROM NEW.paciente 
            OR OLD.telefono IS DISTINCT FROM NEW.telefono THEN
                v_evento_tipo := 'cita_modificada';
                v_descripcion := 'Datos importantes actualizados - ' || NEW.paciente;
            ELSE
                RETURN NEW; -- No registrar cambios menores
            END IF;
        END IF;
        
        -- Construir metadata solo para cambios importantes
        v_metadata := jsonb_build_object(
            'accion', 'UPDATE',
            'campo_principal_modificado', 
            CASE 
                WHEN OLD.estado IS DISTINCT FROM NEW.estado THEN 'estado'
                WHEN OLD.fecha_original IS DISTINCT FROM NEW.fecha_original THEN 'fecha'
                WHEN OLD.paciente IS DISTINCT FROM NEW.paciente THEN 'paciente'
                ELSE 'otros'
            END,
            'valor_anterior', 
            CASE 
                WHEN OLD.estado IS DISTINCT FROM NEW.estado THEN OLD.estado
                WHEN OLD.fecha_original IS DISTINCT FROM NEW.fecha_original THEN OLD.fecha_original::text
                WHEN OLD.paciente IS DISTINCT FROM NEW.paciente THEN OLD.paciente
                ELSE NULL
            END,
            'valor_nuevo',
            CASE 
                WHEN OLD.estado IS DISTINCT FROM NEW.estado THEN NEW.estado
                WHEN OLD.fecha_original IS DISTINCT FROM NEW.fecha_original THEN NEW.fecha_original::text
                WHEN OLD.paciente IS DISTINCT FROM NEW.paciente THEN NEW.paciente
                ELSE NULL
            END
        );
    END IF;
    
    -- Insertar en timeline solo si tenemos un evento válido
    IF v_evento_tipo IS NOT NULL THEN
        INSERT INTO appointment_timeline (
            google_event_id,
            evento_tipo,
            fecha_evento,
            usuario_origen,
            metadata,
            descripcion
        ) VALUES (
            COALESCE(NEW.google_event_id, OLD.google_event_id),
            v_evento_tipo,
            NOW(),
            v_usuario,
            v_metadata,
            v_descripcion
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Function: handle_new_user
-- Purpose: Creates user profile when new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$function$;

-- =============================================================================
-- 8. UTILITY FUNCTIONS
-- =============================================================================

-- Function: mask_phone_number
-- Purpose: Masks phone numbers for privacy
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone_number text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT CASE 
    WHEN phone_number IS NULL THEN NULL
    WHEN LENGTH(phone_number) >= 10 THEN 
      SUBSTRING(phone_number FROM 1 FOR 3) || '***' || SUBSTRING(phone_number FROM LENGTH(phone_number) - 1)
    ELSE '***'
  END;
$function$;

-- =============================================================================
-- COMMIT TRANSACTION
-- =============================================================================

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================
/*
IMPORTANT POST-MIGRATION STEPS:

1. VERIFY DEPENDENCIES:
   - Ensure all referenced tables exist (appointments, appointment_analytics, etc.)
   - Ensure all custom types exist (app_role, dashboard_type, etc.)
   - Ensure all views exist (v_dashboard_hoy, v_metricas_semanales, etc.)

2. SET UP TRIGGERS:
   After creating the functions, you need to create the actual triggers:
   
   -- Update timestamp trigger
   CREATE TRIGGER update_appointments_modified_time
       BEFORE UPDATE ON appointments
       FOR EACH ROW
       EXECUTE FUNCTION update_modified_column();
   
   -- Timeline tracking trigger
   CREATE TRIGGER appointments_timeline_trigger
       AFTER INSERT OR UPDATE ON appointments
       FOR EACH ROW
       EXECUTE FUNCTION registrar_evento_timeline();
   
   -- Confirmation time calculation trigger
   CREATE TRIGGER appointments_confirmation_time_trigger
       BEFORE UPDATE ON appointments
       FOR EACH ROW
       EXECUTE FUNCTION calcular_tiempo_confirmacion();

3. VERIFY PERMISSIONS:
   - Grant appropriate permissions to application users
   - Set up Row Level Security (RLS) policies if needed

4. TEST FUNCTIONS:
   - Test each function with sample data
   - Verify JSON outputs match expected format
   - Test error handling scenarios

5. SCHEDULE JOBS:
   - Set up cron jobs or pg_cron for job_proceso_nocturno()
   - Set up regular execution of calcular_kpis_diarios()
   - Set up periodic execution of limpiar_datos_antiguos()

This migration script contains ALL the custom business logic functions
from your Supabase database and should provide 100% functional equality
when deployed to your PostgreSQL database.
*/