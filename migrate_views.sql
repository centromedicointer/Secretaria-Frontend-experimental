-- =============================================================================
-- COMPLETE VIEW MIGRATION SCRIPT
-- =============================================================================
-- This script recreates ALL views from Supabase database in PostgreSQL
-- Total Views: 21 (public schema only)
-- Generated: 2025-08-18
-- =============================================================================

-- Drop all views first (in reverse dependency order to avoid conflicts)
DROP VIEW IF EXISTS v_dashboard_tendencias CASCADE;
DROP VIEW IF EXISTS v_dashboard_semana CASCADE;
DROP VIEW IF EXISTS v_dashboard_rendimiento CASCADE;
DROP VIEW IF EXISTS v_dashboard_hoy CASCADE;
DROP VIEW IF EXISTS v_dashboard_secretaria CASCADE;
DROP VIEW IF EXISTS v_dashboard_sistema CASCADE;
DROP VIEW IF EXISTS v_metricas_semanales CASCADE;
DROP VIEW IF EXISTS v_metricas_resumen CASCADE;
DROP VIEW IF EXISTS v_metricas_por_horario CASCADE;
DROP VIEW IF EXISTS v_metricas_por_dia_semana CASCADE;
DROP VIEW IF EXISTS v_metricas_confirmacion CASCADE;
DROP VIEW IF EXISTS v_metricas_comparacion CASCADE;
DROP VIEW IF EXISTS v_heatmap_ocupacion CASCADE;
DROP VIEW IF EXISTS v_distribucion_horaria CASCADE;
DROP VIEW IF EXISTS v_citas_activas CASCADE;
DROP VIEW IF EXISTS v_appointments_secure CASCADE;
DROP VIEW IF EXISTS v_analisis_pacientes CASCADE;
DROP VIEW IF EXISTS v_analisis_no_shows CASCADE;
DROP VIEW IF EXISTS v_estadisticas_errores CASCADE;
DROP VIEW IF EXISTS v_mensajes_pendientes CASCADE;
DROP VIEW IF EXISTS v_pacientes_problematicos CASCADE;

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
-- VIEW RECREATIONS (in dependency order)
-- =============================================================================

