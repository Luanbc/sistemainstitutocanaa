const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://grmilcjrncnwdggfwosg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybWlsY2pybmNud2RnZ2Z3b3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk1NTgyNCwiZXhwIjoyMDg5NTMxODI0fQ.aoiZYj7aHJKcTyl5GaMGqM0NJbKuPDY0Ilbwz_8TMpc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Iniciando script de geração de PIX em lote...');

  // 1. Buscar todos os pagamentos pendentes
  const { data: payments, error } = await supabase
    .from('financeiro')
    .select('*')
    .eq('pago', false);

  if (error) {
    console.error('Erro ao buscar pagamentos:', error);
    process.exit(1);
  }

  console.log(`Encontrados ${payments.length} pagamentos pendentes no banco.`);

  const now = new Date();
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + 30); // 30 dias no futuro

  // 2. Filtrar pagamentos elegíveis (vencidos ou vencendo nos próximos 30 dias)
  const eligiblePayments = payments.filter(pay => {
    if (pay.is_bolsista) return false;
    if (!pay.vencimento || !pay.vencimento.includes('/')) return false;

    const [dayStr, monthStr, yearStr] = pay.vencimento.split('/');
    const dueDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));

    // Se o vencimento é menor que limitDate (vencido ou vencendo em até 30 dias)
    return dueDate <= limitDate;
  });

  console.log(`Filtrados ${eligiblePayments.length} pagamentos elegíveis (vencidos ou vencendo nos próximos 30 dias).`);

  if (eligiblePayments.length === 0) {
    console.log('Nenhuma parcela pendente elegível para gerar PIX dinâmico neste lote.');
    process.exit(0);
  }

  // 3. Gerar PIX para cada um
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < eligiblePayments.length; i++) {
    const pay = eligiblePayments[i];
    console.log(`[${i + 1}/${eligiblePayments.length}] Gerando PIX para ${pay.aluno_nome} - Parcela ${pay.parc} (Venc: ${pay.vencimento}, ID: ${pay.id})`);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('mp-generate-pix', {
        body: {
          paymentId: pay.id,
          amount: pay.valor,
          description: `Parcela ${pay.parc} - ${pay.aluno_nome}`,
          email: 'financeiro@canaa.com',
          vencimento: pay.vencimento
        }
      });

      if (invokeError) {
        console.error(`Erro ao invocar Edge Function para pagamento ${pay.id}:`, invokeError);
        failCount++;
      } else {
        console.log(`Sucesso: PIX gerado. MP ID: ${data.mp_id}`);
        successCount++;
      }
    } catch (e) {
      console.error(`Exceção ao processar pagamento ${pay.id}:`, e.message);
      failCount++;
    }

    // Pequeno atraso para evitar sobrecarga de requisições na API do Mercado Pago
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n=== FIM DO PROCESSAMENTO ===`);
  console.log(`Total elegível: ${eligiblePayments.length}`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
}

run();
