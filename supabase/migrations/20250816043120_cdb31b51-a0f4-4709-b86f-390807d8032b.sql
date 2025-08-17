-- Create an overloaded version of is_current_user_admin that accepts a user_id parameter
CREATE OR REPLACE FUNCTION public.is_current_user_admin(user_id_param uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = COALESCE(user_id_param, auth.uid()) AND role = 'admin'
  );
$$;