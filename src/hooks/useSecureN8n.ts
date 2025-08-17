
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface N8nApiOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

export const useSecureN8n = () => {
  const { toast } = useToast();

  const callN8nApi = useCallback(async (options: N8nApiOptions) => {
    try {
      console.log('Calling N8n API with options:', options);
      
      const { data, error } = await supabase.functions.invoke('n8n-secure-api', {
        body: options,
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      if (data?.error) {
        console.error('N8n API error:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (error: any) {
      console.error('Error calling N8n API:', error);
      
      let errorMessage = "No se pudo conectar con N8n";
      
      if (error.message?.includes('N8n API error')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Configuración de N8n no encontrada')) {
        errorMessage = "Configuración de N8n no encontrada. Por favor configura la conexión.";
      } else if (error.message?.includes('No autorizado')) {
        errorMessage = "Error de autenticación. Por favor inicia sesión.";
      } else if (error.message?.includes('no JSON')) {
        errorMessage = "La respuesta de N8n no es válida. Verifica la URL y credenciales.";
      }
      
      toast({
        title: "Error de N8n",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getWorkflows = useCallback(async () => {
    return callN8nApi({ endpoint: '/workflows' });
  }, [callN8nApi]);

  const getWorkflow = useCallback(async (workflowId: string) => {
    return callN8nApi({ endpoint: `/workflows/${workflowId}` });
  }, [callN8nApi]);

  const getExecutions = useCallback(async (workflowId?: string) => {
    const endpoint = workflowId 
      ? `/executions?workflowId=${workflowId}` 
      : '/executions';
    return callN8nApi({ endpoint });
  }, [callN8nApi]);

  const getExecution = useCallback(async (executionId: string) => {
    return callN8nApi({ endpoint: `/executions/${executionId}` });
  }, [callN8nApi]);

  return {
    callN8nApi,
    getWorkflows,
    getWorkflow,
    getExecutions,
    getExecution,
  };
};
