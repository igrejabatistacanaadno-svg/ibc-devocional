/**
 * Supabase Edge Function: send-push
 * Envia notificações push para todos os inscritos ativos
 *
 * Deploy: supabase functions deploy send-push
 * Secrets necessários:
 *   supabase secrets set VAPID_PUBLIC_KEY=...
 *   supabase secrets set VAPID_PRIVATE_KEY=...
 *   supabase secrets set VAPID_SUBJECT=mailto:admin@igrejaibc.com
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web Push using Deno-compatible lib
// Note: for production, use a proper web-push Deno library
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { devotionalId, title } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Buscar todas as inscrições ativas
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true)

    if (error) throw error

    const payload = JSON.stringify({
      title: title ?? 'Nova devocional disponível',
      body: 'A devocional de hoje já está disponível no app da IBC.',
      devotionalId,
    })

    let sent = 0
    let failed = 0
    const failedEndpoints: string[] = []

    // Enviar push para cada inscrição
    for (const sub of subscriptions ?? []) {
      try {
        const pushPayload = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.keys_auth,
            p256dh: sub.keys_p256dh,
          },
        }

        // Integração com Web Push API externa (ex: ntfy, custom server)
        // Para uso real, implementar assinatura VAPID aqui
        // Exemplo com fetch para um endpoint de push:
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payload,
        })

        if (response.ok || response.status === 201) {
          sent++
        } else if (response.status === 410 || response.status === 404) {
          // Inscrição expirada
          failedEndpoints.push(sub.endpoint)
          failed++
        } else {
          failed++
        }
      } catch (pushErr) {
        console.error('Push error for', sub.endpoint, pushErr)
        failed++
      }
    }

    // Marcar inscrições expiradas como inativas
    if (failedEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .in('endpoint', failedEndpoints)
    }

    // Salvar log
    await supabase.from('notification_logs').insert({
      devotional_id: devotionalId,
      total_sent: sent,
      total_failed: failed,
    })

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
