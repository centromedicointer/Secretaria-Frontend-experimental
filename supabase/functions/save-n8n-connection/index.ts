
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Headers para habilitar CORS (Cross-Origin Resource Sharing)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Encripta un texto usando AES-GCM.
 * @param data El texto a encriptar.
 * @param key La llave de encriptación.
 * @returns El texto encriptado en formato Base64, prefijado con el vector de inicialización (IV).
 */
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // IV de 96 bits es el estándar para AES-GCM
  const encodedData = new TextEncoder().encode(data);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // Concatenar IV y el texto cifrado
  const buffer = new Uint8Array(iv.length + ciphertext.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(ciphertext), iv.length);
  
  // Devolver como una cadena Base64
  return btoa(String.fromCharCode.apply(null, Array.from(buffer)));
}

/**
 * Deriva una llave de encriptación segura a partir de un secreto.
 * @param secret El secreto proporcionado por el usuario.
 * @returns Una CryptoKey para usar con AES-GCM.
 */
async function getEncryptionKey(secret: string): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(secret);
    // Usamos SHA-256 para asegurarnos de que la llave tenga la longitud correcta (32 bytes)
    const keyHash = await crypto.subtle.digest('SHA-256', keyData);
    return await crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'AES-GCM' },
        false, // no exportable
        ['encrypt', 'decrypt']
    );
}

serve(async (req) => {
  // Manejar la solicitud pre-vuelo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('--- save-n8n-connection function invoked ---');

  try {
    // Crear un cliente de Supabase autenticado con el token del usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Obtener el usuario autenticado
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error('Unauthorized: No user found.');
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`Authenticated user: ${user.id}`);

    const { baseUrl, apiKey, workflowId } = await req.json();
    console.log(`Received connection data for baseUrl: ${baseUrl}`);

    if (!baseUrl || !apiKey) {
        console.error('Bad Request: Missing baseUrl or apiKey.');
        return new Response(JSON.stringify({ error: 'La URL Base y la API Key son obligatorias.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 1. Probar la conexión con n8n antes de guardar nada
    try {
        console.log('Testing n8n connection...');
        const testResponse = await fetch(`${baseUrl}/api/v1/workflows?limit=1`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        if (!testResponse.ok) {
            throw new Error(`La prueba de conexión falló con estado: ${testResponse.status}`);
        }
        console.log('n8n connection test successful.');
    } catch (e) {
        console.error('n8n connection test failed:', e.message);
        return new Response(JSON.stringify({ error: 'No se pudo conectar a n8n. Verifica la URL Base y la API Key.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 2. Encriptar la API Key
    console.log('Starting API key encryption...');
    const encryptionKeySecret = Deno.env.get('N8N_ENCRYPTION_KEY');
    if (!encryptionKeySecret) {
        console.error('N8N_ENCRYPTION_KEY secret not found!');
        throw new Error('La llave de encriptación (N8N_ENCRYPTION_KEY) no está configurada en los secretos de Supabase.');
    }
    console.log('Encryption key secret found.');
    
    const cryptoKey = await getEncryptionKey(encryptionKeySecret);
    console.log('CryptoKey derived.');

    const encryptedApiKey = await encrypt(apiKey, cryptoKey);
    console.log('API key encrypted successfully.');

    // 3. Guardar la configuración encriptada en la base de datos
    console.log('Upserting connection data into database...');
    const { error: upsertError } = await supabaseClient
      .from('n8n_connections')
      .upsert({
        user_id: user.id,
        base_url: baseUrl,
        api_key: encryptedApiKey,
        workflow_id: workflowId || null,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error upserting data:', upsertError);
      throw new Error('No se pudo guardar la configuración de la conexión.');
    }
    console.log('Connection data saved successfully.');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('An unexpected error occurred in save-n8n-connection:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
