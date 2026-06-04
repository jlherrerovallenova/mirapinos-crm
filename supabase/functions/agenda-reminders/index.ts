import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error("Variables de entorno no configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY)")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculamos el inicio y fin del día de hoy en hora local (España)
    // Para simplificar, usamos la fecha actual del servidor (UTC) y ajustamos si es necesario
    // Pero lo más fiable es buscar tareas cuya due_date esté entre hoy 00:00 y hoy 23:59
    const now = new Date()
    // Ajuste opcional para España (UTC+1 o UTC+2)
    // const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
    // const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
    
    // Usamos el formato YYYY-MM-DD para comparar fechas en SQL
    const todayStr = now.toISOString().split('T')[0]
    const startOfDay = `${todayStr}T00:00:00.000Z`
    const endOfDay = `${todayStr}T23:59:59.999Z`

    console.log(`Buscando tareas para el día: ${todayStr}`)

    const { data: tasks, error } = await supabase
      .from('agenda')
      .select(`
        id,
        title,
        due_date,
        type,
        lead_id,
        leads (
          name,
          phone
        )
      `)
      .eq('completed', false)
      .gte('due_date', startOfDay)
      .lte('due_date', endOfDay)

    if (error) {
      console.error("Error fetching tasks:", error)
      throw error
    }

    if (!tasks || tasks.length === 0) {
      console.log("No hay tareas pendientes para hoy.")
      return new Response(JSON.stringify({ message: "No hay tareas pendientes para hoy" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Encontradas ${tasks.length} tareas. Preparando envío...`)

    // Construir el cuerpo del correo
    const taskListHtml = tasks.map(task => {
      const date = new Date(task.due_date)
      const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
      const leadInfo = task.leads as any
      const leadName = leadInfo?.name || 'Cliente desconocido'
      const leadPhone = leadInfo?.phone || 'No disponible'
      
      return `
        <li style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background-color: #f8fafc; border-left: 4px solid #2563eb;">
          <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${time} - ${task.type}</div>
          <div style="margin-top: 5px; color: #475569; font-size: 16px;">${task.title}</div>
          <div style="margin-top: 10px; font-size: 14px; color: #64748b;">
            👤 Cliente: <strong>${leadName}</strong><br>
            📞 Teléfono: ${leadPhone}
          </div>
        </li>
      `
    }).join('')

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
        <div style="background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📅 Recordatorio de Citas</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Mirapinos CRM - Resumen Diario</p>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Hola <strong>Juan</strong>,</p>
          <p>Este es tu resumen de tareas pendientes para hoy, <strong>${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>:</p>
          
          <ul style="list-style: none; padding: 0; margin: 25px 0;">
            ${taskListHtml}
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://nbrbggvdtbvaoxsllemf.supabase.co" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Abrir Mirapinos CRM</a>
          </div>
          
          <hr style="margin: 40px 0 20px; border: 0; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Este es un correo automático generado por el sistema de gestión de Mirapinos.
          </p>
        </div>
      </div>
    `

    // Enviar correo via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mirapinos CRM <info@terravallpromociones.com>',
        to: ['juan@terravall.com'],
        subject: `📅 Recordatorio: ${tasks.length} citas para hoy`,
        html,
      }),
    })

    const resData = await res.json()
    if (!res.ok) throw new Error(resData.message || "Error al enviar correo con Resend")

    console.log("Correo enviado con éxito:", resData.id)

    return new Response(JSON.stringify({ success: true, count: tasks.length, messageId: resData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Critical error in edge function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

