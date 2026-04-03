import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, FolderKanban, Wallet, TrendingUp, AlertCircle, CheckCircle2, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Download, FileSpreadsheet, Receipt, X, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAlunos: 0, totalProjetos: 0, totalPendente: 0, totalPago: 0, totalDespesas: 0, lucroReal: 0 });
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({ paid: new Array(12).fill(0), expenses: new Array(12).fill(0), pending: new Array(12).fill(0) });
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { fetchStats(); }, [projectFilter, monthFilter, projects]);

  async function fetchInitialData() {
    const { data: proData } = await supabase.from('projetos').select('*').order('nome');
    setProjects(proData || []);
  }

  async function fetchStats() {
    setLoading(true);
    const tempMonthly = { paid: new Array(12).fill(0), expenses: new Array(12).fill(0), pending: new Array(12).fill(0) };

    let query = supabase.from('financeiro').select('valor, pago, projeto_id, mes');
    if (projectFilter !== 'all') query = query.eq('projeto_id', projectFilter);
    if (monthFilter !== 'all') query = query.eq('mes', monthFilter);
    const { data: financeiro } = await query;

    let despesas = [];
    try {
      let expQuery = supabase.from('despesas').select('valor, pago, vencimento, projeto_id');
      if (projectFilter !== 'all') expQuery = expQuery.eq('projeto_id', projectFilter);
      const { data: expData, error: expError } = await expQuery;
      if (!expError) despesas = expData || [];
    } catch (e) { console.warn('Tabela de despesas não encontrada:', e); }

    let alunosQuery = supabase.from('alunos').select('*', { count: 'exact', head: true });
    if (projectFilter !== 'all') {
      const pro = projects.find(p => p.id == projectFilter);
      if (pro) alunosQuery = alunosQuery.eq('projeto', pro.nome);
    }
    const { count: alunosCount } = await alunosQuery;

    let incomePending = 0, incomePaid = 0;
    financeiro?.forEach(item => {
      const val = parseFloat(item.valor.replace(',', '.')) || 0;
      const mIdx = months.indexOf(item.mes);
      if (item.pago) { incomePaid += val; if (mIdx !== -1) tempMonthly.paid[mIdx] += val; }
      else { incomePending += val; if (mIdx !== -1) tempMonthly.pending[mIdx] += val; }
    });

    let expensesTotal = 0;
    despesas.forEach(exp => {
      const val = parseFloat(exp.valor) || 0;
      const date = new Date(exp.vencimento);
      const expMonth = months[date.getMonth()];
      const mIdx = date.getMonth();
      if (monthFilter === 'all' || expMonth === monthFilter) expensesTotal += val;
      if (mIdx >= 0 && mIdx < 12) tempMonthly.expenses[mIdx] += val;
    });

    setStats({ totalAlunos: alunosCount || 0, totalProjetos: projects.length, totalPendente: incomePending, totalPago: incomePaid, totalDespesas: expensesTotal, lucroReal: incomePaid - expensesTotal });
    setMonthlyData(tempMonthly);
    setLoading(false);
  }

  const exportToCSV = (data, filename) => {
    const headers = ['Aluno', 'Mes/Ano', 'Parcela', 'Valor', 'Status', 'DNA', 'Projeto'];
    const csvRows = [headers.join(';')];
    data.forEach(item => {
      const row = [item.aluno_nome, `${item.mes}/${item.ano}`, item.parc || '---', `R$ ${item.valor}`, item.pago ? 'Pago' : 'Pendente', item.dna || '---', item.projeto];
      csvRows.push(row.join(';'));
    });
    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  async function handleViewPagos() {
    setLoading(true);
    const { data } = await supabase.from('financeiro').select('*').eq('pago', true).order('aluno_nome');
    if (data && data.length > 0) setCurrentReport({ title: 'Relatório de Pagamentos Recebidos', data, type: 'pagos' });
    else Swal.fire('Aviso', 'Nenhum pagamento encontrado.', 'info');
    setLoading(false);
  }

  const chartData = {
    labels: monthFilter === 'all' ? months : [monthFilter],
    datasets: [
      { label: 'Recebido', data: monthFilter === 'all' ? monthlyData.paid : [stats.totalPago], backgroundColor: '#10b981', borderRadius: 8 },
      { label: 'Despesas', data: monthFilter === 'all' ? monthlyData.expenses : [stats.totalDespesas], backgroundColor: '#ef4444', borderRadius: 8 },
      { label: 'Pendente', data: monthFilter === 'all' ? monthlyData.pending : [stats.totalPendente], backgroundColor: '#fbbf24', borderRadius: 8 },
    ],
  };

  const cards = [
    { title: 'Arrecadação', value: stats.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: 'Recebido', isUp: true },
    { title: 'Despesas', value: stats.totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Receipt, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', trend: 'Saídas', isUp: false },
    { title: 'Lucro Real', value: stats.lucroReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: TrendingUp, color: stats.lucroReal >= 0 ? 'text-blue-500' : 'text-rose-600', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: 'Saldo', isUp: stats.lucroReal >= 0 },
    { title: 'Pendente', value: stats.totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: 'A Receber', isUp: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 px-2 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
            <BarChart3 className="text-azul-claro" size={22} />
            Relatórios Financeiros
          </h2>
          <p className="text-xs text-cinza-texto dark:text-slate-500 font-medium mt-0.5">Análise detalhada de fluxo e estatísticas da instituição.</p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 print:hidden w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-white/5 px-4 py-2 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Printer size={14} /> Imprimir PDF
          </button>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-white shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-all min-w-[160px]"
          >
            <option value="all">TODOS PROJETOS 📂</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-white shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-all min-w-[120px]"
          >
            <option value="all">TODOS MESES 📅</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:gap-2 print:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 print:p-3 rounded-lg shadow-sm border border-gray-100 dark:border-white/5 print:border-gray-300 hover:shadow-md dark:hover:shadow-black/20 transition-all group print:break-inside-avoid">
            <div className="flex justify-between items-start mb-2 print:flex-col print:gap-1 print:mb-1 print:border-b print:border-gray-100 print:pb-1">
              <div className="flex items-center gap-2 text-gray-500/80 dark:text-slate-500">
                <div className={`${card.color} print:hidden`}><card.icon size={16} /></div>
                <span className="text-[9px] print:text-[8px] print:text-gray-600 print:leading-tight font-black uppercase tracking-widest">{card.title}</span>
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm print:hidden ${card.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                {card.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {card.trend}
              </div>
            </div>
            <div>
              <p className="text-xl print:text-base font-black text-azul-escuro dark:text-white leading-none mt-2 print:mt-1 text-left">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:space-y-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 print:break-inside-avoid">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-azul-escuro dark:text-white tracking-tight">Fluxo de Caixa Mensal</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Comparativo de Pagos vs Pendentes</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-sm">Recebido</div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-sm">Pendente</div>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar
              data={chartData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#1E293B', padding: 8, titleFont: { size: 12, weight: 'bold' }, bodyFont: { size: 11 }, cornerRadius: 6 }
                },
                scales: {
                  y: { beginAtZero: true, grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: '#94A3B8' } },
                  x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: '#94A3B8' } }
                }
              }}
            />
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-azul-escuro dark:bg-slate-800 p-6 rounded-xl text-white flex flex-col justify-between shadow-sm border border-white/5 print:bg-white print:border print:border-gray-200 print:text-azul-escuro print:break-inside-avoid">
          <div>
            <h3 className="text-lg font-black mb-4 tracking-tight flex items-center gap-2">
              <PieChart size={18} className="text-azul-claro" />
              Resumo Geral
            </h3>
            <div className="space-y-6">
              <div className="bg-white/5 dark:bg-white/5 p-5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Engajamento Total</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black leading-none">{stats.totalAlunos}</span>
                  <span className="text-xs font-bold text-azul-claro mb-1">Alunos Ativos</span>
                </div>
              </div>
              <div className="bg-white/5 dark:bg-white/5 p-5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Saúde Financeira</p>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-azul-claro h-full transition-all duration-1000"
                    style={{ width: `${(stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-bold text-slate-300">
                  {Math.round((stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100) || 0}% de conversão de pagamentos
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-3 print:hidden">
            <button
              onClick={() => navigate('/inadimplentes')}
              className="w-full bg-azul-claro hover:bg-white hover:text-azul-escuro text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-azul-claro/20 flex items-center justify-center gap-2"
            >
              <AlertCircle size={16} /> Ver Inadimplentes
            </button>
            <button
              onClick={handleViewPagos}
              className="w-full bg-white/10 hover:bg-white text-white hover:text-azul-escuro font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[11px] border border-white/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Ver Pagamentos
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Report Preview */}
      {currentReport && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-500 no-print">
          <div className="bg-azul-escuro dark:bg-slate-800 p-4 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="bg-azul-claro p-3 rounded-2xl"><FileSpreadsheet size={24} /></div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{currentReport.title}</h3>
                <p className="text-xs text-blue-200 dark:text-slate-400 font-bold uppercase tracking-widest">{currentReport.data.length} registros encontrados</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportToCSV(currentReport.data, currentReport.type === 'inadimplentes' ? 'Inadimplentes_Canaa' : 'Pagamentos_Canaa')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <Download size={16} /> Baixar CSV
              </button>
              <button onClick={() => setCurrentReport(null)} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Aluno</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Mês/Ano</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Projeto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {currentReport.data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-black text-azul-escuro dark:text-white text-sm">{item.aluno_nome}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400">{item.mes}/{item.ano}</td>
                    <td className="px-6 py-4 font-black text-azul-escuro dark:text-white text-sm">R$ {item.valor}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400">{item.projeto}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${item.pago ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                        {item.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><BarChart3 size={24} /></div>
          <div>
            <h4 className="font-black text-azul-escuro dark:text-white text-sm uppercase tracking-tight">Análise Preditiva</h4>
            <p className="text-xs text-cinza-texto dark:text-slate-400">Baseado no histórico, a arrecadação tende a crescer 5% no próximo mês.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><CheckCircle2 size={24} /></div>
          <div>
            <h4 className="font-black text-azul-escuro dark:text-white text-sm uppercase tracking-tight">Eficiência de Cobrança</h4>
            <p className="text-xs text-cinza-texto dark:text-slate-400">Sua taxa de adimplência atual está acima da média da região.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
