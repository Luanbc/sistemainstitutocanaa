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
    console.log("Full MP Notification received:", JSON.stringify(body));

    // MP sends the payment ID in different locations depending on the event
    const paymentId = body.data?.id || body.id || (body.resource && body.resource.split('/').pop());

    if (paymentId && (body.type === 'payment' || body.action?.includes('payment'))) {
      console.log(`Processing paymentId: ${paymentId}`);

      // 1. Fetch payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        }
      });
      const mpData = await mpResponse.json();
      console.log(`MP Payment Details: Status=${mpData.status}, Ref=${mpData.external_reference}`);

      if (mpData.status === 'approved') {
        const financeiroId = mpData.external_reference;
        
        if (!financeiroId || financeiroId === '0') {
          console.warn("Skipping update: external_reference is missing or '0'");
        } else {
          console.log(`UPDATING DATABASE: Setting Pago=true for ID=${financeiroId}`);
          const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
          const { data: updated, error: dbError } = await supabase
            .from('financeiro')
            .update({
              pago: true,
              data_pagamento: new Date().toISOString(),
              mp_status: 'approved'
            })
            .eq('id', financeiroId)
            .select();

          if (dbError) {
            console.error("Database Update Error:", dbError);
            throw dbError;
          }
          console.log("Database updated successfully!", updated);
        }
      } else {
        console.log(`Payment status is ${mpData.status}, not 'approved' yet.`);
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
