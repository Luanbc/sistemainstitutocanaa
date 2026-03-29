import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../lib/logger';
import Swal from 'sweetalert2';
import {
  Zap, Plus, Search, FolderKanban, MapPin, Calendar,
  Users, Edit3, Trash2, ChevronDown, ChevronUp, X, Save
} from 'lucide-react';

const months = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const EMPTY_FORM = {
  titulo: '', descricao: '', data_acao: '', local: '',
  total_atendimentos: '', observacoes: '', projeto_id: '', projeto: ''
};

export default function Actions() {
  const { user } = useAuth();
  const [acoes, setAcoes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: acoesData }, { data: projData }] = await Promise.all([
      supabase.from('acoes').select('*').order('data_acao', { ascending: false }),
      supabase.from('projetos').select('*').order('nome'),
    ]);
    setAcoes(acoesData || []);
    setProjects(projData || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProjectSelect = (e) => {
    const pid = e.target.value;
    const proj = projects.find(p => p.id === pid);
    setForm(f => ({ ...f, projeto_id: pid, projeto: proj?.nome || '' }));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (acao) => {
    setForm({
      titulo: acao.titulo || '',
      descricao: acao.descricao || '',
      data_acao: acao.data_acao || '',
      local: acao.local || '',
      total_atendimentos: acao.total_atendimentos || '',
      observacoes: acao.observacoes || '',
      projeto_id: acao.projeto_id || '',
      projeto: acao.projeto || '',
    });
    setEditingId(acao.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.titulo || !form.data_acao || !form.projeto_id) {
      return Swal.fire('Atenção', 'Preencha título, data e projeto.', 'warning');
    }
    setSaving(true);

    const payload = {
      ...form,
      total_atendimentos: parseInt(form.total_atendimentos) || 0,
      user_id: user?.id,
    };

    let error, data;
    if (editingId) {
      ({ error, data } = await supabase.from('acoes').update(payload).eq('id', editingId).select().single());
    } else {
      ({ error, data } = await supabase.from('acoes').insert(payload).select().single());
    }

    if (error) {
      setSaving(false);
      return Swal.fire('Erro', error.message, 'error');
    }

    await logAction(supabase, user, 'acao_criada',
      `Ação "${form.titulo}" (${form.projeto}) registrada.`, 'acoes', data?.id);

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    fetchData();

    Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: editingId ? 'Ação atualizada!' : 'Ação registrada!',
      showConfirmButton: false, timer: 2000,
    });
  };

  const handleDelete = async (acao) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Excluir Ação?',
      text: `"${acao.titulo}" será removida permanentemente.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#E53E3E', cancelButtonColor: '#132638',
      confirmButtonText: 'Sim, excluir', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    await supabase.from('acoes').delete().eq('id', acao.id);
    fetchData();
  };

  const filtered = acoes.filter(a => {
    const matchSearch = a.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
      || a.projeto?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProject = projectFilter === 'all' || a.projeto_id === projectFilter;
    const matchMonth = monthFilter === 'all' || (a.data_acao && new Date(a.data_acao).getMonth() === parseInt(monthFilter));
    return matchSearch && matchProject && matchMonth;
  });

  const totalAtendimentos = filtered.reduce((s, a) => s + (a.total_atendimentos || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-azul-escuro tracking-tighter flex items-center gap-3">
            <Zap className="text-azul-claro" size={32} /> Ações & Atendimentos
          </h2>
          <p className="text-cinza-texto font-medium text-sm mt-1">
            Registro de atividades e atendimentos por projeto.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3 bg-azul-escuro text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-azul-claro transition-all shadow-lg"
        >
          <Plus size={16} /> Nova Ação
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Ações', value: filtered.length, color: 'text-azul-escuro', bg: 'bg-blue-50', icon: <Zap size={20} className="text-azul-claro" /> },
          { label: 'Atendimentos', value: totalAtendimentos, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <Users size={20} className="text-emerald-500" /> },
          { label: 'Projetos', value: new Set(filtered.map(a => a.projeto_id)).size, color: 'text-indigo-700', bg: 'bg-indigo-50', icon: <FolderKanban size={20} className="text-indigo-500" /> },
          { label: 'Este Mês', value: filtered.filter(a => a.data_acao && new Date(a.data_acao).getMonth() === new Date().getMonth()).length, color: 'text-amber-700', bg: 'bg-amber-50', icon: <Calendar size={20} className="text-amber-500" /> },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-5 rounded-xl border border-white/60`}>
            <div className="flex items-center justify-between mb-2">{s.icon}</div>
            <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por título ou projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-azul-claro/30 transition-all"
          />
        </div>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
          className="px-4 py-3 bg-gray-50 rounded-xl outline-none text-[10px] font-black uppercase text-azul-escuro border-none min-w-[150px]">
          <option value="all">TODOS PROJETOS</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="px-4 py-3 bg-gray-50 rounded-xl outline-none text-[10px] font-black uppercase text-azul-escuro border-none min-w-[130px]">
          <option value="all">TODOS MESES</option>
          {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-black text-azul-escuro uppercase tracking-tight">
                {editingId ? 'Editar Ação' : 'Nova Ação'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Projeto */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Projeto *</label>
                <select value={form.projeto_id} onChange={handleProjectSelect}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm">
                  <option value="">Selecione...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              {/* Título */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Título *</label>
                <input type="text" value={form.titulo} onChange={(e) => setForm(f => ({...f, titulo: e.target.value}))}
                  placeholder="Ex: Aula de Futebol, Evento Beneficente..."
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm" />
              </div>
              {/* Data e Local */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Data *</label>
                  <input type="date" value={form.data_acao} onChange={(e) => setForm(f => ({...f, data_acao: e.target.value}))}
                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Total Atendidos</label>
                  <input type="number" min="0" value={form.total_atendimentos} onChange={(e) => setForm(f => ({...f, total_atendimentos: e.target.value}))}
                    placeholder="0"
                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm" />
                </div>
              </div>
              {/* Local */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1"><MapPin size={10} /> Local</label>
                <input type="text" value={form.local} onChange={(e) => setForm(f => ({...f, local: e.target.value}))}
                  placeholder="Ex: Quadra do Instituto, Sede..."
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm" />
              </div>
              {/* Descrição */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm(f => ({...f, descricao: e.target.value}))}
                  rows={3} placeholder="Descreva a atividade realizada..."
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm resize-none" />
              </div>
              {/* Observações */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Observações</label>
                <textarea value={form.observacoes} onChange={(e) => setForm(f => ({...f, observacoes: e.target.value}))}
                  rows={2} placeholder="Notas adicionais..."
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-sm resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-azul-escuro text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-azul-claro transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={14} /> {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center font-black text-azul-escuro/10 uppercase tracking-widest animate-pulse">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white py-20 rounded-xl border border-gray-100 text-center">
            <Zap size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-black text-azul-escuro">Nenhuma ação registrada.</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Nova Ação" para começar.</p>
          </div>
        ) : (
          filtered.map((acao) => {
            const isExpanded = expandedId === acao.id;
            return (
              <div key={acao.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-4 md:p-5 flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="bg-azul-escuro text-white rounded-lg p-2 text-center min-w-[52px] shrink-0">
                    <p className="text-xs font-black leading-none">
                      {new Date(acao.data_acao + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-black text-azul-escuro text-sm uppercase truncate">{acao.titulo}</h3>
                      <span className="text-[9px] font-black uppercase bg-azul-claro/10 text-azul-claro px-2 py-0.5 rounded-md shrink-0">{acao.projeto}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-bold">
                      {acao.local && <span className="flex items-center gap-1"><MapPin size={10} /> {acao.local}</span>}
                      <span className="flex items-center gap-1"><Users size={10} /> {acao.total_atendimentos || 0} atendidos</span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                        {acao.descricao && <p className="text-sm text-gray-600">{acao.descricao}</p>}
                        {acao.observacoes && <p className="text-xs text-gray-400 italic">{acao.observacoes}</p>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpandedId(isExpanded ? null : acao.id)}
                      className="p-2 text-gray-400 hover:text-azul-escuro hover:bg-gray-100 rounded-lg transition-all">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => openEdit(acao)}
                      className="p-2 text-gray-400 hover:text-azul-claro hover:bg-blue-50 rounded-lg transition-all">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(acao)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
