/**
 * Logger utilitário — registra ações no Supabase
 * @param {object} supabase - cliente supabase
 * @param {object} user - usuário autenticado (session.user)
 * @param {string} acao - código da ação: 'login', 'carne_criado', 'aluno_criado', etc.
 * @param {string} descricao - texto legível para humanos
 * @param {string} [entidade] - nome da tabela afetada
 * @param {string} [entidade_id] - ID do registro afetado
 */
export async function logAction(supabase, user, acao, descricao, entidade = null, entidade_id = null) {
  try {
    let ip = null;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ip = data.ip;
    } catch {
      ip = 'desconhecido';
    }

    await supabase.from('logs').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      acao,
      descricao,
      entidade,
      entidade_id: entidade_id ? String(entidade_id) : null,
      ip,
    });
  } catch (err) {
    // Silencia erros de log para não quebrar fluxos principais
    console.warn('[Logger] Falha ao registrar log:', err.message);
  }
}
