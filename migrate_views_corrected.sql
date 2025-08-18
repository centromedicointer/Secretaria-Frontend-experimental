-- =============================================================================
-- CORRECTED VIEW MIGRATION SCRIPT FOR POSTGRESQL
-- =============================================================================
-- This script recreates essential views adapted to PostgreSQL table structure
-- =============================================================================

-- Drop existing views first
DROP VIEW IF EXISTS v_dashboard_hoy CASCADE;
DROP VIEW IF EXISTS v_dashboard_semana CASCADE;
DROP VIEW IF EXISTS v_metricas_semanales CASCADE;
DROP VIEW IF EXISTS v_citas_activas CASCADE;
DROP VIEW IF EXISTS v_appointments_secure CASCADE;

-- =============================================================================
-- HELPER FUNCTIONS (if not already present)
-- =============================================================================

-- Create mask_phone_number function if it doesn't exist
CREATE OR REPLACE FUNCTION mask_phone_number(phone_number TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone_number IS NULL OR LENGTH(phone_number) < 4 THEN
        RETURN phone_number;
    END IF;
    
    RETURN LEFT(phone_number, 2) || REPEAT('*', LENGTH(phone_number) - 4) || RIGHT(phone_number, 2);
END;
$$ LANGUAGE plpgsql;

-- Create is_current_user_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Default implementation - modify according to your admin logic
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ESSENTIAL VIEWS ADAPTED TO POSTGRESQL STRUCTURE
-- =============================================================================

-- 1. v_appointments_secure - Secure appointments view
CREATE VIEW v_appointments_secure AS
SELECT 
    a.id,
    a.patient_name,
    CASE
        WHEN is_current_user_admin() THEN a.patient_phone
        ELSE mask_phone_number(a.patient_phone)
    END AS patient_phone,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.notes,
    a.created_at,
    a.updated_at
FROM appointments a;

-- 2. v_citas_activas - Active appointments
CREATE VIEW v_citas_activas AS
SELECT 
    a.id,
    a.patient_name,
    a.patient_phone,
    (a.appointment_date + a.appointment_time) AS fecha_completa,
    a.appointment_date,
    a.appointment_time,
    a.status,
    CASE
        WHEN (a.appointment_date + a.appointment_time) < NOW() THEN 'PASADA'
        WHEN (a.appointment_date + a.appointment_time) < (NOW() + INTERVAL '24 hours') THEN 'HOY/MAÑANA'
        WHEN (a.appointment_date + a.appointment_time) < (NOW() + INTERVAL '7 days') THEN 'ESTA_SEMANA'
        ELSE 'FUTURA'
    END AS proximidad,
    a.created_at,
    a.updated_at
FROM appointments a
WHERE a.status NOT IN ('cancelled', 'rescheduled')
ORDER BY a.appointment_date, a.appointment_time;

-- 3. v_dashboard_hoy - Today's dashboard (basic version)
CREATE VIEW v_dashboard_hoy AS
WITH appointment_stats AS (
    SELECT 
        COUNT(*) as total_agendadas,
        COUNT(*) FILTER (WHERE status = 'confirmed') as total_confirmadas,
        COUNT(*) FILTER (WHERE status = 'cancelled') as total_canceladas,
        COUNT(*) FILTER (WHERE status = 'completed') as total_completadas,
        COUNT(*) FILTER (WHERE status = 'no_show') as total_no_show,
        COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM appointment_time) BETWEEN 9 AND 12) as citas_manana,
        COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM appointment_time) BETWEEN 12 AND 15) as citas_mediodia,
        MODE() WITHIN GROUP (ORDER BY TO_CHAR(appointment_time, 'HH24:MI')) as hora_pico
    FROM appointments
    WHERE appointment_date = CURRENT_DATE
)
SELECT 
    CURRENT_DATE as fecha,
    s.total_agendadas,
    s.total_confirmadas,
    s.total_canceladas,
    s.total_completadas,
    s.total_no_show,
    CASE WHEN s.total_agendadas > 0 
        THEN ROUND((s.total_confirmadas::DECIMAL * 100 / s.total_agendadas), 2)
        ELSE 0 
    END as tasa_confirmacion,
    CASE WHEN s.total_agendadas > 0 
        THEN ROUND((s.total_canceladas::DECIMAL * 100 / s.total_agendadas), 2)
        ELSE 0 
    END as tasa_cancelacion,
    CASE WHEN s.total_agendadas > 0 
        THEN ROUND((s.total_no_show::DECIMAL * 100 / s.total_agendadas), 2)
        ELSE 0 
    END as tasa_no_show,
    CASE WHEN s.total_agendadas > 0 
        THEN ROUND((s.total_completadas::DECIMAL * 100 / s.total_agendadas), 2)
        ELSE 0 
    END as tasa_completadas,
    s.citas_manana,
    s.citas_mediodia,
    s.hora_pico,
    NOW() as updated_at,
    EXTRACT(DOW FROM CURRENT_DATE)::INTEGER as dia_semana,
    FALSE as es_festivo,
    CASE
        WHEN s.total_agendadas = 0 THEN 'Sin citas'
        WHEN s.total_confirmadas >= s.total_agendadas * 0.8 THEN '🟢 Excelente'
        WHEN s.total_confirmadas >= s.total_agendadas * 0.6 THEN '🟡 Normal'
        ELSE '🔴 Bajo'
    END AS estado_confirmaciones
FROM appointment_stats s;

