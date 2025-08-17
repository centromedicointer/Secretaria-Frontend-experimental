-- ================================================================
-- SECURITY FIX: ENABLE RLS ON ANALYTICS TABLES
-- ================================================================

-- Enable RLS on analytics and system tables that need protection
ALTER TABLE appointment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_recordatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_job_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_generados ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_sesiones_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_metricas_clasificador ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for system tables
CREATE POLICY "Admins can manage appointment analytics" 
ON appointment_analytics FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage appointment timeline" 
ON appointment_timeline FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage appointment reminders" 
ON appointments_recordatorios FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage job execution logs" 
ON job_execution_log FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage n8n job config" 
ON n8n_job_config FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage generated reports" 
ON reportes_generados FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage n8n chat sessions" 
ON n8n_sesiones_chat FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage n8n classifier metrics" 
ON n8n_metricas_clasificador FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());