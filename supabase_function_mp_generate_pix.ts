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
    const { paymentId, amount, description, email, vencimento } = await req.json();

    let expirationDateString: string | undefined = undefined;
    if (vencimento && typeof vencimento === 'string' && vencimento.includes('/')) {
      const [dayStr, monthStr, yearStr] = vencimento.split('/');
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const year = parseInt(yearStr, 10);
      
      const dueDate = new Date(year, month, day, 23, 59, 59);
      // Adiciona 30 dias de tolerância
      dueDate.setDate(dueDate.getDate() + 30);

      const now = new Date();
      const minExpiration = new Date(now.getTime() + 30 * 60 * 1000); // Mínimo de 30 minutos a partir de agora
      const maxExpiration = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000); // Máximo de 29 dias

      if (dueDate < minExpiration) {
        // Se já venceu há muito tempo (passou da tolerância de 30 dias), damos 24 horas de validade a partir de agora
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        expirationDateString = tomorrow.toISOString();
      } else if (dueDate > maxExpiration) {
        expirationDateString = maxExpiration.toISOString();
      } else {
        expirationDateString = dueDate.toISOString();
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      expirationDateString = tomorrow.toISOString();
    }

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
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        date_of_expiration: expirationDateString
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
