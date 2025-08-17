-- Create a direct function to get today's dashboard metrics
CREATE OR REPLACE FUNCTION public.get_dashboard_today_direct()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
BEGIN
    WITH citas_hoy AS (
        SELECT 
            *,
            EXTRACT(HOUR FROM fecha_original AT TIME ZONE 'America/Mexico_City') as hora_cita
        FROM appointments a
        WHERE DATE(fecha_original AT TIME ZONE 'America/Mexico_City') = CURRENT_DATE
    ),
    metricas AS (
        SELECT 
            COUNT(*) as total_agendadas,
            COUNT(*) FILTER (WHERE estado = 'confirmado') as total_confirmadas,
            COUNT(*) FILTER (WHERE estado = 'no_show') as total_no_show,
            AVG(tiempo_hasta_confirmacion) as tiempo_promedio_confirmacion,
            CASE WHEN COUNT(*) > 0 
                THEN ROUND((COUNT(*) FILTER (WHERE estado = 'confirmado')::DECIMAL * 100 / COUNT(*)), 1)
                ELSE 0 END as tasa_confirmacion,
            CASE WHEN COUNT(*) > 0 
                THEN ROUND((COUNT(*) FILTER (WHERE estado = 'no_show')::DECIMAL * 100 / COUNT(*)), 1)
                ELSE 0 END as tasa_no_show,
            MODE() WITHIN GROUP (ORDER BY hora_cita || ':' || 
                CASE WHEN EXTRACT(MINUTE FROM fecha_original) = 0 THEN '00' ELSE '30' END) as hora_pico
        FROM citas_hoy
    )
    SELECT json_build_object(
        'Citas Hoy', COALESCE(m.total_agendadas, 0),
        'Confirmadas', COALESCE(m.total_confirmadas, 0),
        'Tasa Confirmación', COALESCE(m.tasa_confirmacion, 0) || '%',
        'No Shows', COALESCE(m.total_no_show, 0),
        'Tasa No-Show', COALESCE(m.tasa_no_show, 0) || '%',
        'Tiempo Promedio', CASE 
            WHEN m.tiempo_promedio_confirmacion IS NOT NULL 
            THEN ROUND(EXTRACT(EPOCH FROM m.tiempo_promedio_confirmacion)/60, 0) || ' min'
            ELSE 'N/A'
        END,
        'Hora Pico', COALESCE(m.hora_pico, 'N/A'),
        'Estado General', CASE 
            WHEN m.total_agendadas = 0 THEN 'Sin citas hoy'
            WHEN m.tasa_confirmacion >= 80 THEN '🟢 Excelente'
            WHEN m.tasa_confirmacion >= 60 THEN '🟡 Normal'
            ELSE '🔴 Bajo'
        END,
        'last_updated', NOW()
    ) INTO v_result
    FROM metricas m;
    
    RETURN json_build_array(v_result);
END;
$$;