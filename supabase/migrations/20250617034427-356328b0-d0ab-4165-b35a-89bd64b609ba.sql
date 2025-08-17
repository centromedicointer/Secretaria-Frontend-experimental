
-- Crear enum para los roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Crear tabla para roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propios roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los admins puedan gestionar roles (opcional)
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Insertar rol de admin para el usuario actual (reemplaza con tu user_id)
-- Puedes obtener tu user_id desde el panel de Supabase en Auth > Users
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('tu-user-id-aqui', 'admin');
