import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    console.log("MP Notification received:", body);

    // Mercado Pago sends notifications for different types, we care about 'payment'
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id;

      // 1. Fetch payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        }
      });
      const mpData = await mpResponse.json();

      if (mpData.status === 'approved') {
        const financeiroId = mpData.external_reference;
        
        console.log(`Payment ${paymentId} approved for financeiroId ${financeiroId}`);

        // 2. Update database
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { error: dbError } = await supabase
          .from('financeiro')
          .update({
            pago: true,
            data_pagamento: new Date().toISOString(),
            mp_status: 'approved'
          })
          .eq('id', financeiroId);

        if (dbError) throw dbError;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
