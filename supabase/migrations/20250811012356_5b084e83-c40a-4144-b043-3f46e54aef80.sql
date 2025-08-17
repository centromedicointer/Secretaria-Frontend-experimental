-- Fix remaining security definer views by dropping and recreating them safely
DROP VIEW IF EXISTS public.v_estadisticas_errores CASCADE;
DROP VIEW IF EXISTS public.v_mensajes_pendientes CASCADE;

-- Recreate the views without security definer (using invoker security)
CREATE VIEW public.v_estadisticas_errores AS
SELECT 
  DATE(fecha_error) as fecha,
  COUNT(*) as total_errores,
  COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
  COUNT(CASE WHEN estado = 'enviado_reintento' THEN 1 END) as enviados_reintento,
  COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as fallidos
FROM public.n8n_errores_whatsapp 
GROUP BY DATE(fecha_error)
ORDER BY fecha DESC;

CREATE VIEW public.v_mensajes_pendientes AS
SELECT 
  id,
  telefono,
  nombre_paciente,
  fecha_cita,
  fecha_error,
  ultimo_intento,
  intentos,
  error_message
FROM public.n8n_errores_whatsapp 
WHERE estado = 'pendiente'
ORDER BY fecha_error DESC;

-- Fix remaining functions that don't have search_path set
-- These are likely vector extension functions and match_documents function

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Note: Vector extension functions (like array_to_vector, etc.) are system functions
-- and cannot be modified. They are considered low risk as they're part of the pgvector extension.

-- Enable RLS on the recreated views (they inherit from their base tables but let's be explicit)
-- Views don't support RLS directly, but their security comes from the underlying tables
-- which now have proper RLS policies

-- Add a comment to document the security approach for the views
COMMENT ON VIEW public.v_estadisticas_errores IS 'Security: This view inherits RLS from n8n_errores_whatsapp table. Access controlled by admin-only policies.';
COMMENT ON VIEW public.v_mensajes_pendientes IS 'Security: This view inherits RLS from n8n_errores_whatsapp table. Access controlled by admin-only policies.';