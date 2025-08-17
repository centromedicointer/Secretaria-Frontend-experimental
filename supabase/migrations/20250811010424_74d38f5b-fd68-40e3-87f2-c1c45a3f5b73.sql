-- PHASE 1: Enable RLS on all unprotected tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_errores_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_errores_whatsapp_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_fila_mensagens_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_historico_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_historico_mensagens_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_logs_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_usuarios_unicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_modificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_control ENABLE ROW LEVEL SECURITY;

-- PHASE 2: Create security definer functions for safe role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- PHASE 3: Create RLS policies for each table (separate policies for each operation)

-- Appointments - Admin only access for medical data
CREATE POLICY "Admins can select appointments" ON public.appointments FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert appointments" ON public.appointments FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update appointments" ON public.appointments FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE USING (public.is_current_user_admin());

-- Chat messages - Admin access for monitoring
CREATE POLICY "Admins can select chat messages" ON public.chat_messages FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update chat messages" ON public.chat_messages FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE USING (public.is_current_user_admin());

-- Chats - Admin access for monitoring
CREATE POLICY "Admins can select chats" ON public.chats FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert chats" ON public.chats FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update chats" ON public.chats FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete chats" ON public.chats FOR DELETE USING (public.is_current_user_admin());

-- Client control - Admin only for operational control
CREATE POLICY "Admins can select client control" ON public.client_control FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert client control" ON public.client_control FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update client control" ON public.client_control FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete client control" ON public.client_control FOR DELETE USING (public.is_current_user_admin());

-- Customers - Admin access for customer management
CREATE POLICY "Admins can select customers" ON public.customers FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert customers" ON public.customers FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update customers" ON public.customers FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete customers" ON public.customers FOR DELETE USING (public.is_current_user_admin());

-- Documents - Authenticated users can read, admins can manage
CREATE POLICY "Authenticated users can read documents" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert documents" ON public.documents FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update documents" ON public.documents FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE USING (public.is_current_user_admin());

-- Evolution metrics - Read-only for authenticated, admins can manage
CREATE POLICY "Authenticated users can read evolution metrics" ON public.evolution_metricas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert evolution metrics" ON public.evolution_metricas FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update evolution metrics" ON public.evolution_metricas FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete evolution metrics" ON public.evolution_metricas FOR DELETE USING (public.is_current_user_admin());

-- KPI historical data - Read-only for authenticated, admins can manage
CREATE POLICY "Authenticated users can read KPI historic" ON public.kpi_historico FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert KPI historic" ON public.kpi_historico FOR INSERT WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update KPI historic" ON public.kpi_historico FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Admins can delete KPI historic" ON public.kpi_historico FOR DELETE USING (public.is_current_user_admin());