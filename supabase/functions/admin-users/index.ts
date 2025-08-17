import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the session token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user's session and get user info
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin directly using the service role client
    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc('is_current_user_admin', { user_id_param: user.id })
    
    if (adminError) {
      console.error('Admin check error:', adminError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!isAdmin) {
      console.warn(`Access denied for user ${user.id}: not an admin`)
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Now proceed with admin operations using the admin client
    console.log(`Admin user ${user.id} accessing admin-users endpoint`)

    // Get all users
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Users fetch error:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get permissions for all users
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from('user_dashboard_permissions')
      .select('user_id, dashboard_type')

    if (permissionsError) {
      console.error('Permissions fetch error:', permissionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Combine user data with their permissions
    const userPermissions = authUsers.users.map(user => {
      const userPerms = permissions?.filter(p => p.user_id === user.id) || []
      return {
        user_id: user.id,
        user_email: user.email || 'No email',
        evolution_access: userPerms.some(p => p.dashboard_type === 'evolution'),
        n8n_access: userPerms.some(p => p.dashboard_type === 'n8n'),
        secretaria_access: userPerms.some(p => p.dashboard_type === 'secretaria'),
      }
    })

    return new Response(
      JSON.stringify({ 
        users: userPermissions,
        total_users: userPermissions.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error in admin-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})