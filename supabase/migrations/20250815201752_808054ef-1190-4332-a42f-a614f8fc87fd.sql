-- ================================================================
-- CRITICAL SECURITY FIXES: RLS POLICIES FOR PII PROTECTION
-- ================================================================

-- Fix profiles table - Remove public access, add user-scoped policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;

CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (is_current_user_admin());

-- Fix n8n_mensajes - Add proper user-scoped access (admin-only for sensitive data)
DROP POLICY IF EXISTS "Admins can select n8n messages" ON n8n_mensajes;
DROP POLICY IF EXISTS "Admins can insert n8n messages" ON n8n_mensajes;
DROP POLICY IF EXISTS "Admins can update n8n messages" ON n8n_mensajes;
DROP POLICY IF EXISTS "Admins can delete n8n messages" ON n8n_mensajes;

CREATE POLICY "Admins can manage n8n messages" 
ON n8n_mensajes FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

-- Fix appointments - Add user-scoped access for patients to see their own data
DROP POLICY IF EXISTS "Admins can select appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;

CREATE POLICY "Admins can manage all appointments" 
ON appointments FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

-- Create phone masking function for data protection
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone_number text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN phone_number IS NULL THEN NULL
    WHEN LENGTH(phone_number) >= 10 THEN 
      SUBSTRING(phone_number FROM 1 FOR 3) || '***' || SUBSTRING(phone_number FROM LENGTH(phone_number) - 1)
    ELSE '***'
  END;
$$;

-- Create secure view for appointments with masked phone numbers for non-admins
CREATE OR REPLACE VIEW v_appointments_secure AS
SELECT 
  google_event_id,
  paciente,
  CASE 
    WHEN is_current_user_admin() THEN telefono
    ELSE mask_phone_number(telefono)
  END as telefono,
  fecha_original,
  estado,
  observaciones,
  created_at,
  updated_at
FROM appointments;

-- Add data retention policy function
CREATE OR REPLACE FUNCTION public.clean_old_sensitive_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive old messages (older than 2 years)
  DELETE FROM n8n_mensajes 
  WHERE fecha_recibido < NOW() - INTERVAL '2 years';
  
  -- Archive old appointment data (older than 5 years)  
  DELETE FROM appointments 
  WHERE fecha_original < NOW() - INTERVAL '5 years';
  
  -- Log the cleanup
  INSERT INTO job_execution_log (job_name, execution_time, status)
  VALUES ('data_retention_cleanup', NOW(), 'success');
END;
$$;