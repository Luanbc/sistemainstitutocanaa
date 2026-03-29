import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  ClipboardList, Search, LogIn, FileText, Users, CreditCard,
  AlertTriangle, Trash2, Edit3, ShieldCheck, Filter, Download, RefreshCw
} from 'lucide-react';

const ACAO_CONFIG = {
  login:          { icon: <LogIn size={14} />,       color: 'bg-blue-50 text-blue-600',    label: 'Login' },
  logout:         { icon: <LogIn size={14} />,        color: 'bg-slate-50 text-slate-500',  label: 'Logout' },
  carne_criado:   { icon: <FileText size={14} />,     color: 'bg-indigo-50 text-indigo-600',label: 'Carnê' },
  aluno_criado:   { icon: <Users size={14} />,        color: 'bg-emerald-50 text-emerald-600', label: 'Aluno' },
  aluno_editado:  { icon: <Edit3 size={14} />,        color: 'bg-amber-50 text-amber-600',  label: 'Edição' },
  aluno_excluido: { icon: <Trash2 size={14} />,       color: 'bg-rose-50 text-rose-600',    label: 'Exclusão' },
  pagamento_quitado: { icon: <CreditCard size={14} />, color: 'bg-green-50 text-green-600', label: 'Pagamento' },
  despesa_criada: { icon: <CreditCard size={14} />,   color: 'bg-orange-50 text-orange-600',label: 'Despesa' },
  acao_criada:    { icon: <ShieldCheck size={14} />,  color: 'bg-purple-50 text-purple-600',label: 'Ação' },
  contrato_gerado: { icon: <FileText size={14} />,     color: 'bg-teal-50 text-teal-600',    label: 'Contrato' },
};

const DEFAULT_CONFIG = { icon: <AlertTriangle size={14} />, color: 'bg-gray-50 text-gray-500', label: 'Evento' };

const ITEMS_PER_PAGE = 30;

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [acaoFilter, setAcaoFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

    if (acaoFilter !== 'all') query = query.eq('acao', acaoFilter);
    if (searchTerm) query = query.or(`user_email.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);

    const { data, count } = await query;
    setLogs(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, acaoFilter, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCSV = () => {
    const header = ['Data/Hora', 'Usuário', 'Ação', 'Descrição', 'Entidade', 'IP'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString('pt-BR'),
      l.user_email || '-',
      l.acao,
      l.descricao || '-',
      l.entidade || '-',
      l.ip || '-',
    ]);
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'logs.csv'; a.click();
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-azul-escuro tracking-tighter flex items-center gap-3">
            <ClipboardList className="text-azul-claro" size={32} /> Logs de Auditoria
          </h2>
          <p className="text-cinza-texto font-medium text-sm mt-1">
            Histórico de ações realizadas no sistema. <span className="font-black text-azul-escuro">{total}</span> registros encontrados.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-azul-escuro text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-azul-claro transition-all"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por email ou descrição..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-azul-claro/30 transition-all"
          />
        </div>
        <select
          value={acaoFilter}
          onChange={(e) => { setAcaoFilter(e.target.value); setPage(0); }}
          className="px-4 py-3 bg-azul-escuro text-white rounded-xl outline-none text-[10px] font-black uppercase border-none cursor-pointer min-w-[160px]"
        >
          <option value="all">TODAS AS AÇÕES</option>
          {Object.entries(ACAO_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center font-black text-azul-escuro/10 uppercase tracking-widest animate-pulse">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-black text-azul-escuro">Nenhum log encontrado.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">IP</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => {
                    const cfg = ACAO_CONFIG[log.acao] || DEFAULT_CONFIG;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 max-w-xs">{log.descricao || '—'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-azul-escuro">{log.user_email || '—'}</td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-400">{log.ip || '—'}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {logs.map((log) => {
                const cfg = ACAO_CONFIG[log.acao] || DEFAULT_CONFIG;
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-gray-700 mb-1">{log.descricao || '—'}</p>
                    <p className="text-[10px] font-bold text-azul-escuro">{log.user_email || '—'} · {log.ip || '—'}</p>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-50">
                <span className="text-xs text-gray-400 font-bold">
                  Página {page + 1} de {totalPages} · {total} registros
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-black rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-all"
                  >Anterior</button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 bg-azul-escuro text-white text-xs font-black rounded-lg disabled:opacity-30 hover:bg-azul-claro transition-all"
                  >Próxima</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
