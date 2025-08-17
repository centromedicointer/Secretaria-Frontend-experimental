-- PHASE 1: Enable RLS on all unprotected tables and create policies

-- Enable RLS on all tables that currently don't have it
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

-- PHASE 2: Create security definer function for safe role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper function to check if user is admin
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

-- PHASE 3: Create RLS policies for each table

-- Appointments - Admin only access for medical data
CREATE POLICY "Admins can manage appointments" ON public.appointments
  FOR ALL USING (public.is_current_user_admin());

-- Chat messages - Admin access for monitoring
CREATE POLICY "Admins can manage chat messages" ON public.chat_messages
  FOR ALL USING (public.is_current_user_admin());

-- Chats - Admin access for monitoring
CREATE POLICY "Admins can manage chats" ON public.chats
  FOR ALL USING (public.is_current_user_admin());

-- Client control - Admin only for operational control
CREATE POLICY "Admins can manage client control" ON public.client_control
  FOR ALL USING (public.is_current_user_admin());

-- Customers - Admin access for customer management
CREATE POLICY "Admins can manage customers" ON public.customers
  FOR ALL USING (public.is_current_user_admin());

-- Documents - Authenticated users can read, admins can manage
CREATE POLICY "Authenticated users can read documents" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage documents" ON public.documents
  FOR INSERT, UPDATE, DELETE USING (public.is_current_user_admin());

-- Evolution metrics - Read-only for authenticated, admins can manage
CREATE POLICY "Authenticated users can read evolution metrics" ON public.evolution_metricas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage evolution metrics" ON public.evolution_metricas
  FOR INSERT, UPDATE, DELETE USING (public.is_current_user_admin());

-- KPI historical data - Read-only for authenticated, admins can manage
CREATE POLICY "Authenticated users can read KPI historic" ON public.kpi_historico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage KPI historic" ON public.kpi_historico
  FOR INSERT, UPDATE, DELETE USING (public.is_current_user_admin());

-- Messages - Admin only for sensitive communication data
CREATE POLICY "Admins can manage mensajes" ON public.mensajes
  FOR ALL USING (public.is_current_user_admin());

-- N8N error tables - Admin only for operational monitoring
CREATE POLICY "Admins can manage n8n whatsapp errors" ON public.n8n_errores_whatsapp
  FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage n8n whatsapp error history" ON public.n8n_errores_whatsapp_historico
  FOR ALL USING (public.is_current_user_admin());

-- N8N message queues - Admin only for system operations
CREATE POLICY "Admins can manage n8n message queue" ON public.n8n_fila_mensagens
  FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage n8n personal message queue" ON public.n8n_fila_mensagens_personal
  FOR ALL USING (public.is_current_user_admin());

-- N8N message history - Admin only for monitoring
CREATE POLICY "Admins can manage n8n message history" ON public.n8n_historico_mensagens
  FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage n8n personal message history" ON public.n8n_historico_mensagens_personal
  FOR ALL USING (public.is_current_user_admin());

-- N8N logs and notifications - Admin only
CREATE POLICY "Admins can manage n8n notification logs" ON public.n8n_logs_notificaciones
  FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage n8n messages" ON public.n8n_mensajes
  FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage n8n unique users" ON public.n8n_usuarios_unicos
  FOR ALL USING (public.is_current_user_admin());

-- Modification notifications - Admin only
CREATE POLICY "Admins can manage modification notifications" ON public.notificaciones_modificaciones
  FOR ALL USING (public.is_current_user_admin());

-- Workflow control - Admin only for system control
CREATE POLICY "Admins can manage workflow control" ON public.workflow_control
  FOR ALL USING (public.is_current_user_admin());

-- PHASE 4: Fix database functions with search_path vulnerabilities
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_email text;
begin
  -- Find the user_id from the profiles table based on the username
  select id into v_user_id from public.profiles where username = p_username;

  if v_user_id is null then
    return null; -- Username not found
  end if;

  -- With security definer, we can query auth.users table
  select email into v_email from auth.users where id = v_user_id;

  return v_email;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_n8n_connections_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_username_available(p_username text, p_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si se proporciona user_id, excluir ese usuario de la verificación (para ediciones)
  IF p_user_id IS NOT NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE username = p_username AND id != p_user_id
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE username = p_username
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_evolution_api_connections_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.procesar_metrica_whatsapp(p_imagenes integer, p_audios integer, p_documentos integer, p_videos integer, p_stickers integer, p_mensajes integer, p_abiertos integer, p_optout integer, p_unicos integer, p_numero character varying, p_timestamp timestamp without time zone, p_message_id character varying)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_es_chat_nuevo BOOLEAN;
  v_ultima_sesion TIMESTAMP;
BEGIN
  -- Verificar si es un chat nuevo (sin mensajes en 24 horas)
  SELECT MAX(timestamp) INTO v_ultima_sesion
  FROM n8n_historial_mensajes
  WHERE numero = p_numero;
  
  v_es_chat_nuevo := (v_ultima_sesion IS NULL OR 
                      p_timestamp - v_ultima_sesion > INTERVAL '24 hours');
  
  -- Actualizar métricas
  INSERT INTO evolution_metricas (id, imagenes_recibidas, audios_recibidos, 
    documentos_recibidos, videos_recibidos, stickers_recibidos, mensajes_recibidos, 
    mensajes_abiertos, usuarios_optout, usuarios_unicos, total_chats)
  VALUES (1, p_imagenes, p_audios, p_documentos, p_videos, p_stickers, 
    p_mensajes, p_abiertos, p_optout, p_unicos, 
    CASE WHEN v_es_chat_nuevo THEN 1 ELSE 0 END)
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
  
  -- Registrar mensaje
  INSERT INTO n8n_historial_mensajes (numero, timestamp, message_id)
  VALUES (p_numero, p_timestamp, p_message_id);
  
  -- Registrar usuario único
  INSERT INTO n8n_usuarios_unicos (numero)
  VALUES (p_numero)
  ON CONFLICT (numero) DO NOTHING;
  
  -- Gestionar sesiones
  IF v_es_chat_nuevo THEN
    -- Cerrar sesión anterior si existe
    UPDATE n8n_sesiones_chat 
    SET activa = false, 
        fin_sesion = v_ultima_sesion,
        duracion_minutos = EXTRACT(EPOCH FROM (v_ultima_sesion - inicio_sesion))/60
    WHERE numero = p_numero AND activa = true;
    
    -- Crear nueva sesión
    INSERT INTO n8n_sesiones_chat (numero, inicio_sesion)
    VALUES (p_numero, p_timestamp);
  ELSE
    -- Incrementar contador de mensajes en sesión actual
    UPDATE n8n_sesiones_chat 
    SET mensajes_en_sesion = mensajes_en_sesion + 1
    WHERE numero = p_numero AND activa = true;
  END IF;
END;
$$;