import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Receipt,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer
} from 'lucide-react';
import Swal from 'sweetalert2';

const categories = [
  'Salário', 
  'Aluguel', 
  'Luz/Água/Internet', 
  'Impostos', 
  'Materiais', 
  'Manutenção',
  'Marketing',
  'Diversos'
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(months[new Date().getMonth()]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  // Form states
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: 'Materiais',
    vencimento: new Date().toISOString().split('T')[0],
    pago: false,
    data_pagamento: '',
    projeto_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [monthFilter, yearFilter]);

  async function fetchData() {
    setLoading(true);
    const { data: expData, error } = await supabase
      .from('despesas')
      .select('*, projetos(nome)')
      .order('vencimento', { ascending: false });

    const { data: proData } = await supabase.from('projetos').select('*');

    if (!error) {
      setExpenses(expData || []);
    }
    setProjects(proData || []);
    setLoading(false);
  }

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        descricao: expense.descricao,
        valor: expense.valor,
        categoria: expense.categoria,
        vencimento: expense.vencimento,
        pago: expense.pago,
        data_pagamento: expense.data_pagamento || '',
        projeto_id: expense.projeto_id || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        descricao: '',
        valor: '',
        categoria: 'Materiais',
        vencimento: new Date().toISOString().split('T')[0],
        pago: false,
        data_pagamento: '',
        projeto_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    if (!payload.data_pagamento) delete payload.data_pagamento;
    if (!payload.projeto_id) delete payload.projeto_id;

    let res;
    if (editingExpense) {
      res = await supabase.from('despesas').update(payload).eq('id', editingExpense.id);
    } else {
      res = await supabase.from('despesas').insert([payload]);
    }

    if (!res.error) {
      Swal.fire({
        icon: 'success',
        title: editingExpense ? 'Atualizado!' : 'Cadastrado!',
        text: 'Despesa salva com sucesso.',
        timer: 1500,
        showConfirmButton: false,
        background: '#fff',
        borderRadius: '1.5rem'
      });
      setIsModalOpen(false);
      fetchData();
    } else {
      Swal.fire('Erro', 'Ocorreu um erro ao salvar a despesa.', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Tem certeza?',
      text: "Você não poderá reverter esta ação!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#132638',
      cancelButtonColor: '#E53E3E',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      borderRadius: '1.5rem'
    });

    if (isConfirmed) {
      const { error } = await supabase.from('despesas').delete().eq('id', id);
      if (!error) {
        Swal.fire('Excluído!', 'O registro foi removido.', 'success');
        fetchData();
      }
    }
  };

  const togglePago = async (expense) => {
    const { error } = await supabase
      .from('despesas')
      .update({ 
        pago: !expense.pago,
        data_pagamento: !expense.pago ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', expense.id);
    
    if (!error) fetchData();
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchSearch = exp.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || exp.categoria === categoryFilter;
    
    // Date parsing for month filter
    const expDate = new Date(exp.vencimento);
    const matchMonth = expDate.getMonth() === months.indexOf(monthFilter);
    const matchYear = expDate.getFullYear().toString() === yearFilter;

    return matchSearch && matchCategory && matchMonth && matchYear;
  });

  const totalPaid = filteredExpenses
    .filter(e => e.pago)
    .reduce((acc, e) => acc + parseFloat(e.valor), 0);
  
  const totalPending = filteredExpenses
    .filter(e => !e.pago)
    .reduce((acc, e) => acc + parseFloat(e.valor), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro flex items-center gap-2">
            <Receipt className="text-rose-500" size={22} />
            Gestão de Despesas
          </h2>
          <p className="text-xs text-cinza-texto font-medium mt-0.5">Controle todas as saídas e custos da instituição.</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Printer size={14} /> Imprimir PDF
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-azul-escuro text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={14} /> Nova Despesa
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-rose-500">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Saídas (Mês)</p>
          <p className="text-xl font-black text-azul-escuro">
            R$ {(totalPaid + totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pago</p>
          <p className="text-xl font-black text-emerald-600">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendente</p>
          <p className="text-xl font-black text-amber-600">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2 print:hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar por descrição..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 transition-all" 
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border-none">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border-none">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-azul-escuro text-white rounded-md outline-none text-[10px] font-black uppercase border-none cursor-pointer">
            <option value="all">TODAS CATEGORIAS</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center font-black text-azul-escuro/10 uppercase tracking-widest text-xl animate-pulse">Carregando despesas...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-20 text-center">
            <div className="bg-gray-50 text-gray-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} />
            </div>
            <h3 className="text-xl font-black text-azul-escuro">Nenhuma despesa</h3>
            <p className="text-gray-400 text-sm">Não encontramos registros para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest print:text-black">Descrição</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell print:table-cell print:text-black">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest print:text-black">Valor</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest print:text-black">Vencimento</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest print:text-black">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase tracking-widest w-20 print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExpenses.map((exp) => {
                  const isLate = !exp.pago && new Date(exp.vencimento) < new Date();
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-black text-azul-escuro text-sm uppercase">{exp.descricao}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell print:table-cell">
                        <span className="text-[9px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {exp.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-azul-escuro">
                        R$ {parseFloat(exp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-500">
                        {new Date(exp.vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        {exp.pago ? (
                          <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-fit print:border print:border-emerald-500">
                            <CheckCircle2 size={12} /> Pago
                          </span>
                        ) : (
                          <span className={`${isLate ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-fit print:border print:border-gray-500`}>
                            {isLate ? <AlertCircle size={12} /> : <XCircle size={12} />}
                            {isLate ? 'Atrasado' : 'Pendente'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right print:hidden">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => togglePago(exp)}
                            className={`p-2 rounded-lg transition-all ${exp.pago ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                          >
                            {exp.pago ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                          </button>
                          <button 
                            onClick={() => handleOpenModal(exp)}
                            className="p-2 text-gray-400 hover:text-azul-claro hover:bg-azul-claro/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(exp.id)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-azul-escuro text-white p-3 rounded-2xl">
                  {editingExpense ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-azul-escuro tracking-tight">
                    {editingExpense ? 'Editar Despesa' : 'Nova Saída'}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">Preencha os detalhes do custo.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 text-gray-400 hover:text-azul-escuro hover:bg-white rounded-2xl transition-all shadow-sm"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Descrição</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Ex: Aluguel da Sede"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-azul-claro focus:bg-white outline-none transition-all font-bold text-azul-escuro shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-azul-claro focus:bg-white outline-none transition-all font-mono font-bold text-azul-escuro shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Categoria</label>
                  <select 
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-azul-claro focus:bg-white outline-none transition-all font-bold text-azul-escuro shadow-inner"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vencimento</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.vencimento}
                    onChange={(e) => setFormData({...formData, vencimento: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-azul-claro focus:bg-white outline-none transition-all font-bold text-azul-escuro shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Projeto (Opcional)</label>
                  <select 
                    value={formData.projeto_id}
                    onChange={(e) => setFormData({...formData, projeto_id: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-azul-claro focus:bg-white outline-none transition-all font-bold text-azul-escuro shadow-inner"
                  >
                    <option value="">Nenhum</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <input 
                  type="checkbox" 
                  id="pago-checkbox"
                  checked={formData.pago}
                  onChange={(e) => setFormData({...formData, pago: e.target.checked, data_pagamento: e.target.checked ? new Date().toISOString().split('T')[0] : ''})}
                  className="w-5 h-5 rounded-md text-azul-claro focus:ring-azul-claro"
                />
                <label htmlFor="pago-checkbox" className="text-sm font-bold text-azul-escuro cursor-pointer">Já está pago?</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-black text-gray-400 hover:bg-gray-50 rounded-2xl transition-all uppercase text-[10px] tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-azul-escuro text-white font-black rounded-2xl shadow-xl shadow-azul-escuro/20 hover:scale-[1.02] active:scale-95 transition-all text-[10px] tracking-widest uppercase disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingExpense ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
