
-- Create table to store n8n connection configurations
CREATE TABLE public.n8n_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  workflow_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.n8n_connections IS 'Stores n8n connection configurations for users.';
COMMENT ON COLUMN public.n8n_connections.user_id IS 'Link to the authenticated user.';
COMMENT ON COLUMN public.n8n_connections.api_key IS 'n8n API key for the user.';

-- Enable Row Level Security
ALTER TABLE public.n8n_connections ENABLE ROW LEVEL SECURITY;

-- Policies for n8n_connections
CREATE POLICY "Users can view their own n8n connection."
  ON public.n8n_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own n8n connection."
  ON public.n8n_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own n8n connection."
  ON public.n8n_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own n8n connection."
  ON public.n8n_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update `updated_at`
CREATE OR REPLACE FUNCTION public.handle_n8n_connections_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update `updated_at` on row update
CREATE TRIGGER on_n8n_connections_update
  BEFORE UPDATE ON public.n8n_connections
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_n8n_connections_update();
