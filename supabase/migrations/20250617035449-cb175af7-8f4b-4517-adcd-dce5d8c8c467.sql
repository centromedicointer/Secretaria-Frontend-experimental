
-- Eliminar la política existente si existe
DROP POLICY IF EXISTS "Users can view their own dashboard permissions" ON public.user_dashboard_permissions;

-- Crear nuevas políticas para user_dashboard_permissions
CREATE POLICY "Users can view their own permissions and admins can view all"
  ON public.user_dashboard_permissions
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

-- Política para permitir que admins inserten permisos para cualquier usuario
CREATE POLICY "Admins can insert dashboard permissions"
  ON public.user_dashboard_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

-- Política para permitir que admins actualicen permisos de cualquier usuario
CREATE POLICY "Admins can update dashboard permissions"
  ON public.user_dashboard_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

-- Política para permitir que admins eliminen permisos de cualquier usuario
CREATE POLICY "Admins can delete dashboard permissions"
  ON public.user_dashboard_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );
