import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  AlertCircle,
  Search,
  MessageSquare,
  TrendingDown,
  User,
  Calendar,
  ArrowRight,
  SendHorizonal
} from 'lucide-react';
import Swal from 'sweetalert2';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Inadimplentes() {
  const [inadimplentes, setInadimplentes] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [overdueFilter, setOverdueFilter] = useState('overdue'); // all, overdue

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: payData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('pago', false)
      .order('vencimento', { ascending: true });

    const { data: stuData } = await supabase.from('alunos').select('*');
    const { data: proData } = await supabase.from('projetos').select('*');

    setInadimplentes(payData || []);
    setStudents(stuData || []);
    setProjects(proData || []);
    setLoading(false);
  }

  const isOverdue = (pay) => {
    let dueDate;
    if (pay.vencimento && pay.vencimento.includes('/')) {
      const [day, month, year] = pay.vencimento.split('/');
      dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (pay.mes && pay.ano) {
      const monthIdx = months.indexOf(pay.mes);
      if (monthIdx !== -1) {
        // Se não tem dia específico, assume o último dia daquele mês/ano
        dueDate = new Date(parseInt(pay.ano), monthIdx + 1, 0);
      }
    }

    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Começo do dia de hoje
    return dueDate < today;
  };

  const handleWhatsApp = async (pay) => {
    const student = students.find(s => s.id === pay.aluno_id);
    const phone = (student?.tel || pay.tel || '').replace(/\D/g, '');
    
    if (!phone) {
      Swal.fire('Erro', 'Aluno sem telefone cadastrado.', 'info');
      return;
    }

    const defaultStage = isOverdue(pay) ? 'late' : 'pre';

    const { value: stage } = await Swal.fire({
      title: 'Etapa de Cobrança',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px; text-align: left;">
          <p style="color: #64748B; font-size: 13px; margin-bottom: 5px; font-weight: 500; text-align: center;">Escolha o tom da mensagem para o WhatsApp:</p>

          <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid ${defaultStage === 'pre' ? '#38bdf8' : '#f1f5f9'}; border-radius: 14px; background: ${defaultStage === 'pre' ? '#f0f9ff' : '#f8fafc'}; cursor: pointer; transition: all 0.2s;" onclick="this.parentNode.querySelectorAll('label').forEach(l => {l.style.borderColor='#f1f5f9'; l.style.background='#f8fafc'}); this.style.borderColor='#38bdf8'; this.style.background='#f0f9ff';">
            <input type="radio" name="cobranca_stage" value="pre" ${defaultStage === 'pre' ? 'checked' : ''} style="margin-top: 0px; accent-color: #0284c7; width: 18px; height: 18px;" />
            <div style="flex: 1;">
              <strong style="display: block; color: #0f172a; font-size: 14px;">Lembrete (Pré-vencimento) 📅</strong>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid ${defaultStage === 'due' ? '#fbbf24' : '#f1f5f9'}; border-radius: 14px; background: ${defaultStage === 'due' ? '#fffbeb' : '#f8fafc'}; cursor: pointer; transition: all 0.2s;" onclick="this.parentNode.querySelectorAll('label').forEach(l => {l.style.borderColor='#f1f5f9'; l.style.background='#f8fafc'}); this.style.borderColor='#fbbf24'; this.style.background='#fffbeb';">
            <input type="radio" name="cobranca_stage" value="due" ${defaultStage === 'due' ? 'checked' : ''} style="margin-top: 0px; accent-color: #d97706; width: 18px; height: 18px;" />
            <div style="flex: 1;">
              <strong style="display: block; color: #0f172a; font-size: 14px;">Vencimento Hoje ⚠️</strong>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid ${defaultStage === 'late' ? '#fb7185' : '#f1f5f9'}; border-radius: 14px; background: ${defaultStage === 'late' ? '#fff1f2' : '#f8fafc'}; cursor: pointer; transition: all 0.2s;" onclick="this.parentNode.querySelectorAll('label').forEach(l => {l.style.borderColor='#f1f5f9'; l.style.background='#f8fafc'}); this.style.borderColor='#fb7185'; this.style.background='#fff1f2';">
            <input type="radio" name="cobranca_stage" value="late" ${defaultStage === 'late' ? 'checked' : ''} style="margin-top: 0px; accent-color: #e11d48; width: 18px; height: 18px;" />
            <div style="flex: 1;">
              <strong style="display: block; color: #0f172a; font-size: 14px;">Atraso (&lt; 7 dias) 🚨</strong>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid ${defaultStage === 'crit' ? '#ef4444' : '#f1f5f9'}; border-radius: 14px; background: ${defaultStage === 'crit' ? '#fef2f2' : '#f8fafc'}; cursor: pointer; transition: all 0.2s;" onclick="this.parentNode.querySelectorAll('label').forEach(l => {l.style.borderColor='#f1f5f9'; l.style.background='#f8fafc'}); this.style.borderColor='#ef4444'; this.style.background='#fef2f2';">
            <input type="radio" name="cobranca_stage" value="crit" ${defaultStage === 'crit' ? 'checked' : ''} style="margin-top: 0px; accent-color: #b91c1c; width: 18px; height: 18px;" />
            <div style="flex: 1;">
              <strong style="display: block; color: #0f172a; font-size: 14px;">Notificação Crítica ❌</strong>
            </div>
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Avançar p/ WhatsApp 💬',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      customClass: {
        popup: '!rounded-3xl',
        confirmButton: '!rounded-xl px-5 py-3 font-black tracking-widest uppercase text-[11px] shadow-lg shadow-emerald-500/30',
        cancelButton: '!rounded-xl px-5 py-3 font-black tracking-widest uppercase text-[11px]'
      },
      preConfirm: () => {
        const selected = document.querySelector('input[name="cobranca_stage"]:checked');
        if (!selected) {
          Swal.showValidationMessage('Selecione uma etapa de cobrança!');
          return false;
        }
        return selected.value;
      }
    });

    if (!stage) return;

    let intro = "";
    switch (stage) {
      case 'pre':
        intro = `Olá! Sou do *Instituto Canaã*. Gostaríamos de lembrar sobre o vencimento da mensalidade do(a) aluno(a) *${pay.aluno_nome}* referente a *${pay.mes}/${pay.ano}*.`;
        break;
      case 'due':
        intro = `Olá! Tudo bem? Passando para avisar que a mensalidade do(a) aluno(a) *${pay.aluno_nome}* referente a *${pay.mes}/${pay.ano}* vence *hoje*.`;
        break;
      case 'late':
        intro = `Olá! Notamos que a mensalidade do(a) aluno(a) *${pay.aluno_nome}* referente a *${pay.mes}/${pay.ano}* ainda consta em aberto no sistema. Gostaria de uma nova via ou suporte?`;
        break;
      case 'crit':
        intro = `⚠️ *AVISO FINANCEIRO:* A mensalidade do(a) aluno(a) *${pay.aluno_nome}* (${pay.mes}/${pay.ano}) está em atraso. Por favor, pedimos a regularização para evitar a suspensão da vaga do projeto.`;
        break;
    }

    let msg = intro + `\n\n*Valor:* R$ ${pay.valor} \n*Vencimento:* ${pay.vencimento || `${pay.mes}/${pay.ano}`} \n*Status:* PENDENTE ⚠️`;
    
    if (pay.mp_qr_code) {
      msg += `\n\n*CÓDIGO PIX COPIA E COLA:*\n\n${pay.mp_qr_code}\n\n_(Toque e segure no código acima para copiar e colar no seu banco na opção 'Pix Copia e Cola')_`;
    }

    msg += `\n\nAgradecemos a parceria!`;
    const url = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filtered = inadimplentes.filter(p => {
    const nameMatch = p.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const projectMatch = projectFilter === 'all' || p.projeto_id === projectFilter || p.projeto === projectFilter;
    const monthMatch = monthFilter === 'all' || p.mes === monthFilter;

    const overdueStatus = isOverdue(p);
    const overdueMatch = overdueFilter === 'all' || (overdueFilter === 'overdue' ? overdueStatus : !overdueStatus);

    return nameMatch && projectMatch && monthMatch && overdueMatch;
  });

  const totalAtrasado = inadimplentes
    .filter(p => isOverdue(p))
    .reduce((acc, p) => acc + parseFloat(p.valor.toString().replace(',', '.')), 0);

  const totalAVencer = inadimplentes
    .filter(p => !isOverdue(p))
    .reduce((acc, p) => acc + parseFloat(p.valor.toString().replace(',', '.')), 0);

  const totalAlunosInadimplentes = new Set(inadimplentes.filter(p => isOverdue(p)).map(p => p.aluno_id)).size;

  const handleBulkWhatsApp = async () => {
    const overdueWithPhone = filtered.filter(p => {
      const student = students.find(s => s.id === p.aluno_id);
      const phone = (student?.tel || p.tel || '').replace(/\D/g, '');
      return phone.length >= 10;
    });

    if (overdueWithPhone.length === 0) {
      Swal.fire('Aviso', 'Nenhum aluno com telefone cadastrado na lista atual.', 'info');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Notificar em Lote',
      html: `Serão enviadas mensagens para <b>${overdueWithPhone.length}</b> aluno(s).<br/><br/>O WhatsApp será aberto para cada um sequencialmente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#132638',
      cancelButtonColor: '#E53E3E',
      confirmButtonText: 'Iniciar Envio',
      cancelButtonText: 'Cancelar',
    });

    if (!isConfirmed) return;

    for (let i = 0; i < overdueWithPhone.length; i++) {
      const pay = overdueWithPhone[i];
      const student = students.find(s => s.id === pay.aluno_id);
      const phone = (student?.tel || pay.tel || '').replace(/\D/g, '');
      const overdue = isOverdue(pay);
      const intro = overdue
        ? `⚠️ *AVISO FINANCEIRO:* A mensalidade de *${pay.aluno_nome}* (${pay.mes}/${pay.ano}) está em atraso. Por favor regularize para evitar a suspensão da vaga.`
        : `Olá! Sou do *Instituto Canaã*. Lembramos que a mensalidade de *${pay.aluno_nome}* refente a *${pay.mes}/${pay.ano}* vence em breve.`;

      let msg = intro + `\n\n*Valor:* R$ ${pay.valor}\n*Status:* ${overdue ? 'ATRASADO 🚨' : 'A VENCER ⏳'}`;
      if (pay.mp_qr_code) msg += `\n\n*PIX COPIA E COLA:*\n${pay.mp_qr_code}`;
      msg += `\n\nAgradecemos a parceria! 🙏`;

      window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`, '_blank');

      if (i < overdueWithPhone.length - 1) {
        await Swal.fire({
          title: `Enviando... ${i + 1}/${overdueWithPhone.length}`,
          text: `Próximo: ${overdueWithPhone[i + 1]?.aluno_nome}`,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          icon: 'info',
        });
      }
    }

    Swal.fire('Concluído! ✅', `Mensagens enviadas para ${overdueWithPhone.length} aluno(s).`, 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-2 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro flex items-center gap-2">
            <AlertCircle className="text-rose-500" size={22} />
            Inadimplentes
          </h2>
          <p className="text-cinza-texto font-medium text-xs mt-0.5">Controle de atrasos e pendências financeiras.</p>
        </div>
        <button
          onClick={handleBulkWhatsApp}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SendHorizonal size={14} /> Notificar Todos ({filtered.length})
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-rose-500/80">
              <TrendingDown size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Total Já Vencido</span>
            </div>
            <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">Atrasados</span>
          </div>
          <div>
            <p className="text-xl font-black text-azul-escuro tracking-tighter">
              R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all border-l-4 border-l-azul-claro">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-blue-600/80">
              <Calendar size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Total Futuro</span>
            </div>
            <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">A Vencer</span>
          </div>
          <div>
            <p className="text-xl font-black text-azul-escuro tracking-tighter">
              R$ {totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all sm:col-span-2 lg:col-span-1 border-l-4 border-l-gray-300">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-gray-500/80">
              <User size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Alunos em Atraso</span>
            </div>
            <span className="text-[9px] font-black uppercase text-gray-500 bg-gray-50 px-2 py-0.5 rounded-sm">Alunos</span>
          </div>
          <div>
            <p className="text-xl font-black text-azul-escuro tracking-tighter">{totalAlunosInadimplentes}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <select value={overdueFilter} onChange={(e) => setOverdueFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-azul-escuro text-white rounded-md outline-none text-[10px] font-black uppercase border-none cursor-pointer">
            <option value="overdue"> ATRASADOS 🚨</option>
            <option value="pending"> A VENCER ⏳</option>
            <option value="all"> TODOS 📂</option>
          </select>

          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border-none">
            <option value="all">TODOS PROJETOS</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>

          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border-none">
            <option value="all">TODOS MESES</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Table/Cards */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center font-black text-azul-escuro/10 uppercase tracking-widest text-xl animate-pulse">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="bg-emerald-50 text-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-azul-escuro">Tudo em dia!</h3>
            <p className="text-gray-400 text-sm">Nenhum pagamento pendente encontrado com esses filtros.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aluno</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Projeto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((pay) => {
                    const overdue = isOverdue(pay);
                    return (
                      <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-azul-escuro text-sm uppercase">{pay.aluno_nome}</span>
                            <span className="text-[10px] font-bold text-gray-400">{pay.dna}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase text-azul-claro bg-azul-claro/5 px-2 py-1 rounded-md border border-azul-claro/10">
                            {pay.projeto}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-600">{pay.vencimento || `${pay.mes}/${pay.ano}`}</span>
                            {overdue
                              ? <span className="text-[9px] font-black uppercase text-white bg-rose-500 w-fit px-2 py-0.5 rounded-full">Atrasado 🚨</span>
                              : <span className="text-[9px] font-black uppercase text-azul-claro bg-azul-claro/10 w-fit px-2 py-0.5 rounded-full">A Vencer</span>
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-azul-escuro">R$ {pay.valor}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleWhatsApp(pay)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${
                                overdue ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                              }`}
                            >
                              <MessageSquare size={14} /> {overdue ? 'Cobrar' : 'Lembrar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((pay) => {
                const overdue = isOverdue(pay);
                return (
                  <div key={pay.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-black text-azul-escuro text-sm uppercase truncate">{pay.aluno_nome}</span>
                          {overdue
                            ? <span className="text-[8px] font-black uppercase text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">🚨 Atrasado</span>
                            : <span className="text-[8px] font-black uppercase text-azul-claro bg-azul-claro/10 px-2 py-0.5 rounded-full">A Vencer</span>
                          }
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 font-bold">
                          <span className="bg-azul-claro/5 text-azul-claro px-1.5 py-0.5 rounded">{pay.projeto}</span>
                          <span>{pay.vencimento || `${pay.mes}/${pay.ano}`}</span>
                          <span className="font-black text-azul-escuro">R$ {pay.valor}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWhatsApp(pay)}
                        className={`shrink-0 p-2.5 rounded-xl transition-all ${
                          overdue ? 'bg-rose-500 text-white' : 'bg-green-50 text-green-600'
                        }`}
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

