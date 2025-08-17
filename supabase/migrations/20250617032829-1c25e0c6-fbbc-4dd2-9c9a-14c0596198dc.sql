
-- Crear enum para los tipos de dashboard
CREATE TYPE public.dashboard_type AS ENUM ('evolution', 'n8n');

-- Crear tabla para permisos de dashboard por usuario
CREATE TABLE public.user_dashboard_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dashboard_type dashboard_type NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, dashboard_type)
);

-- Habilitar RLS
ALTER TABLE public.user_dashboard_permissions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propios permisos
CREATE POLICY "Users can view their own dashboard permissions"
  ON public.user_dashboard_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Función para verificar si un usuario tiene acceso a un dashboard específico
CREATE OR REPLACE FUNCTION public.has_dashboard_access(user_id_param UUID, dashboard_param dashboard_type)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_dashboard_permissions 
    WHERE user_id = user_id_param 
    AND dashboard_type = dashboard_param
  );
$$;

-- Insertar permisos por defecto para usuarios existentes (opcional)
-- Esto dará acceso a ambos dashboards a todos los usuarios actuales
INSERT INTO public.user_dashboard_permissions (user_id, dashboard_type)
SELECT 
  id as user_id,
  'evolution'::dashboard_type
FROM auth.users
ON CONFLICT (user_id, dashboard_type) DO NOTHING;

INSERT INTO public.user_dashboard_permissions (user_id, dashboard_type)
SELECT 
  id as user_id,
  'n8n'::dashboard_type
FROM auth.users
ON CONFLICT (user_id, dashboard_type) DO NOTHING;
