import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY")
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { newsletterId, audience, phase, leadIds } = await req.json()
        if (!newsletterId) throw new Error("Missing newsletterId");

        // 1. Get the newsletter HTML content
        const { data: newsletter, error: nlError } = await supabaseClient
            .from('newsletters')
            .select('*')
            .eq('id', newsletterId)
            .single()

        if (nlError || !newsletter) throw new Error("Newsletter not found")
        if (newsletter.status === 'sent') throw new Error("Newsletter already sent")

        // 2. Build the query to get subscribed leads with emails based on audience
        let leadsQuery = supabaseClient
            .from('leads')
            .select('email, name')
            .eq('is_subscribed', true)
            .not('email', 'is', null)
            .not('email', 'eq', '');

        if (audience === 'phase' && phase) {
            leadsQuery = leadsQuery.eq('status', phase);
        } else if (audience === 'manual' && Array.isArray(leadIds) && leadIds.length > 0) {
            leadsQuery = leadsQuery.in('id', leadIds);
        }

        const { data: leads, error: leadsError } = await leadsQuery;

        if (leadsError) throw leadsError
        if (!leads || leads.length === 0) {
            return new Response(JSON.stringify({ message: "No subscribed leads found" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 3. Send emails via Resend in batches
        console.log(`Sending to ${leads.length} leads...`)
        const emails = leads.map(lead => lead.email)

        // For simplicity, we use Resend's BCC to send to max 50 at a time, or looping.
        // Optimal way for Resend is utilizing Batch API: https://resend.com/docs/api-reference/emails/send-batch-emails

        // We'll prepare the batch request array limit 100 per API call based on Resend docs
        const batchData = leads.map(lead => ({
            from: 'Mirapinos CRM <info@terravallpromociones.com>',
            to: [lead.email],
            subject: newsletter.subject,
            html: newsletter.html_content.replace('{{name}}', lead.name || 'Cliente'), // Simple merge tag
        }))

        const CHUNK_SIZE = 100;
        for (let i = 0; i < batchData.length; i += CHUNK_SIZE) {
            const chunk = batchData.slice(i, i + CHUNK_SIZE);

            const res = await fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chunk)
            });

            if (!res.ok) {
                const errBody = await res.json();
                console.error("Resend API error:", errBody);
                return new Response(JSON.stringify({ error: errBody.message || `Resend Error: ${res.statusText}` }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                });
            }
        }

        console.log(`Successfully sent newsletter to ${leads.length} contacts`);

        // 4. Mark newsletter as sent
        await supabaseClient
            .from('newsletters')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', newsletterId)

        return new Response(JSON.stringify({ success: true, count: leads.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
