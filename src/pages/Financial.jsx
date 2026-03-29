import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  FolderKanban,
  User,
  CreditCard,
  History,
  MessageSquare
} from 'lucide-react';
import Swal from 'sweetalert2';
import CarneItem from '../components/financeiro/CarneItem';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Financial() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const [printingPayment, setPrintingPayment] = useState(null);
  const [printingStudentPayments, setPrintingStudentPayments] = useState([]);

  useEffect(() => {
    fetchData();

    // Redirecionamento em tempo real (Realtime)
    const channel = supabase
      .channel('financeiro_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'financeiro' }, (payload) => {
        setPayments(current =>
          current.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
        );
        if (payload.new.pago && payload.new.mp_status === 'approved') {
          Swal.fire({
            title: 'Pagamento Confirmado! 🎉',
            text: `O pagamento de ${payload.new.aluno_nome} foi processado automaticamente.`,
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: payData } = await supabase.from('financeiro').select('*').order('ano', { ascending: false }).order('mes_num', { ascending: false });
    const { data: stuData } = await supabase.from('alunos').select('*');
    const { data: proData } = await supabase.from('projetos').select('*');

    setPayments(payData || []);
    setStudents(stuData || []);
    setProjects(proData || []);
    setLoading(false);
  }

  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  async function handleGenerateDynamicPix(payment) {
    setIsGeneratingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('mp-generate-pix', {
        body: {
          paymentId: payment.id,
          amount: payment.valor,
          description: `Parcela ${payment.parc} - ${payment.aluno_nome}`,
          email: 'financeiro@canaa.com' // Idealmente pegar do aluno se tiver
        }
      });

      if (error) throw error;

      Swal.fire({
        title: 'PIX Gerado com Sucesso!',
        html: `
          <div class="flex flex-col items-center gap-4">
            <img src="data:image/png;base64,${data.mp_qr_code_64}" class="w-48 h-48 border rounded-lg shadow-sm" />
            <div class="w-full">
              <p class="text-[10px] font-bold text-gray-400 uppercase mb-2">Código Copia e Cola:</p>
              <textarea readonly class="w-full text-[10px] bg-gray-50 p-2 rounded border font-mono h-20 outline-none">${data.mp_qr_code}</textarea>
              <button onclick="navigator.clipboard.writeText('${data.mp_qr_code}')" class="mt-2 w-full bg-azul-claro text-white text-[10px] font-black uppercase py-2 rounded-lg">Copiar Código</button>
            </div>
            <p class="text-[9px] text-gray-400 italic">O sistema confirmará o pagamento automaticamente assim que processado.</p>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Fechar',
        confirmButtonColor: '#132638'
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível gerar o PIX dinâmico. Verifique se o serviço está ativo.', 'error');
    } finally {
      setIsGeneratingPix(false);
    }
  }

  async function handleWhatsApp(pay) {
    const student = students.find(s => s.id === pay.aluno_id);
    const phone = (student?.tel || pay.tel || '').replace(/\D/g, '');

    const { value: stage } = await Swal.fire({
      title: '<h3 class="text-2xl font-black text-azul-escuro">Cobrança WhatsApp</h3>',
      html: `
        <p class="text-sm text-gray-500 mb-2">Selecione o modelo de mensagem para enviar:</p>
        <style>
          .swal-whatsapp-radio .swal2-radio {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            align-items: stretch !important;
            margin-top: 15px !important;
            padding: 0 10px !important;
          }
          .swal-whatsapp-radio .swal2-radio label {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            justify-content: flex-start !important;
            padding: 14px 18px !important;
            background: #f8fafc !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 16px !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
          }
          .swal-whatsapp-radio .swal2-radio label:hover {
            border-color: #cbd5e1 !important;
            background: #f1f5f9 !important;
          }
          .swal-whatsapp-radio .swal2-radio input {
            transform: scale(1.2);
            accent-color: #10b981;
            margin: 0 !important;
          }
          .swal-whatsapp-radio .swal2-radio .swal2-label {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #334155 !important;
            margin: 0 !important;
            text-align: left !important;
          }
        </style>
      `,
      input: 'radio',
      inputOptions: {
        'pre': 'Lembrete (Pré-vencimento)',
        'due': 'Vencimento Hoje',
        'late': 'Aviso de Atraso (Até 7 dias)',
        'crit': 'Notificação Crítica (Urgente)'
      },
      inputValue: pay.pago ? 'pre' : (new Date() > new Date(pay.vencimento) ? 'late' : 'pre'),
      showCancelButton: true,
      confirmButtonText: 'ABRIR WHATSAPP',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#10b981', // Emerald 500
      cancelButtonColor: '#94a3b8',
      customClass: {
        popup: 'rounded-[2rem] swal-whatsapp-radio',
        confirmButton: 'font-black uppercase tracking-widest text-xs rounded-xl px-6 py-3 shadow-lg shadow-emerald-500/30 w-full mb-2',
        cancelButton: 'font-black uppercase tracking-widest text-xs rounded-xl px-6 py-3 w-full bg-gray-100 text-gray-500',
        actions: 'flex-col w-full px-6'
      },
      inputValidator: (value) => {
        if (!value) return 'Você precisa escolher uma opção!';
      }
    });

    if (!stage) return;

    let intro = "";
    switch (stage) {
      case 'pre':
        intro = `Olá! Somos do *Instituto Canaã*. Gostaríamos de lembrar sobre o vencimento da mensalidade do(a) aluno(a) *${pay.aluno_nome}* referente a *${pay.mes}/${pay.ano}*.`;
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

    let msg = intro + `\n\nAcesse seu boleto digital seguro para ver todas as informações, QR Code PIX:\n\n👉 *https://gestaocanaa.vercel.app/boleto/${pay.id}*\n\nAgradecemos a parceria!`;
    const url = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  async function handlePrintReceipt(pay) {
    const student = students.find(s => s.id === pay.aluno_id);
    const enrichedPay = {
      ...pay,
      aluno: pay.aluno_nome,
      resp: student?.resp || '---',
      cpf_resp: student?.cpf || '---',
      turma: student?.turma || '---',
      turno: student?.turno || '---',
      id: student?.codigo || '---'
    };
    setPrintingPayment(enrichedPay);
    setTimeout(() => {
      window.print();
      setPrintingPayment(null);
    }, 500);
  }

  async function handleTogglePaid(pay) {
    const { error } = await supabase
      .from('financeiro')
      .update({ pago: !pay.pago })
      .eq('id', pay.id);

    if (error) {
      Swal.fire('Erro', 'Não foi possível atualizar o status.', 'error');
    } else {
      fetchData();
    }
  }

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Esta ação não pode ser revertida!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('financeiro').delete().eq('id', id);
      if (error) {
        Swal.fire('Erro', 'Erro ao excluir parcela.', 'error');
      } else {
        fetchData();
        Swal.fire('Excluído!', 'Parcela removida.', 'success');
      }
    }
  }

  async function handlePayAll(alunoId) {
    const result = await Swal.fire({
      title: 'Quitar todas as parcelas?',
      text: "Isso marcará todas as mensalidades deste aluno como pagas.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, quitar tudo!',
      cancelButtonText: 'Voltar'
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('financeiro')
        .update({ pago: true })
        .eq('aluno_id', alunoId);

      if (error) {
        Swal.fire('Erro', 'Algum erro ocorreu ao atualizar o banco.', 'error');
      } else {
        fetchData();
        Swal.fire('Quitado!', 'As parcelas deste aluno foram quitadas com sucesso.', 'success');
      }
    }
  }

  async function handlePrintAllPayments(group) {
    const student = students.find(s => s.id === group.aluno_id);
    const studentPayments = [...group.payments].sort((a, b) => a.parc - b.parc); // Sort numerically by parc
    const enrichedPays = studentPayments.map(pay => ({
      ...pay,
      aluno: pay.aluno_nome,
      resp: student?.resp || '---',
      cpf_resp: student?.cpf || '---',
      turma: student?.turma || '---',
      turno: student?.turno || '---',
      id: student?.codigo || '---'
    }));
    setPrintingStudentPayments(enrichedPays);
    setTimeout(() => {
      window.print();
      setPrintingStudentPayments([]);
    }, 500);
  }

  async function handleDeleteAll(alunoId) {
    const result = await Swal.fire({
      title: 'Excluir todo o financeiro?',
      text: "Isso removerá todas as mensalidades deste aluno permanentemente!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir tudo!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('financeiro')
        .delete()
        .eq('aluno_id', alunoId);

      if (error) {
        Swal.fire('Erro', 'Erro ao remover financeiro.', 'error');
      } else {
        fetchData();
        Swal.fire('Excluído!', 'Todo o histórico financeiro foi removido.', 'success');
      }
    }
  }

  const filteredPayments = payments.filter(p => {
    const nameMatch = p.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || (statusFilter === 'paid' ? p.pago : !p.pago);
    const monthMatch = monthFilter === 'all' || p.mes === monthFilter;
    const projectMatch = projectFilter === 'all' || p.projeto_id === projectFilter || p.projeto === projectFilter;
    return nameMatch && statusMatch && monthMatch && projectMatch;
  });

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      Swal.fire('Aviso', 'Nenhum registro para exportar com os filtros atuais.', 'info');
      return;
    }

    const headers = ['Aluno', 'Mes/Ano', 'Parcela', 'Valor', 'Status', 'DNA', 'Projeto', 'Isento'];
    const csvRows = [headers.join(';')];

    filteredPayments.forEach(item => {
      const row = [
        item.aluno_nome,
        `${item.mes}/${item.ano}`,
        item.parc || '---',
        `R$ ${item.valor}`,
        item.pago ? 'Pago' : 'Pendente',
        item.dna || '---',
        item.projeto,
        item.is_bolsista ? 'Sim' : 'Nao'
      ];
      csvRows.push(row.join(';'));
    });

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Extrato_Financeiro_${new Date().getTime()}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Financial Totals
  const totalValue = filteredPayments.reduce((acc, p) => acc + parseFloat(p.valor.toString().replace(',', '.')), 0);
  const paidValue = filteredPayments.filter(p => p.pago).reduce((acc, p) => acc + parseFloat(p.valor.toString().replace(',', '.')), 0);
  const pendingValue = totalValue - paidValue;

  const grouped = filteredPayments.reduce((acc, p) => {
    if (!acc[p.aluno_id]) {
      const student = students.find(s => s.id === p.aluno_id);
      acc[p.aluno_id] = {
        aluno_id: p.aluno_id,
        nome: p.aluno_nome,
        codigo: student?.codigo || '---',
        turma: student?.turma || '---',
        turno: student?.turno || '---',
        projeto: p.projeto,
        payments: []
      };
    }
    acc[p.aluno_id].payments.push(p);
    return acc;
  }, {});

  const studentList = Object.values(grouped);
  const totalFilteredStudents = studentList.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 lg:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro flex items-center gap-2">
            <Wallet className="text-azul-claro" size={22} />
            Financeiro
          </h2>
          <p className="text-xs text-cinza-texto font-medium mt-0.5">Controle de mensalidades e balanço geral.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-azul-claro/10 px-3 py-1.5 rounded-lg border border-azul-claro/20 flex-1 sm:flex-none">
            <span className="text-[9px] font-black uppercase text-azul-claro block leading-tight">Alunos Ativos</span>
            <span className="text-base font-black text-azul-escuro">{totalFilteredStudents} {projectFilter !== 'all' ? 'no Projeto' : 'Total'}</span>
          </div>
          <button onClick={handleExportCSV} className="bg-azul-escuro text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-sm flex-1 sm:flex-none justify-center">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 no-print">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-azul-escuro/40 mb-1">
            <CreditCard size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Gerado</span>
          </div>
          <div className="text-xl font-black text-azul-escuro">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-azul-escuro w-full opacity-20"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500/60 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Pago</span>
          </div>
          <div className="text-xl font-black text-emerald-600">R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(paidValue / (totalValue || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500/60 mb-1">
            <AlertCircle size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Pendente</span>
          </div>
          <div className="text-xl font-black text-rose-600">R$ {pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${(pendingValue / (totalValue || 1)) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
          <input type="text" placeholder="Nome do aluno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 transition-all" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border border-transparent hover:bg-gray-100 transition-all cursor-pointer">
            <option value="all">TODOS PROJETOS</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border border-transparent hover:bg-gray-100 transition-all cursor-pointer">
            <option value="all">TODOS STATUS</option>
            <option value="paid">PAGOS ✅</option>
            <option value="pending">PENDENTES 🚨</option>
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border border-transparent hover:bg-gray-100 transition-all cursor-pointer">
            <option value="all">TODOS MESES</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2 no-print">
        {loading ? (
          <div className="py-16 text-center font-black text-azul-escuro/20 tracking-widest uppercase animate-pulse text-xs">CARREGANDO...</div>
        ) : studentList.map((group) => (
          <div key={group.aluno_id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-azul-claro">
            {/* Header Aluno - Compacto */}
            <div className="px-4 py-3 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-azul-claro uppercase tracking-tight bg-azul-claro/5 px-1.5 py-0.5 rounded">{group.codigo}</span>
                  <h3 className="text-sm font-black text-azul-escuro uppercase tracking-tight leading-none">{group.nome}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">T: {group.turma} — {group.turno}</span>
                  <span className="text-[9px] font-black uppercase text-azul-claro tracking-wider px-1.5 py-0.5 bg-azul-claro/5 rounded border border-azul-claro/10">{group.projeto}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => handlePrintAllPayments(group)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Imprimir Todos (Em Massa)">
                  <Printer size={11} /> <span className="hidden sm:inline">Imprimir Carnês</span>
                </button>
                {group.payments.some(p => !p.pago && !p.is_bolsista) && (
                  <button onClick={() => handlePayAll(group.aluno_id)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-600 transition-all shadow-sm">
                    <CheckCircle size={11} /> <span className="hidden sm:inline">Quitar</span>
                  </button>
                )}
                <button onClick={() => handleDeleteAll(group.aluno_id)} className="bg-white border border-red-100 text-red-400 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-red-50 hover:text-red-600 transition-all">
                  <Trash2 size={11} />
                </button>
                <button
                  onClick={() => setExpandedStudentId(expandedStudentId === group.aluno_id ? null : group.aluno_id)}
                  className="text-azul-escuro font-black text-[9px] uppercase flex items-center gap-1 hover:text-azul-claro bg-gray-50 px-3 py-1.5 rounded-md transition-all"
                >
                  Parcelas {expandedStudentId === group.aluno_id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
            </div>

            {/* Installments Table */}
            {expandedStudentId === group.aluno_id && (
              <div className="bg-gray-50/30 px-4 py-3 md:px-6 animate-in slide-in-from-top-1 duration-200">
                {/* Desktop parcelas table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                        <th className="pb-2 px-0">PARCELA / VENC.</th>
                        <th className="pb-2 px-3">PROJETO</th>
                        <th className="pb-2 px-3">VALOR</th>
                        <th className="pb-2 px-3 text-center">STATUS</th>
                        <th className="pb-2 px-0 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.payments.slice().reverse().map((pay) => (
                        <tr key={pay.id} className="hover:bg-white transition-all">
                          <td className="py-2 px-0">
                            <div className="flex flex-col">
                              <span className="font-black text-azul-escuro text-xs">{pay.parc || '---'} — {pay.vencimento || `${pay.mes}/${pay.ano}`}</span>
                              <span className="text-[8px] font-mono text-gray-300 tracking-tighter">{pay.dna}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3"><span className="text-[9px] font-black uppercase opacity-60">{pay.projeto}</span></td>
                          <td className="py-2 px-3 font-black text-azul-escuro text-xs">R$ {pay.valor}</td>
                          <td className="py-2 px-3 text-center">
                            {pay.is_bolsista ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-azul-claro border border-azul-claro/10">✨ Isento</span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${pay.pago ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {pay.pago ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
                                {pay.pago ? 'Pago' : 'Pendente'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-0">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleWhatsApp(pay)} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-600 hover:text-white transition-all" title="WhatsApp"><MessageSquare size={13} /></button>
                              <button onClick={() => handlePrintReceipt(pay)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all" title="Imprimir"><Printer size={13} /></button>
                              <button onClick={() => handleTogglePaid(pay)} className={`p-1.5 rounded transition-all ${pay.pago ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`} title={pay.pago ? 'Marcar Pendente' : 'Marcar Pago'}>{pay.pago ? <XCircle size={13} /> : <CheckCircle size={13} />}</button>
                              <button onClick={() => handleGenerateDynamicPix(pay)} disabled={pay.pago || isGeneratingPix} className={`p-1.5 rounded transition-all ${pay.pago ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-azul-claro/10 text-azul-claro hover:bg-azul-claro hover:text-white'}`} title="PIX Dinâmico"><CreditCard size={13} /></button>
                              <button onClick={() => handleDelete(pay.id)} className="p-1.5 bg-gray-50 text-gray-400 rounded hover:bg-red-500 hover:text-white transition-all"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile parcelas cards */}
                <div className="md:hidden space-y-2">
                  {group.payments.slice().reverse().map((pay) => (
                    <div key={pay.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-azul-escuro text-xs">{pay.parc} — {pay.vencimento || `${pay.mes}/${pay.ano}`}</p>
                          <p className="text-[9px] font-mono text-gray-300 truncate">{pay.dna}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {pay.is_bolsista ? (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-azul-claro">Isento</span>
                          ) : (
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${pay.pago ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {pay.pago ? '✔ Pago' : '⚠ Pendente'}
                            </span>
                          )}
                          <span className="font-black text-azul-escuro text-xs">R$ {pay.valor}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => handleWhatsApp(pay)} className="flex-1 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all flex items-center justify-center" title="WhatsApp">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => handlePrintReceipt(pay)} className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center" title="Imprimir">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleTogglePaid(pay)} className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center ${pay.pago ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                          {pay.pago ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button onClick={() => handleGenerateDynamicPix(pay)} disabled={pay.pago || isGeneratingPix} className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center ${pay.pago ? 'bg-gray-100 text-gray-300' : 'bg-azul-claro/10 text-azul-claro hover:bg-azul-claro hover:text-white'}`}>
                          <CreditCard size={14} />
                        </button>
                        <button onClick={() => handleDelete(pay.id)} className="flex-1 p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {printingPayment && <div className="fixed inset-0 bg-white z-[9999] p-10 print:block hidden"><div className="max-w-[700px] mx-auto"><CarneItem item={printingPayment} /></div></div>}
      {printingStudentPayments.length > 0 && <div className="fixed inset-0 bg-white z-[9999] p-6 print:block hidden flex-col gap-4 items-center"> {printingStudentPayments.map((p, i) => <CarneItem key={i} item={p} />)} </div>}
    </div>
  );
}