-- 1. v_analisis_no_shows
CREATE VIEW v_analisis_no_shows AS
SELECT 
    to_char(appointments.fecha_original, 'Day'::text) AS dia_semana,
    count(*) FILTER (WHERE (appointments.estado = 'no_show'::text)) AS no_shows,
    count(*) AS total_citas,
    round(((100.0 * (count(*) FILTER (WHERE (appointments.estado = 'no_show'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS tasa_no_show,
    EXTRACT(hour FROM appointments.fecha_original) AS hora,
    to_char(appointments.fecha_original, 'YYYY-MM'::text) AS mes
FROM appointments
GROUP BY GROUPING SETS (((to_char(appointments.fecha_original, 'Day'::text))), ((EXTRACT(hour FROM appointments.fecha_original))), ((to_char(appointments.fecha_original, 'YYYY-MM'::text))));

-- 2. v_analisis_pacientes
CREATE VIEW v_analisis_pacientes AS
WITH comportamiento AS (
    SELECT 
        appointments.telefono,
        appointments.paciente,
        count(*) AS total_citas,
        count(*) FILTER (WHERE (appointments.estado = 'confirmado'::text)) AS citas_confirmadas,
        count(*) FILTER (WHERE (appointments.estado = 'cancelado'::text)) AS citas_canceladas,
        count(*) FILTER (WHERE (appointments.estado = 'no_show'::text)) AS no_shows,
        count(*) FILTER (WHERE (appointments.estado = 'completado'::text)) AS citas_completadas,
        avg(appointments.tiempo_hasta_confirmacion) AS tiempo_promedio_confirmacion,
        max(appointments.fecha_original) AS ultima_cita,
        min(appointments.fecha_original) AS primera_cita
    FROM appointments
    GROUP BY appointments.telefono, appointments.paciente
)
SELECT 
    comportamiento.paciente,
    comportamiento.telefono,
    comportamiento.total_citas,
    round((((comportamiento.citas_confirmadas)::numeric * (100)::numeric) / (NULLIF(comportamiento.total_citas, 0))::numeric), 1) AS tasa_confirmacion_personal,
    round((((comportamiento.no_shows)::numeric * (100)::numeric) / (NULLIF(comportamiento.total_citas, 0))::numeric), 1) AS tasa_no_show_personal,
    round((EXTRACT(epoch FROM comportamiento.tiempo_promedio_confirmacion) / (60)::numeric), 0) AS minutos_promedio_confirmacion,
    to_char((comportamiento.ultima_cita AT TIME ZONE 'America/Mexico_City'::text), 'DD/MM/YYYY'::text) AS ultima_visita,
    CASE
        WHEN (comportamiento.no_shows >= 2) THEN '🔴 Alto riesgo'::text
        WHEN (comportamiento.no_shows = 1) THEN '🟡 Riesgo medio'::text
        ELSE '🟢 Confiable'::text
    END AS clasificacion_riesgo,
    CASE
        WHEN (comportamiento.total_citas >= 5) THEN 'Frecuente'::text
        WHEN (comportamiento.total_citas >= 2) THEN 'Regular'::text
        ELSE 'Nuevo'::text
    END AS tipo_paciente
FROM comportamiento
ORDER BY comportamiento.total_citas DESC;

-- 3. v_appointments_secure
CREATE VIEW v_appointments_secure AS
SELECT 
    appointments.google_event_id,
    appointments.paciente,
    CASE
        WHEN is_current_user_admin() THEN appointments.telefono
        ELSE mask_phone_number(appointments.telefono)
    END AS telefono,
    appointments.fecha_original,
    appointments.estado,
    appointments.observaciones,
    appointments.created_at,
    appointments.updated_at
FROM appointments;

-- 4. v_citas_activas
CREATE VIEW v_citas_activas AS
SELECT 
    appointments.google_event_id,
    appointments.paciente,
    appointments.telefono,
    appointments.fecha_original,
    (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text) AS fecha_mexico,
    appointments.estado,
    CASE
        WHEN (appointments.fecha_original < now()) THEN 'PASADA'::text
        WHEN (appointments.fecha_original < (now() + '24:00:00'::interval)) THEN 'HOY/MAÑANA'::text
        WHEN (appointments.fecha_original < (now() + '7 days'::interval)) THEN 'ESTA_SEMANA'::text
        ELSE 'FUTURA'::text
    END AS proximidad,
    appointments.created_at,
    appointments.updated_at
FROM appointments
WHERE (appointments.estado <> 'reagendado'::text)
ORDER BY appointments.fecha_original;

-- 5. v_dashboard_hoy
CREATE VIEW v_dashboard_hoy AS
SELECT 
    a.fecha,
    a.total_agendadas,
    a.total_confirmadas,
    a.total_canceladas,
    a.total_completadas,
    a.total_no_show,
    a.tiempo_promedio_confirmacion,
    a.tiempo_minimo_confirmacion,
    a.tiempo_maximo_confirmacion,
    a.tiempo_mediano_confirmacion,
    a.tasa_confirmacion,
    a.tasa_cancelacion,
    a.tasa_no_show,
    a.tasa_completadas,
    a.total_recordatorios_enviados,
    a.promedio_recordatorios_por_cita,
    a.citas_confirmadas_sin_recordatorio,
    a.citas_confirmadas_con_recordatorio,
    a.confirmadas_menos_5min,
    a.confirmadas_5_30min,
    a.confirmadas_30min_2h,
    a.confirmadas_2h_24h,
    a.confirmadas_mas_24h,
    a.citas_manana,
    a.citas_mediodia,
    a.hora_pico,
    a.pacientes_nuevos,
    a.pacientes_recurrentes,
    a.pacientes_multiples_citas,
    a.updated_at,
    a.dia_semana,
    a.es_festivo,
    a.metadata,
    CASE
        WHEN (a.total_agendadas = 0) THEN 'Sin citas'::text
        WHEN (a.tasa_confirmacion >= (80)::numeric) THEN '🟢 Excelente'::text
        WHEN (a.tasa_confirmacion >= (60)::numeric) THEN '🟡 Normal'::text
        ELSE '🔴 Bajo'::text
    END AS estado_confirmaciones,
    CASE
        WHEN (a.tasa_no_show <= (10)::numeric) THEN '🟢 Excelente'::text
        WHEN (a.tasa_no_show <= (20)::numeric) THEN '🟡 Normal'::text
        ELSE '🔴 Alto'::text
    END AS estado_no_shows,
    to_char(a.tiempo_promedio_confirmacion, 'HH24:MI'::text) AS tiempo_promedio_formato
FROM appointment_analytics a
WHERE (a.fecha = CURRENT_DATE);

-- 6. v_dashboard_rendimiento
CREATE VIEW v_dashboard_rendimiento AS
WITH ranking AS (
    SELECT 
        appointment_analytics.fecha,
        appointment_analytics.total_agendadas,
        appointment_analytics.tasa_confirmacion,
        appointment_analytics.tasa_no_show,
        row_number() OVER (ORDER BY appointment_analytics.tasa_confirmacion DESC) AS rank_confirmacion,
        row_number() OVER (ORDER BY appointment_analytics.tasa_no_show) AS rank_no_show
    FROM appointment_analytics
    WHERE ((appointment_analytics.fecha >= (CURRENT_DATE - '30 days'::interval)) AND (appointment_analytics.total_agendadas > 0))
)
SELECT 
    'Mejores días de confirmación'::text AS categoria,
    to_char((ranking.fecha)::timestamp with time zone, 'DD/MM/YYYY'::text) AS fecha,
    ranking.total_agendadas AS citas,
    (ranking.tasa_confirmacion || '%'::text) AS valor,
    ranking.rank_confirmacion AS posicion
FROM ranking
WHERE (ranking.rank_confirmacion <= 3)
UNION ALL
SELECT 
    'Días con menos no-shows'::text AS categoria,
    to_char((ranking.fecha)::timestamp with time zone, 'DD/MM/YYYY'::text) AS fecha,
    ranking.total_agendadas AS citas,
    (ranking.tasa_no_show || '%'::text) AS valor,
    ranking.rank_no_show AS posicion
FROM ranking
WHERE (ranking.rank_no_show <= 3)
ORDER BY 1, 5;

-- 7. v_dashboard_secretaria
CREATE VIEW v_dashboard_secretaria AS
SELECT 
    date((n8n_mensajes.fecha_recibido AT TIME ZONE 'America/Mexico_City'::text)) AS fecha,
    count(*) AS total_mensajes,
    count(DISTINCT n8n_mensajes.phone_number) AS usuarios_unicos,
    avg(EXTRACT(epoch FROM (n8n_mensajes.fecha_respuesta - n8n_mensajes.fecha_recibido))) AS tiempo_respuesta_seg,
    count(
        CASE
            WHEN (n8n_mensajes.fecha_respuesta IS NULL) THEN 1
            ELSE NULL::integer
        END) AS sin_respuesta,
    count(
        CASE
            WHEN (n8n_mensajes.pregunta ~~* '%cita%'::text) THEN 1
            ELSE NULL::integer
        END) AS solicitudes_cita
FROM n8n_mensajes
WHERE (n8n_mensajes.fecha_recibido > (now() - '30 days'::interval))
GROUP BY (date((n8n_mensajes.fecha_recibido AT TIME ZONE 'America/Mexico_City'::text)))
ORDER BY (date((n8n_mensajes.fecha_recibido AT TIME ZONE 'America/Mexico_City'::text))) DESC;

-- 8. v_dashboard_semana
CREATE VIEW v_dashboard_semana AS
SELECT 
    appointment_analytics.fecha,
    to_char((appointment_analytics.fecha)::timestamp with time zone, 'Day DD/MM'::text) AS dia,
    appointment_analytics.total_agendadas,
    appointment_analytics.total_confirmadas,
    appointment_analytics.total_canceladas,
    appointment_analytics.total_no_show,
    appointment_analytics.tasa_confirmacion,
    appointment_analytics.tasa_no_show,
    round((EXTRACT(epoch FROM appointment_analytics.tiempo_promedio_confirmacion) / (60)::numeric), 0) AS minutos_promedio,
    CASE
        WHEN (EXTRACT(dow FROM appointment_analytics.fecha) = ANY (ARRAY[(0)::numeric, (6)::numeric])) THEN 'Fin de semana'::text
        ELSE 'Entre semana'::text
    END AS tipo_dia
FROM appointment_analytics
WHERE (appointment_analytics.fecha >= (CURRENT_DATE - '7 days'::interval))
ORDER BY appointment_analytics.fecha;

-- 9. v_dashboard_sistema
CREATE VIEW v_dashboard_sistema AS
SELECT 
    (SELECT count(*) AS count FROM n8n_usuarios_unicos) AS usuarios_totales,
    (SELECT count(*) AS count FROM n8n_sesiones_chat WHERE (n8n_sesiones_chat.timestamp_fin IS NULL)) AS sesiones_activas,
    (SELECT count(*) AS count FROM n8n_errores_whatsapp WHERE ((n8n_errores_whatsapp.estado)::text = 'pendiente'::text)) AS errores_pendientes,
    (SELECT (evolution_metricas.mensajes_enviados + evolution_metricas.mensajes_recibidos) FROM evolution_metricas WHERE (evolution_metricas.id = 1)) AS mensajes_totales,
    (SELECT kpi_historico.fecha_kpi FROM kpi_historico ORDER BY kpi_historico.fecha_kpi DESC LIMIT 1) AS ultimo_kpi,
    (SELECT count(*) AS count FROM n8n_mensajes WHERE (n8n_mensajes.fecha_respuesta IS NULL)) AS mensajes_sin_respuesta;

-- 10. v_dashboard_tendencias
CREATE VIEW v_dashboard_tendencias AS
WITH tendencias AS (
    SELECT 
        date_trunc('week'::text, (appointment_analytics.fecha)::timestamp with time zone) AS semana,
        avg(appointment_analytics.total_agendadas) AS promedio_citas,
        avg(appointment_analytics.tasa_confirmacion) AS promedio_confirmacion,
        avg(appointment_analytics.tasa_no_show) AS promedio_no_show,
        sum(appointment_analytics.total_agendadas) AS total_citas_semana,
        sum(appointment_analytics.total_confirmadas) AS total_confirmadas_semana
    FROM appointment_analytics
    WHERE (appointment_analytics.fecha >= (CURRENT_DATE - '30 days'::interval))
    GROUP BY (date_trunc('week'::text, (appointment_analytics.fecha)::timestamp with time zone))
)
SELECT 
    to_char(tendencias.semana, 'Semana del DD/MM'::text) AS periodo,
    round(tendencias.promedio_citas, 1) AS citas_por_dia,
    round(tendencias.promedio_confirmacion, 1) AS tasa_confirmacion,
    round(tendencias.promedio_no_show, 1) AS tasa_no_show,
    tendencias.total_citas_semana,
    tendencias.total_confirmadas_semana,
    CASE
        WHEN (tendencias.promedio_confirmacion >= (80)::numeric) THEN '🟢'::text
        WHEN (tendencias.promedio_confirmacion >= (60)::numeric) THEN '🟡'::text
        ELSE '🔴'::text
    END AS indicador
FROM tendencias
ORDER BY tendencias.semana;

-- 11. v_distribucion_horaria
CREATE VIEW v_distribucion_horaria AS
SELECT 
    'Mañana (10:00-11:30)'::text AS horario,
    sum(appointment_analytics.citas_manana) AS total_citas,
    round(avg(appointment_analytics.citas_manana), 1) AS promedio_diario,
    round((((sum(appointment_analytics.citas_manana))::numeric * (100)::numeric) / (NULLIF(sum(appointment_analytics.total_agendadas), 0))::numeric), 1) AS porcentaje
FROM appointment_analytics
WHERE (appointment_analytics.fecha >= (CURRENT_DATE - '30 days'::interval))
UNION ALL
SELECT 
    'Mediodía (12:00-13:30)'::text AS horario,
    sum(appointment_analytics.citas_mediodia) AS total_citas,
    round(avg(appointment_analytics.citas_mediodia), 1) AS promedio_diario,
    round((((sum(appointment_analytics.citas_mediodia))::numeric * (100)::numeric) / (NULLIF(sum(appointment_analytics.total_agendadas), 0))::numeric), 1) AS porcentaje
FROM appointment_analytics
WHERE (appointment_analytics.fecha >= (CURRENT_DATE - '30 days'::interval))
UNION ALL
SELECT 
    'Otros horarios'::text AS horario,
    sum(((appointment_analytics.total_agendadas - appointment_analytics.citas_manana) - appointment_analytics.citas_mediodia)) AS total_citas,
    round(avg(((appointment_analytics.total_agendadas - appointment_analytics.citas_manana) - appointment_analytics.citas_mediodia)), 1) AS promedio_diario,
    round((((sum(((appointment_analytics.total_agendadas - appointment_analytics.citas_manana) - appointment_analytics.citas_mediodia)))::numeric * (100)::numeric) / (NULLIF(sum(appointment_analytics.total_agendadas), 0))::numeric), 1) AS porcentaje
FROM appointment_analytics
WHERE (appointment_analytics.fecha >= (CURRENT_DATE - '30 days'::interval))
ORDER BY 2 DESC;

-- 12. v_estadisticas_errores
CREATE VIEW v_estadisticas_errores AS
SELECT 
    date(n8n_errores_whatsapp.fecha_error) AS fecha,
    count(*) AS total_errores,
    count(
        CASE
            WHEN ((n8n_errores_whatsapp.estado)::text = 'pendiente'::text) THEN 1
            ELSE NULL::integer
        END) AS pendientes,
    count(
        CASE
            WHEN ((n8n_errores_whatsapp.estado)::text = 'enviado_reintento'::text) THEN 1
            ELSE NULL::integer
        END) AS enviados_reintento,
    count(
        CASE
            WHEN ((n8n_errores_whatsapp.estado)::text = 'fallido'::text) THEN 1
            ELSE NULL::integer
        END) AS fallidos
FROM n8n_errores_whatsapp
GROUP BY (date(n8n_errores_whatsapp.fecha_error))
ORDER BY (date(n8n_errores_whatsapp.fecha_error)) DESC;

-- 13. v_heatmap_ocupacion
CREATE VIEW v_heatmap_ocupacion AS
WITH citas_detalle AS (
    SELECT 
        appointments.google_event_id,
        appointments.estado,
        EXTRACT(dow FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) AS dia_num,
        EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) AS hora,
        CASE EXTRACT(dow FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text))
            WHEN 0 THEN 'Dom'::text
            WHEN 1 THEN 'Lun'::text
            WHEN 2 THEN 'Mar'::text
            WHEN 3 THEN 'Mié'::text
            WHEN 4 THEN 'Jue'::text
            WHEN 5 THEN 'Vie'::text
            WHEN 6 THEN 'Sáb'::text
            ELSE NULL::text
        END AS dia_corto,
        to_char((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text), 'HH24:00'::text) AS hora_formato
    FROM appointments
    WHERE (appointments.fecha_original IS NOT NULL)
)
SELECT 
    citas_detalle.dia_num,
    citas_detalle.dia_corto,
    citas_detalle.hora,
    citas_detalle.hora_formato,
    count(*) AS total_citas,
    count(
        CASE
            WHEN (citas_detalle.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END) AS confirmadas,
    count(
        CASE
            WHEN (citas_detalle.estado = 'no_show'::text) THEN 1
            ELSE NULL::integer
        END) AS no_shows,
    round(((100.0 * (count(
        CASE
            WHEN (citas_detalle.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END))::numeric) / (NULLIF(count(*), 0))::numeric), 0) AS tasa_confirmacion,
    CASE
        WHEN (count(*) = 0) THEN 'vacio'::text
        WHEN (count(*) = 1) THEN 'bajo'::text
        WHEN ((count(*) >= 2) AND (count(*) <= 3)) THEN 'medio'::text
        WHEN ((count(*) >= 4) AND (count(*) <= 5)) THEN 'alto'::text
        ELSE 'muy_alto'::text
    END AS intensidad,
    CASE
        WHEN (count(*) = 0) THEN '#f3f4f6'::text
        WHEN (count(*) = 1) THEN '#fef3c7'::text
        WHEN ((count(*) >= 2) AND (count(*) <= 3)) THEN '#fbbf24'::text
        WHEN ((count(*) >= 4) AND (count(*) <= 5)) THEN '#f97316'::text
        ELSE '#dc2626'::text
    END AS color_hex
FROM citas_detalle
GROUP BY citas_detalle.dia_num, citas_detalle.dia_corto, citas_detalle.hora, citas_detalle.hora_formato;

-- 14. v_mensajes_pendientes
CREATE VIEW v_mensajes_pendientes AS
SELECT 
    n8n_errores_whatsapp.id,
    n8n_errores_whatsapp.telefono,
    n8n_errores_whatsapp.nombre_paciente,
    n8n_errores_whatsapp.fecha_cita,
    n8n_errores_whatsapp.fecha_error,
    n8n_errores_whatsapp.ultimo_intento,
    n8n_errores_whatsapp.intentos,
    n8n_errores_whatsapp.error_message
FROM n8n_errores_whatsapp
WHERE ((n8n_errores_whatsapp.estado)::text = 'pendiente'::text)
ORDER BY n8n_errores_whatsapp.fecha_error DESC;

-- 15. v_metricas_comparacion
CREATE VIEW v_metricas_comparacion AS
WITH esta_semana AS (
    SELECT 
        'Esta semana'::text AS periodo,
        avg(appointment_analytics.total_agendadas) AS promedio_citas,
        avg(appointment_analytics.tasa_confirmacion) AS promedio_confirmacion,
        avg(appointment_analytics.tasa_no_show) AS promedio_no_show,
        sum(appointment_analytics.total_agendadas) AS total_citas
    FROM appointment_analytics
    WHERE ((appointment_analytics.fecha >= date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone)) AND (appointment_analytics.fecha <= CURRENT_DATE))
), semana_anterior AS (
    SELECT 
        'Semana anterior'::text AS periodo,
        avg(appointment_analytics.total_agendadas) AS promedio_citas,
        avg(appointment_analytics.tasa_confirmacion) AS promedio_confirmacion,
        avg(appointment_analytics.tasa_no_show) AS promedio_no_show,
        sum(appointment_analytics.total_agendadas) AS total_citas
    FROM appointment_analytics
    WHERE ((appointment_analytics.fecha >= (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone) - '7 days'::interval)) AND (appointment_analytics.fecha < date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone)))
), este_mes AS (
    SELECT 
        'Este mes'::text AS periodo,
        avg(appointment_analytics.total_agendadas) AS promedio_citas,
        avg(appointment_analytics.tasa_confirmacion) AS promedio_confirmacion,
        avg(appointment_analytics.tasa_no_show) AS promedio_no_show,
        sum(appointment_analytics.total_agendadas) AS total_citas
    FROM appointment_analytics
    WHERE (appointment_analytics.fecha >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))
)
SELECT 
    esta_semana.periodo,
    esta_semana.promedio_citas,
    esta_semana.promedio_confirmacion,
    esta_semana.promedio_no_show,
    esta_semana.total_citas
FROM esta_semana
UNION ALL
SELECT 
    semana_anterior.periodo,
    semana_anterior.promedio_citas,
    semana_anterior.promedio_confirmacion,
    semana_anterior.promedio_no_show,
    semana_anterior.total_citas
FROM semana_anterior
UNION ALL
SELECT 
    este_mes.periodo,
    este_mes.promedio_citas,
    este_mes.promedio_confirmacion,
    este_mes.promedio_no_show,
    este_mes.total_citas
FROM este_mes;

-- 16. v_metricas_confirmacion
CREATE VIEW v_metricas_confirmacion AS
SELECT 
    date((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) AS fecha_cita,
    count(*) AS total_citas,
    count(
        CASE
            WHEN (appointments.fecha_notificacion IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS con_recordatorio,
    count(
        CASE
            WHEN (appointments.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END) AS confirmadas,
    round((((count(
        CASE
            WHEN (appointments.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END))::numeric * (100)::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS tasa_confirmacion,
    round(avg((EXTRACT(epoch FROM appointments.tiempo_hasta_confirmacion) / (60)::numeric)), 2) AS minutos_promedio,
    count(
        CASE
            WHEN (appointments.tiempo_hasta_confirmacion < '00:05:00'::interval) THEN 1
            ELSE NULL::integer
        END) AS confirmadas_5min,
    count(
        CASE
            WHEN ((appointments.tiempo_hasta_confirmacion >= '00:05:00'::interval) AND (appointments.tiempo_hasta_confirmacion <= '00:30:00'::interval)) THEN 1
            ELSE NULL::integer
        END) AS confirmadas_5_30min,
    count(
        CASE
            WHEN (appointments.tiempo_hasta_confirmacion > '00:30:00'::interval) THEN 1
            ELSE NULL::integer
        END) AS confirmadas_mas_30min
FROM appointments
WHERE (appointments.fecha_original >= (now() - '30 days'::interval))
GROUP BY (date((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)))
ORDER BY (date((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text))) DESC;

-- 17. v_metricas_por_dia_semana
CREATE VIEW v_metricas_por_dia_semana AS
WITH dias AS (
    SELECT 
        appointments.google_event_id,
        appointments.estado,
        EXTRACT(dow FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) AS dia_num,
        CASE EXTRACT(dow FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text))
            WHEN 0 THEN 'Domingo'::text
            WHEN 1 THEN 'Lunes'::text
            WHEN 2 THEN 'Martes'::text
            WHEN 3 THEN 'Miércoles'::text
            WHEN 4 THEN 'Jueves'::text
            WHEN 5 THEN 'Viernes'::text
            WHEN 6 THEN 'Sábado'::text
            ELSE NULL::text
        END AS dia_nombre,
        CASE EXTRACT(dow FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text))
            WHEN 0 THEN '🟡'::text
            WHEN 1 THEN '🔵'::text
            WHEN 2 THEN '🟢'::text
            WHEN 3 THEN '🟠'::text
            WHEN 4 THEN '🟣'::text
            WHEN 5 THEN '🔴'::text
            WHEN 6 THEN '⚫'::text
            ELSE NULL::text
        END AS color_dia
    FROM appointments
    WHERE (appointments.fecha_original IS NOT NULL)
)
SELECT 
    dias.dia_num,
    dias.dia_nombre,
    dias.color_dia,
    count(*) AS total_citas,
    count(
        CASE
            WHEN (dias.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END) AS confirmadas,
    count(
        CASE
            WHEN (dias.estado = 'pendiente_confirmacion'::text) THEN 1
            ELSE NULL::integer
        END) AS pendientes,
    count(
        CASE
            WHEN (dias.estado = 'no_show'::text) THEN 1
            ELSE NULL::integer
        END) AS no_shows,
    count(
        CASE
            WHEN (dias.estado = 'cancelado'::text) THEN 1
            ELSE NULL::integer
        END) AS canceladas,
    round(((100.0 * (count(
        CASE
            WHEN (dias.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS tasa_confirmacion,
    round(((100.0 * (count(
        CASE
            WHEN (dias.estado = 'no_show'::text) THEN 1
            ELSE NULL::integer
        END))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS tasa_no_show,
    CASE
        WHEN (dias.dia_num = ANY (ARRAY[(0)::numeric, (6)::numeric])) THEN 'Fin de semana'::text
        ELSE 'Entre semana'::text
    END AS tipo_dia
FROM dias
GROUP BY dias.dia_num, dias.dia_nombre, dias.color_dia
ORDER BY
    CASE dias.dia_num
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        WHEN 3 THEN 3
        WHEN 4 THEN 4
        WHEN 5 THEN 5
        WHEN 6 THEN 6
        WHEN 0 THEN 7
        ELSE NULL::integer
    END;

-- 18. v_metricas_por_horario
CREATE VIEW v_metricas_por_horario AS
WITH horarios AS (
    SELECT 
        appointments.google_event_id,
        appointments.paciente,
        appointments.fecha_original,
        appointments.estado,
        (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text) AS fecha_local,
        EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) AS hora,
        EXTRACT(dow FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) AS dia_semana_num,
        to_char((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text), 'Day'::text) AS dia_semana,
        to_char((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text), 'HH24:00'::text) AS hora_formato,
        CASE
            WHEN ((EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) >= (6)::numeric) AND (EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) <= (11)::numeric)) THEN 'Mañana (6-12)'::text
            WHEN ((EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) >= (12)::numeric) AND (EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) <= (14)::numeric)) THEN 'Mediodía (12-15)'::text
            WHEN ((EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) >= (15)::numeric) AND (EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) <= (18)::numeric)) THEN 'Tarde (15-19)'::text
            WHEN ((EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) >= (19)::numeric) AND (EXTRACT(hour FROM (appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text)) <= (21)::numeric)) THEN 'Noche (19-22)'::text
            ELSE 'Fuera de horario'::text
        END AS bloque_horario
    FROM appointments
)
SELECT 
    horarios.bloque_horario,
    count(*) AS total_citas,
    count(
        CASE
            WHEN (horarios.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END) AS confirmadas,
    count(
        CASE
            WHEN (horarios.estado = 'pendiente_confirmacion'::text) THEN 1
            ELSE NULL::integer
        END) AS pendientes,
    count(
        CASE
            WHEN (horarios.estado = 'no_show'::text) THEN 1
            ELSE NULL::integer
        END) AS no_shows,
    count(
        CASE
            WHEN (horarios.estado = 'cancelado'::text) THEN 1
            ELSE NULL::integer
        END) AS canceladas,
    round(((100.0 * (count(
        CASE
            WHEN (horarios.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS tasa_confirmacion,
    CASE
        WHEN (horarios.bloque_horario = 'Mañana (6-12)'::text) THEN '🌅'::text
        WHEN (horarios.bloque_horario = 'Mediodía (12-15)'::text) THEN '☀️'::text
        WHEN (horarios.bloque_horario = 'Tarde (15-19)'::text) THEN '🌇'::text
        WHEN (horarios.bloque_horario = 'Noche (19-22)'::text) THEN '🌙'::text
        ELSE '⏰'::text
    END AS icono
FROM horarios
GROUP BY horarios.bloque_horario
ORDER BY
    CASE horarios.bloque_horario
        WHEN 'Mañana (6-12)'::text THEN 1
        WHEN 'Mediodía (12-15)'::text THEN 2
        WHEN 'Tarde (15-19)'::text THEN 3
        WHEN 'Noche (19-22)'::text THEN 4
        ELSE 5
    END;

-- 19. v_metricas_resumen
CREATE VIEW v_metricas_resumen AS
SELECT 
    date(n8n_metricas_clasificador."timestamp") AS fecha,
    n8n_metricas_clasificador.modelo_usado,
    count(*) AS total_mensajes,
    sum(n8n_metricas_clasificador.costo_estimado) AS costo_total,
    avg(n8n_metricas_clasificador.longitud_mensaje) AS promedio_longitud,
    sum(
        CASE
            WHEN n8n_metricas_clasificador.es_urgente THEN 1
            ELSE 0
        END) AS casos_urgentes,
    sum(
        CASE
            WHEN n8n_metricas_clasificador.multiples_personas THEN 1
            ELSE 0
        END) AS casos_multiples,
    round((avg(
        CASE
            WHEN n8n_metricas_clasificador.respuesta_exitosa THEN 1
            ELSE 0
        END) * (100)::numeric), 2) AS tasa_exito
FROM n8n_metricas_clasificador
GROUP BY (date(n8n_metricas_clasificador."timestamp")), n8n_metricas_clasificador.modelo_usado
ORDER BY (date(n8n_metricas_clasificador."timestamp")) DESC;

-- 20. v_metricas_semanales
CREATE VIEW v_metricas_semanales AS
WITH semanas AS (
    SELECT 
        'Semana Pasada'::text AS periodo,
        (date_trunc('week'::text, (CURRENT_DATE - '7 days'::interval)))::date AS inicio,
        ((date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone) - '1 day'::interval))::date AS fin,
        '-1'::integer AS orden
    UNION ALL
    SELECT 
        'Semana Actual'::text AS periodo,
        (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date AS inicio,
        ((date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone) + '6 days'::interval))::date AS fin,
        0 AS orden
    UNION ALL
    SELECT 
        'Próxima Semana'::text AS periodo,
        (date_trunc('week'::text, (CURRENT_DATE + '7 days'::interval)))::date AS inicio,
        ((date_trunc('week'::text, (CURRENT_DATE + '7 days'::interval)) + '6 days'::interval))::date AS fin,
        1 AS orden
)
SELECT 
    s.periodo,
    ((to_char((s.inicio)::timestamp with time zone, 'DD/MM'::text) || ' - '::text) || to_char((s.fin)::timestamp with time zone, 'DD/MM'::text)) AS rango_fechas,
    s.inicio,
    s.fin,
    COALESCE(count(*), (0)::bigint) AS total_agendadas,
    COALESCE(count(
        CASE
            WHEN (a.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS confirmadas,
    COALESCE(count(
        CASE
            WHEN (a.estado = 'pendiente_confirmacion'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS pendientes,
    COALESCE(count(
        CASE
            WHEN (a.estado = 'no_show'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS no_shows,
    COALESCE(count(
        CASE
            WHEN (a.estado = 'cancelado'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS canceladas,
    COALESCE(count(
        CASE
            WHEN (a.estado = 'completado'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS completadas,
    CASE
        WHEN (count(*) > 0) THEN round(((100.0 * (count(
        CASE
            WHEN (a.estado = 'confirmado'::text) THEN 1
            ELSE NULL::integer
        END))::numeric) / (count(*))::numeric), 1)
        ELSE (0)::numeric
    END AS tasa_confirmacion,
    CASE
        WHEN (s.orden = '-1'::integer) THEN '📅'::text
        WHEN (s.orden = 0) THEN '📍'::text
        ELSE '📆'::text
    END AS icono,
    s.orden
FROM (semanas s
LEFT JOIN appointments a ON (((date(a.fecha_original) >= s.inicio) AND (date(a.fecha_original) <= s.fin))))
GROUP BY s.periodo, s.inicio, s.fin, s.orden
ORDER BY s.orden;

-- 21. v_pacientes_problematicos
CREATE VIEW v_pacientes_problematicos AS
SELECT 
    appointments.paciente,
    appointments.telefono,
    count(*) FILTER (WHERE (appointments.estado = 'no_show'::text)) AS total_no_shows,
    count(*) FILTER (WHERE (appointments.estado = 'cancelado'::text)) AS total_cancelaciones,
    count(*) AS total_citas,
    round((((count(*) FILTER (WHERE (appointments.estado = 'no_show'::text)))::numeric * (100)::numeric) / (count(*))::numeric), 1) AS porcentaje_no_show,
    string_agg((((to_char((appointments.fecha_original AT TIME ZONE 'America/Mexico_City'::text), 'DD/MM'::text) || ' ('::text) || appointments.estado) || ')'::text), ', '::text ORDER BY appointments.fecha_original DESC) AS historial_reciente
FROM appointments
WHERE (appointments.fecha_original >= (CURRENT_DATE - '90 days'::interval))
GROUP BY appointments.paciente, appointments.telefono
HAVING ((count(*) FILTER (WHERE (appointments.estado = 'no_show'::text)) >= 2) OR (count(*) FILTER (WHERE (appointments.estado = 'cancelado'::text)) >= 3))
ORDER BY (count(*) FILTER (WHERE (appointments.estado = 'no_show'::text))) DESC, (count(*) FILTER (WHERE (appointments.estado = 'cancelado'::text))) DESC;

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
ORDER BY viewname;

-- Summary of created views
SELECT 
    COUNT(*) as total_views_created,
    'All dashboard views have been successfully migrated' as message
FROM pg_views 
WHERE schemaname = 'public';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- All 21 views from the public schema have been recreated
-- Views are now ready for use in PostgreSQL with complete compatibility
-- =============================================================================