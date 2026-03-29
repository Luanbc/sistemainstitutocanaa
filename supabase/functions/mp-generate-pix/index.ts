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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("Request received for generation...");

  try {
    const { paymentId, amount, description, email } = await req.json();
    console.log(`Payload: id=${paymentId}, amount=${amount}, desc=${description}`);

    if (!MP_ACCESS_TOKEN) {
      console.error("CRITICAL: MP_ACCESS_TOKEN is missing!");
      throw new Error("Missing MP_ACCESS_TOKEN");
    }

    const cleanAmount = parseFloat(amount.toString().replace(',', '.'));
    console.log(`Processing amount: ${cleanAmount}`);

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `pay-${paymentId}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: cleanAmount,
        description: description,
        payment_method_id: "pix",
        payer: {
          email: email || "aluno@canaa.com",
        },
        external_reference: paymentId.toString(),
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`
      })
    });

    const data = await mpResponse.json();
    console.log("MP Response received:", JSON.stringify(data).substring(0, 500));

    if (data.status === 400 || data.error || !data.id) {
       console.error("MP Error details:", data);
       return new Response(JSON.stringify({ error: data.message || "Erro na API do Mercado Pago", detail: data }), {
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

    console.log("Updating database with MP ID:", pixData.mp_id);

    // Update database only if a valid ID was provided
    if (paymentId && paymentId !== 0) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      const { error: dbError } = await supabase
        .from('financeiro')
        .update(pixData)
        .eq('id', paymentId);

      if (dbError) {
        console.error("Database Update Error:", dbError);
        throw dbError;
      }
      console.log("Successfully updated existing record in database.");
    } else {
      console.log("Skipping database update (new record generation mode).");
    }

    return new Response(JSON.stringify(pixData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Internal Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
