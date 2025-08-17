
-- Secure the existing n8n_connections table (idempotent changes)
-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'n8n_connections_user_id_key' 
    AND conrelid = 'public.n8n_connections'::regclass
  ) THEN
    ALTER TABLE public.n8n_connections
      ADD CONSTRAINT n8n_connections_user_id_key UNIQUE (user_id);
  END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.n8n_connections ENABLE ROW LEVEL SECURITY;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can manage their own n8n connection' 
    AND polrelid = 'public.n8n_connections'::regclass
  ) THEN
    CREATE POLICY "Users can manage their own n8n connection"
    ON public.n8n_connections
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;
