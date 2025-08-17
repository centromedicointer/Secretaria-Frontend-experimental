-- Create dashboard view for secretary
CREATE OR REPLACE VIEW v_dashboard_secretaria AS
SELECT 
    DATE(fecha_recibido AT TIME ZONE 'America/Mexico_City') as fecha,
    COUNT(*) as total_mensajes,
    COUNT(DISTINCT phone_number) as usuarios_unicos,
    AVG(EXTRACT(EPOCH FROM (fecha_respuesta - fecha_recibido))) as tiempo_respuesta_seg,
    COUNT(CASE WHEN fecha_respuesta IS NULL THEN 1 END) as sin_respuesta,
    COUNT(CASE WHEN pregunta ILIKE '%cita%' THEN 1 END) as solicitudes_cita
FROM n8n_mensajes
WHERE fecha_recibido > NOW() - INTERVAL '30 days'
GROUP BY DATE(fecha_recibido AT TIME ZONE 'America/Mexico_City')
ORDER BY fecha DESC;