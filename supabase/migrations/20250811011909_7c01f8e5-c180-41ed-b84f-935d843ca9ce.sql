-- Continue with remaining RLS policies for N8N and message tables

-- Messages - Admin only for sensitive communication data
CREATE POLICY "Admins can select mensajes" ON public.mensajes FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert mensajes" ON public.mensajes FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update mensajes" ON public.mensajes FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete mensajes" ON public.mensajes FOR DELETE USING (public.is_current_user_admin());

-- N8N error tables - Admin only for operational monitoring
CREATE POLICY "Admins can select n8n whatsapp errors" ON public.n8n_errores_whatsapp FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n whatsapp errors" ON public.n8n_errores_whatsapp FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n whatsapp errors" ON public.n8n_errores_whatsapp FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n whatsapp errors" ON public.n8n_errores_whatsapp FOR DELETE USING (public.is_current_user_admin());

CREATE POLICY "Admins can select n8n whatsapp error history" ON public.n8n_errores_whatsapp_historico FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n whatsapp error history" ON public.n8n_errores_whatsapp_historico FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n whatsapp error history" ON public.n8n_errores_whatsapp_historico FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n whatsapp error history" ON public.n8n_errores_whatsapp_historico FOR DELETE USING (public.is_current_user_admin());

-- N8N message queues - Admin only for system operations
CREATE POLICY "Admins can select n8n message queue" ON public.n8n_fila_mensagens FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n message queue" ON public.n8n_fila_mensagens FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n message queue" ON public.n8n_fila_mensagens FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n message queue" ON public.n8n_fila_mensagens FOR DELETE USING (public.is_current_user_admin());

CREATE POLICY "Admins can select n8n personal message queue" ON public.n8n_fila_mensagens_personal FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n personal message queue" ON public.n8n_fila_mensagens_personal FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n personal message queue" ON public.n8n_fila_mensagens_personal FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n personal message queue" ON public.n8n_fila_mensagens_personal FOR DELETE USING (public.is_current_user_admin());

-- N8N message history - Admin only for monitoring
CREATE POLICY "Admins can select n8n message history" ON public.n8n_historico_mensagens FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n message history" ON public.n8n_historico_mensagens FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n message history" ON public.n8n_historico_mensagens FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n message history" ON public.n8n_historico_mensagens FOR DELETE USING (public.is_current_user_admin());

CREATE POLICY "Admins can select n8n personal message history" ON public.n8n_historico_mensagens_personal FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n personal message history" ON public.n8n_historico_mensagens_personal FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n personal message history" ON public.n8n_historico_mensagens_personal FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n personal message history" ON public.n8n_historico_mensagens_personal FOR DELETE USING (public.is_current_user_admin());

-- N8N logs and notifications - Admin only
CREATE POLICY "Admins can select n8n notification logs" ON public.n8n_logs_notificaciones FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n notification logs" ON public.n8n_logs_notificaciones FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n notification logs" ON public.n8n_logs_notificaciones FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n notification logs" ON public.n8n_logs_notificaciones FOR DELETE USING (public.is_current_user_admin());

CREATE POLICY "Admins can select n8n messages" ON public.n8n_mensajes FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n messages" ON public.n8n_mensajes FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n messages" ON public.n8n_mensajes FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n messages" ON public.n8n_mensajes FOR DELETE USING (public.is_current_user_admin());

CREATE POLICY "Admins can select n8n unique users" ON public.n8n_usuarios_unicos FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert n8n unique users" ON public.n8n_usuarios_unicos FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update n8n unique users" ON public.n8n_usuarios_unicos FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete n8n unique users" ON public.n8n_usuarios_unicos FOR DELETE USING (public.is_current_user_admin());

-- Modification notifications - Admin only
CREATE POLICY "Admins can select modification notifications" ON public.notificaciones_modificaciones FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert modification notifications" ON public.notificaciones_modificaciones FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update modification notifications" ON public.notificaciones_modificaciones FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete modification notifications" ON public.notificaciones_modificaciones FOR DELETE USING (public.is_current_user_admin());

-- Workflow control - Admin only for system control
CREATE POLICY "Admins can select workflow control" ON public.workflow_control FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert workflow control" ON public.workflow_control FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update workflow control" ON public.workflow_control FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete workflow control" ON public.workflow_control FOR DELETE USING (public.is_current_user_admin());

-- Fix remaining database functions with search_path vulnerabilities
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;

-- Update the existing has_role function to use proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Update has_dashboard_access function
CREATE OR REPLACE FUNCTION public.has_dashboard_access(user_id_param uuid, dashboard_param dashboard_type)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_dashboard_permissions 
    WHERE user_id = user_id_param 
    AND dashboard_type = dashboard_param
  );
$$;