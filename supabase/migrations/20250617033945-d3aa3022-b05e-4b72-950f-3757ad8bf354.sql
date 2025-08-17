
-- Agregar columnas adicionales a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Crear función para manejar actualizaciones de perfil
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_profile_update();

-- Función para verificar si un username está disponible
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Actualizar políticas RLS para profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
