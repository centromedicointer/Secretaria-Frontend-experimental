
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Desencripta un texto usando AES-GCM.
 */
async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  const buffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Deriva una llave de desencriptación.
 */
async function getDecryptionKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  return await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { endpoint, method = 'GET', body } = await req.json();

    // Obtener la configuración encriptada del usuario
    const { data: connectionData, error: connectionError } = await supabaseClient
      .from('n8n_connections')
      .select('base_url, api_key, workflow_id')
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connectionData) {
      console.error('Connection error:', connectionError);
      return new Response(JSON.stringify({ error: 'Configuración de N8n no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Desencriptar la API key
    const encryptionKeySecret = Deno.env.get('N8N_ENCRYPTION_KEY');
    if (!encryptionKeySecret) {
      console.error('N8N_ENCRYPTION_KEY not configured');
      throw new Error('N8N_ENCRYPTION_KEY no configurado');
    }

    const cryptoKey = await getDecryptionKey(encryptionKeySecret);
    const decryptedApiKey = await decrypt(connectionData.api_key, cryptoKey);

    // Limpiar la URL base - remover trailing slash si existe
    const cleanBaseUrl = connectionData.base_url.replace(/\/$/, '');
    
    // Construir la URL completa
    const url = `${cleanBaseUrl}/api/v1${endpoint}`;
    console.log('Making N8n API request to:', url);

    // Hacer la petición a N8n
    const n8nResponse = await fetch(url, {
      method,
      headers: {
        'X-N8N-API-KEY': decryptedApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log('N8n response status:', n8nResponse.status);
    console.log('N8n response headers:', Object.fromEntries(n8nResponse.headers.entries()));

    if (!n8nResponse.ok) {
      const responseText = await n8nResponse.text();
      console.error('N8n API error response:', responseText);
      
      // Intentar parsear como JSON, si no es posible, usar el texto
      let errorMessage;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || responseText;
      } catch {
        errorMessage = responseText;
      }

      throw new Error(`N8n API error (${n8nResponse.status}): ${errorMessage}`);
    }

    const responseText = await n8nResponse.text();
    console.log('N8n response text preview:', responseText.substring(0, 200));

    // Intentar parsear la respuesta como JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse N8n response as JSON:', parseError);
      console.error('Response text:', responseText);
      throw new Error('N8n devolvió una respuesta inválida (no JSON)');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in n8n-secure-api:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
