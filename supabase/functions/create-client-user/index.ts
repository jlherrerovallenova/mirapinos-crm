import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verificar que el usuario que hace la petición es admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('No autorizado');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Solo los administradores pueden invitar clientes');
    }

    const { email, fullName, leadId } = await req.json();

    if (!email || !leadId) {
      throw new Error('Faltan datos obligatorios (email, leadId)');
    }

    // Cliente con service_role para operaciones admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Crear el usuario (invitación)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role: 'client'
      }
    });

    if (inviteError) {
      throw inviteError;
    }

    const newUserId = inviteData.user.id;

    // 2. Comprobar si el profile ya existe (por si hay triggers)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', newUserId)
      .single();

    if (!existingProfile) {
      // 3. Crear el profile si no existe
      await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        email: email,
        full_name: fullName || email,
        role: 'client'
      });
    } else {
      // Si existe, asegurarnos de que el rol es client
      await supabaseAdmin.from('profiles').update({ role: 'client' }).eq('id', newUserId);
    }

    // 4. Vincular el auth_user_id al lead
    const { error: leadError } = await supabaseAdmin
      .from('leads')
      .update({ auth_user_id: newUserId })
      .eq('id', leadId);

    if (leadError) throw leadError;

    return new Response(
      JSON.stringify({ success: true, message: 'Cliente invitado y vinculado correctamente', userId: newUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