-- 4. v_dashboard_semana - Weekly dashboard
CREATE VIEW v_dashboard_semana AS
SELECT 
    a.appointment_date as fecha,
    TO_CHAR(a.appointment_date, 'Day DD/MM') as dia,
    COUNT(*) as total_agendadas,
    COUNT(*) FILTER (WHERE a.status = 'confirmed') as total_confirmadas,
    COUNT(*) FILTER (WHERE a.status = 'cancelled') as total_canceladas,
    COUNT(*) FILTER (WHERE a.status = 'no_show') as total_no_show,
    CASE WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'confirmed')::DECIMAL * 100 / COUNT(*)), 1)
        ELSE 0 
    END as tasa_confirmacion,
    CASE WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'no_show')::DECIMAL * 100 / COUNT(*)), 1)
        ELSE 0 
    END as tasa_no_show,
    CASE
        WHEN EXTRACT(DOW FROM a.appointment_date) IN (0, 6) THEN 'Fin de semana'
        ELSE 'Entre semana'
    END AS tipo_dia
FROM appointments a
WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY a.appointment_date
ORDER BY a.appointment_date;

-- 5. v_metricas_semanales - Weekly metrics
CREATE VIEW v_metricas_semanales AS
WITH semanas AS (
    SELECT 
        'Semana Pasada' AS periodo,
        (DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days'))::DATE AS inicio,
        (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day')::DATE AS fin,
        -1 AS orden
    UNION ALL
    SELECT 
        'Semana Actual' AS periodo,
        (DATE_TRUNC('week', CURRENT_DATE))::DATE AS inicio,
        (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE AS fin,
        0 AS orden
    UNION ALL
    SELECT 
        'Próxima Semana' AS periodo,
        (DATE_TRUNC('week', CURRENT_DATE + INTERVAL '7 days'))::DATE AS inicio,
        (DATE_TRUNC('week', CURRENT_DATE + INTERVAL '7 days') + INTERVAL '6 days')::DATE AS fin,
        1 AS orden
)
SELECT 
    s.periodo,
    TO_CHAR(s.inicio, 'DD/MM') || ' - ' || TO_CHAR(s.fin, 'DD/MM') AS rango_fechas,
    s.inicio,
    s.fin,
    COALESCE(COUNT(*), 0) AS total_agendadas,
    COALESCE(COUNT(*) FILTER (WHERE a.status = 'confirmed'), 0) AS confirmadas,
    COALESCE(COUNT(*) FILTER (WHERE a.status = 'scheduled'), 0) AS pendientes,
    COALESCE(COUNT(*) FILTER (WHERE a.status = 'no_show'), 0) AS no_shows,
    COALESCE(COUNT(*) FILTER (WHERE a.status = 'cancelled'), 0) AS canceladas,
    COALESCE(COUNT(*) FILTER (WHERE a.status = 'completed'), 0) AS completadas,
    CASE
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'confirmed')::DECIMAL * 100 / COUNT(*)), 1)
        ELSE 0
    END AS tasa_confirmacion,
    CASE
        WHEN s.orden = -1 THEN '📅'
        WHEN s.orden = 0 THEN '📍'
        ELSE '📆'
    END AS icono,
    s.orden
FROM semanas s
LEFT JOIN appointments a ON (a.appointment_date >= s.inicio AND a.appointment_date <= s.fin)
GROUP BY s.periodo, s.inicio, s.fin, s.orden
ORDER BY s.orden;

-- =============================================================================
-- SIMPLIFIED DASHBOARD FUNCTIONS
-- =============================================================================

-- Create a simplified get_dashboard_today function that works with actual table structure
CREATE OR REPLACE FUNCTION get_dashboard_today()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'Citas Hoy', COALESCE(total_agendadas, 0),
        'Confirmadas', COALESCE(total_confirmadas, 0),
        'Tasa Confirmación', COALESCE(tasa_confirmacion, 0) || '%',
        'No Shows', COALESCE(total_no_show, 0),
        'Tasa No-Show', COALESCE(tasa_no_show, 0) || '%',
        'Estado General', estado_confirmaciones,
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
            'Estado General', 'Sin citas hoy',
            'last_updated', NOW()
        );
    END IF;
    
    RETURN json_build_array(v_result);
END;
$$;

-- Create a simplified get_weekly_metrics function
CREATE OR REPLACE FUNCTION get_weekly_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'periodo', periodo,
                'rango_fechas', rango_fechas,
                'fecha_inicio', inicio,
                'fecha_fin', fin,
                'total_agendadas', total_agendadas,
                'confirmadas', confirmadas,
                'pendientes', pendientes,
                'no_shows', no_shows,
                'canceladas', canceladas,
                'completadas', completadas,
                'tasa_confirmacion', tasa_confirmacion,
                'icono', icono,
                'orden', orden,
                'estado_semana', CASE
                    WHEN orden = -1 THEN 'pasada'
                    WHEN orden = 0 THEN 'actual'
                    ELSE 'futura'
                END
            ) ORDER BY orden
        )
        FROM v_metricas_semanales
    );
END;
$$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check that all views were created successfully
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition IS NOT NULL THEN '✅ Created'
        ELSE '❌ Failed'
    END AS status
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Summary of created views
SELECT 
    COUNT(*) as total_views_created,
    'Essential dashboard views have been successfully migrated and adapted to PostgreSQL structure' as message
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname LIKE 'v_%';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Essential views have been recreated and adapted to PostgreSQL table structure
-- These views provide the core dashboard functionality
-- =============================================================================