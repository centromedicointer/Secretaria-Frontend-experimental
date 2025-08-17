
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  workflowId: string;
}

interface SavedN8nConfig {
  baseUrl?: string;
  workflowId?: string;
}

interface N8nConnectionProps {
  onConnectionChange: (isConnected: boolean, config: Partial<N8nConfig>) => void;
}

export const useN8nConnection = ({ onConnectionChange }: N8nConnectionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<SavedN8nConfig>({
    baseUrl: '',
    workflowId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchConnection = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        onConnectionChange(false, {});
        return;
      }

      const { data, error } = await supabase
        .from('n8n_connections')
        .select('base_url, workflow_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching n8n connection:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración de n8n.",
          variant: "destructive",
        });
        setIsLoading(false);
        onConnectionChange(false, {});
        return;
      }

      if (data) {
        const savedConfig = {
          baseUrl: data.base_url,
          workflowId: data.workflow_id || ''
        };
        setConfig(savedConfig);
        setIsConnected(true);
        onConnectionChange(true, savedConfig);
      } else {
        onConnectionChange(false, {});
      }
      setIsLoading(false);
    };

    fetchConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(async (connectConfig: N8nConfig) => {
    if (!connectConfig.baseUrl || !connectConfig.apiKey) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa la URL base y la API Key.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('save-n8n-connection', {
        body: {
          baseUrl: connectConfig.baseUrl,
          apiKey: connectConfig.apiKey,
          workflowId: connectConfig.workflowId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data.error) {
          throw new Error(data.error);
      }

      setIsConnected(true);
      const newConfig = { baseUrl: connectConfig.baseUrl, workflowId: connectConfig.workflowId };
      setConfig(newConfig);
      onConnectionChange(true, newConfig);
      
      toast({
        title: "¡Conectado y Asegurado!",
        description: "La conexión con N8n se ha guardado de forma segura.",
      });

    } catch (error: any) {
      console.error("Error conectando:", error);
      setIsConnected(false);
      onConnectionChange(false, {});
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo conectar con N8n. Verifica tus credenciales.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [onConnectionChange, toast]);

  const handleDisconnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('n8n_connections')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          throw new Error('No se pudo eliminar la configuración de conexión.');
        }
      }
      
      setIsConnected(false);
      setConfig({ baseUrl: '', workflowId: '' });
      onConnectionChange(false, {});
      toast({
        title: "Desconectado",
        description: "Se ha cerrado la conexión con N8n y se ha eliminado la configuración guardada.",
      });
    } catch (error: any) {
      console.error("Error al desconectar:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la configuración de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [onConnectionChange, toast]);
  
  return { isLoading, isConnecting, isConnected, config, handleConnect, handleDisconnect };
};
