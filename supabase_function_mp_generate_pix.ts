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
    const { paymentId, amount, description, email } = await req.json();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `pay-${paymentId}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(amount.toString().replace(',', '.')),
        description: description,
        payment_method_id: "pix",
        payer: {
          email: email || "aluno@canaa.com",
        },
        external_reference: paymentId.toString(),
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`
      })
    });

    const data = await response.json();

    if (data.status === 400 || data.error) {
       return new Response(JSON.stringify({ error: data.message || "Erro MP" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const pixData = {
      mp_id: data.id.toString(),
      mp_qr_code: data.point_of_interaction.transaction_data.qr_code,
      mp_qr_code_64: data.point_of_interaction.transaction_data.qr_code_base64,
      mp_status: data.status
    };

    // Update database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { error: dbError } = await supabase
      .from('financeiro')
      .update(pixData)
      .eq('id', paymentId);

    if (dbError) throw dbError;

    return new Response(JSON.stringify(pixData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
