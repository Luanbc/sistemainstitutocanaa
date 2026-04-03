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
  MessageSquare,
  Eye,
  TrendingDown,
  ArrowRight,
  SendHorizonal,
  Receipt,
  History,
  Plus as PlusIcon,
  Filter as FilterIcon,
  MoreVertical,
  Edit2,
  XCircle as XCircleIcon,
  Save,
  CheckCircle2 as CheckCircle2Icon
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
  const [activeTab, setActiveTab] = useState('mensalidades'); // mensalidades, inadimplentes, carnes, despesas

  // Inadimplentes States
  const [inadimplentes, setInadimplentes] = useState([]);
  const [inadSearchTerm, setInadSearchTerm] = useState('');
  const [inadProjectFilter, setInadProjectFilter] = useState('all');
  const [inadMonthFilter, setInadMonthFilter] = useState('all');
  const [overdueFilter, setOverdueFilter] = useState('overdue');
  const [inadLoading, setInadLoading] = useState(false);

  const [printingPayment, setPrintingPayment] = useState(null);
  const [printingStudentPayments, setPrintingStudentPayments] = useState([]);

  // Carnes States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [installments, setInstallments] = useState(12);
  const [carneValue, setCarneValue] = useState('50,00');
  const [pularMes, setPularMes] = useState('');
  const [vencimentoDia, setVencimentoDia] = useState('10');
  const [isBolsista, setIsBolsista] = useState(false);
  const [previewSlips, setPreviewSlips] = useState([]);
  const [studentsWithCarnes, setStudentsWithCarnes] = useState(new Set());
  const [carneLoading, setCarneLoading] = useState(false);

  // Expenses States
  const [expenses, setExpenses] = useState([]);
  const [expLoading, setExpLoading] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expSearchTerm, setExpSearchTerm] = useState('');
  const [expCategoryFilter, setExpCategoryFilter] = useState('all');
  const [expMonthFilter, setExpMonthFilter] = useState(months[new Date().getMonth()]);
  const [expYearFilter, setExpYearFilter] = useState(new Date().getFullYear().toString());
  const [expFormData, setExpFormData] = useState({
    descricao: '',
    valor: '',
    categoria: 'Materiais',
    vencimento: new Date().toISOString().split('T')[0],
    pago: false,
    data_pagamento: '',
    projeto_id: ''
  });

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
    fetchInadimplentes();
    fetchStudentsWithCarnes();
    fetchExpenses();
  }

  async function fetchExpenses() {
    setExpLoading(true);
    const { data: expData, error } = await supabase
      .from('despesas')
      .select('*, projetos(nome)')
      .order('vencimento', { ascending: false });

    if (!error) {
      setExpenses(expData || []);
    }
    setExpLoading(false);
  }

  async function fetchStudentsWithCarnes() {
    const { data: finData } = await supabase.from('financeiro').select('aluno_id');
    const ids = new Set(finData?.map(f => f.aluno_id) || []);
    setStudentsWithCarnes(ids);
  }

  async function fetchInadimplentes() {
    setInadLoading(true);
    const { data: payData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('pago', false)
      .order('vencimento', { ascending: true });
    setInadimplentes(payData || []);
    setInadLoading(false);
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

  const isOverdue = (pay) => {
    let dueDate;
    if (pay.vencimento && pay.vencimento.includes('/')) {
      const [day, month, year] = pay.vencimento.split('/');
      dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (pay.mes && pay.ano) {
      const monthIdx = months.indexOf(pay.mes);
      if (monthIdx !== -1) {
        dueDate = new Date(parseInt(pay.ano), monthIdx + 1, 0);
      }
    }
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const filteredInadimplentes = inadimplentes.filter(p => {
    const nameMatch = p.aluno_nome.toLowerCase().includes(inadSearchTerm.toLowerCase());
    const projectMatch = inadProjectFilter === 'all' || p.projeto_id === inadProjectFilter || p.projeto === inadProjectFilter;
    const monthMatch = inadMonthFilter === 'all' || p.mes === inadMonthFilter;
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

  const totalAlunosInadimplentesCount = new Set(inadimplentes.filter(p => isOverdue(p)).map(p => p.aluno_id)).size;

  const handleBulkWhatsAppInad = async () => {
    const overdueWithPhone = filteredInadimplentes.filter(p => {
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

  const limparString = (t) => t ? t.normalize('NFD').replace(/[^A-Z0-9]/gi, '').toUpperCase() : '';

  const handlePreviewCarne = (e) => {
    if (e) e.preventDefault();
    if (!selectedStudentId || !selectedProjectId) {
      return Swal.fire('Atenção', 'Selecione o aluno e o projeto para gerar o preview.', 'warning');
    }

    const student = students.find(s => s.id === selectedStudentId);
    const project = projects.find(p => p.id === selectedProjectId);

    if (!project.pix) {
      return Swal.fire('Erro no Projeto', 'Este projeto não possui uma chave PIX cadastrada. Vá em "Administrativo" e adicione uma chave para continuar.', 'error');
    }

    const mesesPular = pularMes.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m));
    const slips = [];
    let mesesAdicionados = 0;
    let index = 0;

    while (mesesAdicionados < installments) {
      const d = new Date(startYear, parseInt(startMonth) + index, parseInt(vencimentoDia));
      index++;
      if (mesesPular.includes(d.getMonth() + 1)) continue;

      const vencimentoFormatado = d.toLocaleDateString('pt-BR');
      const dnaStr = (limparString(project.nome).substring(0, 4) + limparString(student.nome).substring(0, 10)).toUpperCase();
      const studentCode = limparString(student.codigo || '000').substring(0, 5);
      const dna = (dnaStr + studentCode + (d.getMonth() + 1)).substring(0, 25);

      slips.push({
        id: student.codigo || '000',
        aluno: student.nome,
        aluno_id: student.id,
        resp: student.resp,
        cpf_resp: student.cpf,
        turma: student.turma,
        turno: student.turno,
        tel: student.tel,
        projeto: project.nome,
        projeto_id: project.id,
        pix: project.pix,
        valor: isBolsista ? '0,00' : carneValue,
        is_bolsista: isBolsista,
        vencimento: vencimentoFormatado,
        mes: months[d.getMonth()],
        mes_num: d.getMonth() + 1,
        ano: d.getFullYear(),
        dna: dna,
        parc: `${mesesAdicionados + 1}/${installments}`
      });
      mesesAdicionados++;
    }
    setPreviewSlips(slips);
  };

  const handleSaveCarne = async () => {
    if (previewSlips.length === 0) return;
    let mode = 'static';
    if (!isBolsista) {
      const { value: selectedMode } = await Swal.fire({
        title: 'Como deseja gerar o PIX?',
        html: `
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 5px; text-align: left;">
            <p style="color: #64748B; font-size: 13px; margin-bottom: 10px; font-weight: 500; text-align: center;">Escolha a tecnologia de processamento:</p>
            <label style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 2px solid #38bdf8; border-radius: 16px; background: #f0f9ff; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="pix_mode" value="mp" checked style="margin-top: 4px; accent-color: #0284c7; width: 18px; height: 18px;" />
              <div>
                <strong style="display: block; color: #0f172a; font-size: 14px; margin-bottom: 4px;">PIX Dinâmico ⚡</strong>
                <span style="display: block; color: #475569; font-size: 11px; line-height: 1.4; font-weight: 500;">Integração Auto. Confirmação instantânea sem intervenção humana.</span>
              </div>
            </label>
            <label style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 2px solid #f1f5f9; border-radius: 16px; background: #f8fafc; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="pix_mode" value="static" style="margin-top: 4px; accent-color: #0284c7; width: 18px; height: 18px;" />
              <div>
                <strong style="display: block; color: #0f172a; font-size: 14px; margin-bottom: 4px;">Padrão Copia e Cola 📝</strong>
                <span style="display: block; color: #475569; font-size: 11px; line-height: 1.4; font-weight: 500;">PIX estático do projeto. Requer que você dê baixa manualmente no painel.</span>
              </div>
            </label>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar 🚀',
        cancelButtonText: 'Voltar',
        confirmButtonColor: '#132638',
        cancelButtonColor: '#94a3b8',
        customClass: {
          popup: '!rounded-3xl',
          confirmButton: '!rounded-xl px-6 py-3 font-black tracking-widest uppercase text-[11px]',
          cancelButton: '!rounded-xl px-6 py-3 font-black uppercase text-[11px]'
        },
        preConfirm: () => {
          const selected = document.querySelector('input[name="pix_mode"]:checked');
          return selected ? selected.value : null;
        }
      });
      if (!selectedMode) return;
      mode = selectedMode;
    }

    setCarneLoading(true);
    const recordsToInitialSave = previewSlips.map(s => ({
      aluno_id: s.aluno_id,
      aluno_nome: s.aluno,
      projeto: s.projeto,
      projeto_id: s.projeto_id,
      mes: s.mes,
      mes_num: parseInt(s.mes_num),
      ano: parseInt(s.ano),
      valor: s.valor,
      pago: s.is_bolsista ? true : false,
      is_bolsista: s.is_bolsista,
      dna: s.dna,
      parc: s.parc,
      vencimento: s.vencimento,
      mp_status: s.is_bolsista ? 'approved' : 'pending',
      created_at: new Date().toISOString()
    }));


    const { data: insertedRecords, error: dbError } = await supabase
      .from('financeiro')
      .insert(recordsToInitialSave)
      .select();

    if (dbError) {
      setCarneLoading(false);
      return Swal.fire('Erro', 'Falha ao salvar registros iniciais: ' + dbError.message, 'error');
    }

    let finalRecords = [...insertedRecords];
    if (mode === 'mp') {
      Swal.fire({
        title: 'Gerando PIX Dinâmicos...',
        html: 'Rastreando IDs reais para automação... <br><b>Progresso: <span id="mp-progress">0</span>/' + insertedRecords.length + '</b>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      try {
        for (let i = 0; i < insertedRecords.length; i++) {
          const record = insertedRecords[i];
          if (record.is_bolsista) continue;
          const progressEl = document.getElementById('mp-progress');
          if (progressEl) progressEl.innerText = i + 1;
          const { data: mpData, error: mpError } = await supabase.functions.invoke('mp-generate-pix', {
            body: {
              paymentId: record.id,
              amount: record.valor,
              description: `Parcela ${record.parc} - ${record.aluno_nome}`,
              email: 'financeiro@canaa.com'
            }
          });
          if (mpError) throw mpError;
          finalRecords[i] = { ...record, ...mpData };
        }
      } catch (err) {
        setCarneLoading(false);
        return Swal.fire('Erro na Automação', 'Falha ao gerar um dos PIX. Verifique seu token e logs.', 'error');
      }
    }

    setCarneLoading(false);
    // Registrar log de auditoria
    const student = students.find(s => s.id === selectedStudentId);
    // logAction(supabase, user, 'carne_criado', `Carnê de ${insertedRecords.length} parcela(s) gerado para ${student?.nome || 'aluno'}.`, 'financeiro'); 
    // Not using user/logAction yet since its not fully set up in this component's top level, but let's keep it in mind

    setPreviewSlips(finalRecords.map(r => ({
      ...previewSlips.find(ps => ps.parc === r.parc),
      mp_qr_code_64: r.mp_qr_code_64
    })));

    Swal.fire({
      title: 'Tudo Pronto!',
      text: mode === 'mp' ? 'Os carnês foram salvos com IDs rastreáveis!' : 'Os carnês foram salvos no sistema.',
      icon: 'success',
      confirmButtonText: 'Fechar',
      confirmButtonColor: '#132638',
    }).then(() => {
      setPreviewSlips([]);
    });
    fetchData();
  };

  // Expenses Handlers
  const handleOpenExpModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setExpFormData({
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
      setExpFormData({
        descricao: '',
        valor: '',
        categoria: 'Materiais',
        vencimento: new Date().toISOString().split('T')[0],
        pago: false,
        data_pagamento: '',
        projeto_id: ''
      });
    }
    setIsExpModalOpen(true);
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setExpLoading(true);

    const payload = { ...expFormData };
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
      setIsExpModalOpen(false);
      fetchExpenses();
    } else {
      Swal.fire('Erro', 'Ocorreu um erro ao salvar a despesa.', 'error');
    }
    setExpLoading(false);
  };

  const handleExpDelete = async (id) => {
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
        fetchExpenses();
      }
    }
  };

  const toggleExpPago = async (expense) => {
    const { error } = await supabase
      .from('despesas')
      .update({ 
        pago: !expense.pago,
        data_pagamento: !expense.pago ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', expense.id);
    
    if (!error) fetchExpenses();
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchSearch = exp.descricao.toLowerCase().includes(expSearchTerm.toLowerCase());
    const matchCategory = expCategoryFilter === 'all' || exp.categoria === expCategoryFilter;
    
    const expDate = new Date(exp.vencimento);
    const matchMonth = expDate.getMonth() === months.indexOf(expMonthFilter);
    const matchYear = expDate.getFullYear().toString() === expYearFilter;

    return matchSearch && matchCategory && matchMonth && matchYear;
  });

  const totalPaidExp = filteredExpenses
    .filter(e => e.pago)
    .reduce((acc, e) => acc + parseFloat(e.valor), 0);
  
  const totalPendingExp = filteredExpenses
    .filter(e => !e.pago)
    .reduce((acc, e) => acc + parseFloat(e.valor), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 lg:px-6">
      {/* Tab Navigation Hub */}
      <div className="flex border-b border-gray-100 dark:border-white/5 overflow-x-auto no-print scrollbar-hide mb-4">
        <button 
          onClick={() => setActiveTab('mensalidades')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'mensalidades' ? 'border-azul-claro text-azul-escuro dark:text-azul-claro bg-azul-claro/5' : 'border-transparent text-gray-400 hover:text-azul-escuro dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          Mensalidades
        </button>
        <button 
          onClick={() => setActiveTab('inadimplentes')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'inadimplentes' ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-500/10' : 'border-transparent text-gray-400 hover:text-rose-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          Inadimplentes
        </button>
        <button 
          onClick={() => setActiveTab('carnes')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'carnes' ? 'border-azul-escuro dark:border-white text-azul-escuro dark:text-white bg-gray-50 dark:bg-white/5' : 'border-transparent text-gray-400 hover:text-azul-escuro dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          Gerador de Carnês
        </button>
        <button 
          onClick={() => setActiveTab('despesas')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'despesas' ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          Despesas
        </button>
      </div>

      {activeTab === 'mensalidades' ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
            <Wallet className="text-azul-claro" size={22} />
            Financeiro
          </h2>
          <p className="text-xs text-cinza-texto dark:text-slate-400 font-medium mt-0.5">Controle de mensalidades e balanço geral.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-azul-claro/10 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-azul-claro/20 dark:border-blue-800/30 flex-1 sm:flex-none">
            <span className="text-[9px] font-black uppercase text-azul-claro block leading-tight">Alunos Ativos</span>
            <span className="text-base font-black text-azul-escuro dark:text-blue-100">{totalFilteredStudents} {projectFilter !== 'all' ? 'no Projeto' : 'Total'}</span>
          </div>
          <button onClick={handleExportCSV} className="bg-azul-escuro dark:bg-azul-claro text-white dark:text-azul-escuro px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-sm flex-1 sm:flex-none justify-center">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 no-print">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-azul-escuro/40 dark:text-slate-500 mb-1">
            <CreditCard size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Gerado</span>
          </div>
          <div className="text-xl font-black text-azul-escuro dark:text-white">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="w-full h-1 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-azul-escuro dark:bg-azul-claro w-full opacity-20"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500/60 dark:text-emerald-500/40 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Pago</span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="w-full h-1 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(paidValue / (totalValue || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500/60 dark:text-rose-500/40 mb-1">
            <AlertCircle size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Pendente</span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">R$ {pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="w-full h-1 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${(pendingValue / (totalValue || 1)) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-2 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400 dark:text-slate-500" size={14} />
          <input type="text" placeholder="Nome do aluno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 dark:focus:border-azul-claro/40 text-azul-escuro dark:text-white transition-all shadow-inner" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <option value="all" className="dark:bg-slate-800">TODOS PROJETOS</option>
            {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.nome}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <option value="all" className="dark:bg-slate-800">TODOS STATUS</option>
            <option value="paid" className="dark:bg-slate-800">PAGOS ✅</option>
            <option value="pending" className="dark:bg-slate-800">PENDENTES 🚨</option>
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <option value="all" className="dark:bg-slate-800">TODOS MESES</option>
            {months.map(m => <option key={m} value={m} className="dark:bg-slate-800">{m}</option>)}
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2 no-print">
        {loading ? (
          <div className="py-16 text-center font-black text-azul-escuro/20 dark:text-slate-700 tracking-widest uppercase animate-pulse text-xs">CARREGANDO...</div>
        ) : studentList.map((group) => (
          <div key={group.aluno_id} className="bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden border-l-4 border-l-azul-claro">
            {/* Header Aluno - Compacto */}
            <div className="px-4 py-3 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-azul-claro uppercase tracking-tight bg-azul-claro/5 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{group.codigo}</span>
                  <h3 className="text-sm font-black text-azul-escuro dark:text-white uppercase tracking-tight leading-none">{group.nome}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">T: {group.turma} — {group.turno}</span>
                  <span className="text-[9px] font-black uppercase text-azul-claro tracking-wider px-1.5 py-0.5 bg-azul-claro/5 dark:bg-blue-900/20 rounded border border-azul-claro/10 dark:border-blue-800/30">{group.projeto}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => handlePrintAllPayments(group)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Imprimir Todos (Em Massa)">
                  <Printer size={11} /> <span className="hidden sm:inline">Imprimir Carnês</span>
                </button>
                {group.payments.some(p => !p.pago && !p.is_bolsista) && (
                  <button onClick={() => handlePayAll(group.aluno_id)} className="bg-emerald-500 dark:bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-sm">
                    <CheckCircle size={11} /> <span className="hidden sm:inline">Quitar</span>
                  </button>
                )}
                <button onClick={() => handleDeleteAll(group.aluno_id)} className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-400 dark:text-red-500 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all">
                  <Trash2 size={11} />
                </button>
                <button
                  onClick={() => setExpandedStudentId(expandedStudentId === group.aluno_id ? null : group.aluno_id)}
                  className="text-azul-escuro dark:text-white font-black text-[9px] uppercase flex items-center gap-1 hover:text-azul-claro bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-md transition-all shadow-inner"
                >
                  Parcelas {expandedStudentId === group.aluno_id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
            </div>

            {/* Installments Table */}
            {expandedStudentId === group.aluno_id && (
              <div className="bg-gray-50/30 dark:bg-black/20 px-4 py-3 md:px-6 animate-in slide-in-from-top-1 duration-200">
                {/* Desktop parcelas table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-white/5">
                        <th className="pb-2 px-0">PARCELA / VENC.</th>
                        <th className="pb-2 px-3">PROJETO</th>
                        <th className="pb-2 px-3">VALOR</th>
                        <th className="pb-2 px-3 text-center">STATUS</th>
                        <th className="pb-2 px-0 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {group.payments.slice().reverse().map((pay) => (
                        <tr key={pay.id} className="hover:bg-white dark:hover:bg-white/5 transition-all">
                          <td className="py-2 px-0">
                            <div className="flex flex-col">
                              <span className="font-black text-azul-escuro dark:text-blue-100 text-xs">{pay.parc || '---'} — {pay.vencimento || `${pay.mes}/${pay.ano}`}</span>
                              <span className="text-[8px] font-mono text-gray-300 dark:text-slate-600 tracking-tighter">{pay.dna}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3"><span className="text-[9px] font-black uppercase opacity-60 dark:text-slate-400">{pay.projeto}</span></td>
                          <td className="py-2 px-3 font-black text-azul-escuro dark:text-white text-xs">R$ {pay.valor}</td>
                          <td className="py-2 px-3 text-center">
                            {pay.is_bolsista ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-azul-claro dark:text-blue-400 border border-azul-claro/10 dark:border-blue-800/30">✨ Isento</span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${pay.pago ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-rose-900/20 text-red-600 dark:text-rose-400'}`}>
                                {pay.pago ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
                                {pay.pago ? 'Pago' : 'Pendente'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-0">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleWhatsApp(pay)} className="p-1.5 bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400 rounded hover:bg-green-600 dark:hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="WhatsApp"><MessageSquare size={13} /></button>
                              <button onClick={() => handlePrintReceipt(pay)} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Imprimir"><Printer size={13} /></button>
                              <button onClick={() => handleTogglePaid(pay)} className={`p-1.5 rounded transition-all shadow-sm ${pay.pago ? 'bg-red-50 dark:bg-rose-900/20 text-red-500 dark:text-rose-400 hover:bg-red-500 dark:hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white'}`} title={pay.pago ? 'Marcar Pendente' : 'Marcar Pago'}>{pay.pago ? <XCircle size={13} /> : <CheckCircle size={13} />}</button>
                              <button onClick={() => handleGenerateDynamicPix(pay)} disabled={pay.pago || isGeneratingPix} className={`p-1.5 rounded transition-all shadow-sm ${pay.pago ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-700 cursor-not-allowed' : 'bg-azul-claro/10 dark:bg-blue-900/20 text-azul-claro dark:text-blue-400 hover:bg-azul-claro hover:text-white'}`} title="PIX Dinâmico"><CreditCard size={13} /></button>
                              <button onClick={() => handleDelete(pay.id)} className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-600 rounded hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all"><Trash2 size={13} /></button>
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
                    <div key={pay.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-white/5 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-azul-escuro dark:text-white text-xs">{pay.parc} — {pay.vencimento || `${pay.mes}/${pay.ano}`}</p>
                          <p className="text-[9px] font-mono text-gray-300 dark:text-slate-500 truncate">{pay.dna}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {pay.is_bolsista ? (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-azul-claro dark:text-blue-400">Isento</span>
                          ) : (
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${pay.pago ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-rose-900/30 text-red-600 dark:text-rose-400'}`}>
                              {pay.pago ? '✔ Pago' : '⚠ Pendente'}
                            </span>
                          )}
                          <span className="font-black text-azul-escuro dark:text-white text-xs">R$ {pay.valor}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => handleWhatsApp(pay)} className="flex-1 p-2 bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400 rounded-lg hover:bg-green-600 dark:hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="WhatsApp">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => handlePrintReceipt(pay)} className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Imprimir">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleTogglePaid(pay)} className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center shadow-sm ${pay.pago ? 'bg-red-50 dark:bg-rose-900/20 text-red-500 dark:text-rose-400 hover:bg-red-500 dark:hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white'}`}>
                          {pay.pago ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button onClick={() => handleGenerateDynamicPix(pay)} disabled={pay.pago || isGeneratingPix} className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center shadow-sm ${pay.pago ? 'bg-gray-100 dark:bg-slate-900 text-gray-300 dark:text-slate-700' : 'bg-azul-claro/10 dark:bg-blue-900/20 text-azul-claro dark:text-blue-400 hover:bg-azul-claro hover:text-white'}`}>
                          <CreditCard size={14} />
                        </button>
                        <button onClick={() => handleDelete(pay.id)} className="flex-1 p-2 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600 rounded-lg hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
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
    </>
  ) : activeTab === 'inadimplentes' ? (
        <div className="space-y-8 animate-in fade-in duration-700">
             {/* Header Inad */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div>
                <h2 className="text-2xl font-black text-azul-escuro flex items-center gap-2">
                  <AlertCircle className="text-rose-500" size={22} />
                  Inadimplentes
                </h2>
                <p className="text-cinza-texto font-medium text-xs mt-0.5">Controle de atrasos e pendências financeiras.</p>
              </div>
              <button
                onClick={handleBulkWhatsAppInad}
                disabled={filteredInadimplentes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <SendHorizonal size={14} /> Notificar Todos ({filteredInadimplentes.length})
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between border-l-4 border-l-rose-500">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-rose-500/80">
                    <TrendingDown size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Já Vencido</span>
                  </div>
                </div>
                <p className="text-xl font-black text-azul-escuro dark:text-rose-400 tracking-tighter">
                  R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between border-l-4 border-l-azul-claro">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-blue-600/80">
                    <Calendar size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Futuro</span>
                  </div>
                </div>
                <p className="text-xl font-black text-azul-escuro dark:text-blue-100 tracking-tighter">
                  R$ {totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between border-l-4 border-l-gray-300">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-gray-500/80">
                    <User size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Alunos em Atraso</span>
                  </div>
                </div>
                <p className="text-xl font-black text-azul-escuro dark:text-white tracking-tighter">{totalAlunosInadimplentesCount}</p>
              </div>
            </div>

            {/* Filters Inad */}
            <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-2 no-print">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 text-gray-400 dark:text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Buscar por aluno..."
                  value={inadSearchTerm}
                  onChange={(e) => setInadSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 dark:focus:border-azul-claro/40 text-azul-escuro dark:text-white transition-all shadow-inner"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <select value={overdueFilter} onChange={(e) => setOverdueFilter(e.target.value)} className="px-3 py-2 bg-azul-escuro dark:bg-slate-800 text-white dark:text-blue-100 rounded-md outline-none text-[10px] font-black uppercase border-none cursor-pointer hover:bg-azul-escuro/90 dark:hover:bg-slate-700 transition-all">
                  <option value="overdue"> ATRASADOS 🚨</option>
                  <option value="pending"> A VENCER ⏳</option>
                  <option value="all"> TODOS 📂</option>
                </select>
                <select value={inadProjectFilter} onChange={(e) => setInadProjectFilter(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border-none hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
                  <option value="all">TODOS PROJETOS</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <select value={inadMonthFilter} onChange={(e) => setInadMonthFilter(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border-none hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
                  <option value="all">TODOS MESES</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Inad Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden min-h-[400px]">
              {inadLoading ? (
                <div className="py-20 text-center font-black text-azul-escuro/10 dark:text-slate-700 uppercase tracking-widest text-xl animate-pulse">Carregando...</div>
              ) : filteredInadimplentes.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500/60 dark:text-emerald-500/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2Icon size={32} />
                  </div>
                  <h3 className="text-xl font-black text-azul-escuro dark:text-white">Tudo em dia!</h3>
                  <p className="text-gray-400 dark:text-slate-400 text-sm font-medium">Nenhum pagamento pendente encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Aluno</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Projeto</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Vencimento</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Valor</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {filteredInadimplentes.map((pay) => {
                        const overdue = isOverdue(pay);
                        return (
                          <tr key={pay.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-black text-azul-escuro dark:text-white text-sm uppercase">{pay.aluno_nome}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black uppercase text-[10px] text-azul-claro">{pay.projeto}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600 dark:text-slate-400">
                              {pay.vencimento || `${pay.mes}/${pay.ano}`}
                              {overdue && <span className="ml-2 text-[8px] text-white bg-rose-500 px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">!</span>}
                            </td>
                            <td className="px-6 py-4 font-black text-azul-escuro dark:text-blue-100 text-sm">R$ {pay.valor}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleWhatsApp(pay)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-sm mx-auto md:ml-auto ${overdue ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400 hover:bg-green-600 hover:text-white'}`}
                              >
                                <MessageSquare size={12} /> {overdue ? 'Cobrar' : 'Lembrar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </div>
      ) : activeTab === 'carnes' ? (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-azul-escuro/5 dark:shadow-black/20 border border-gray-100 dark:border-white/5 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-azul-claro flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-azul-claro text-white flex items-center justify-center text-[10px]">1</span>
                  Identificação do Aluno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2 px-1">
                      <User size={12} className="text-azul-claro" /> Selecione o Aluno
                    </label>
                    <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-azul-claro dark:focus:border-blue-900/50 font-bold dark:text-white cursor-pointer shadow-inner transition-all">
                      <option value="" className="dark:bg-slate-800">Escolha um aluno...</option>
                      {students.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.nome} ({s.codigo}) {studentsWithCarnes.has(s.id) ? '✅' : ''}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2 px-1">
                      <FolderKanban size={12} className="text-azul-claro" /> Vincular ao Projeto
                    </label>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-azul-claro dark:focus:border-blue-900/50 font-bold dark:text-white cursor-pointer shadow-inner transition-all">
                      <option value="" className="dark:bg-slate-800">Escolha um projeto...</option>
                      {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-azul-escuro/5 dark:shadow-black/20 border border-gray-100 dark:border-white/5 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-azul-claro flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-azul-claro text-white flex items-center justify-center text-[10px]">2</span>
                  Configurações do Carnê
                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2 px-1">
                      <CreditCard size={12} className="text-azul-claro" /> Valor (R$)
                    </label>
                    <input type="text" value={isBolsista ? '0,00' : carneValue} disabled={isBolsista} onChange={(e) => setCarneValue(e.target.value)} className={`w-full p-4 border-2 rounded-2xl outline-none font-black shadow-inner transition-all ${isBolsista ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-white/5 text-azul-escuro dark:text-white focus:border-azul-claro dark:focus:border-blue-900/50'}`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2 px-1">
                      <History size={12} className="text-azul-claro" /> Parcelas
                    </label>
                    <input type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-azul-claro dark:focus:border-blue-900/50 font-bold dark:text-white shadow-inner transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2 px-1">
                      <Calendar size={12} className="text-azul-claro" /> Dia Venc.
                    </label>
                    <input type="number" value={vencimentoDia} onChange={(e) => setVencimentoDia(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-azul-claro dark:focus:border-blue-900/50 font-bold dark:text-white shadow-inner transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2 px-1">
                      <XCircleIcon size={12} className="text-rose-500" /> Pular Mês
                    </label>
                    <input type="text" value={pularMes} onChange={(e) => setPularMes(e.target.value)} placeholder="Ex: 1, 7" className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-azul-claro dark:focus:border-blue-900/50 font-bold dark:text-white shadow-inner transition-all" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isBolsista} onChange={(e) => setIsBolsista(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ml-3 text-xs font-black uppercase tracking-widest text-emerald-600">Este Aluno é BOLSISTA</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-azul-escuro dark:bg-slate-900/90 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl h-fit border border-azul-escuro/10 dark:border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Resumo</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Aluno Selecionado</p>
                    <p className="text-sm font-black uppercase truncate">{students.find(s => s.id === selectedStudentId)?.nome || 'Nenhum'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Projeto</p>
                    <p className="text-sm font-black uppercase truncate">{projects.find(p => p.id === selectedProjectId)?.nome || 'Não selecionado'}</p>
                  </div>

                  <div className="flex justify-between border-t border-white/10 pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Parcelas</p>
                      <p className="text-xl font-black">{installments}x</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Valor Unit.</p>
                      <p className="text-xl font-black text-emerald-400">R$ {isBolsista ? '0,00' : carneValue}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center mt-4">
                    <span className="text-[10px] font-black uppercase text-blue-200">Total Acumulado</span>
                    <span className="text-xl font-black">
                      R$ {(installments * parseFloat((isBolsista ? '0' : carneValue).replace(',', '.'))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={handlePreviewCarne} className="w-full bg-white dark:bg-blue-600 text-azul-escuro dark:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-azul-claro dark:hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                    <Eye size={18} /> GERAR PREVIEW
                  </button>
                  <button onClick={handleSaveCarne} disabled={previewSlips.length === 0 || carneLoading} className="w-full bg-azul-claro text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-30 shadow-lg shadow-azul-claro/20">
                    {carneLoading ? 'SALVANDO...' : <><Save size={18} /> SALVAR</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {previewSlips.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-black text-azul-escuro uppercase px-4">Preview dos Carnês</h3>
              <div className="space-y-4 print:space-y-0 print:block">
                {previewSlips.map((slip, i) => <CarneItem key={i} item={slip} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-4 lg:px-6">
          {/* Header Expenses */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
                <Receipt className="text-rose-500" size={22} />
                Gestão de Despesas
              </h2>
              <p className="text-xs text-cinza-texto dark:text-slate-500 font-medium mt-0.5">Controle todas as saídas e custos da instituição.</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button 
                onClick={() => window.print()}
                className="bg-white dark:bg-slate-800 text-gray-700 dark:text-blue-100 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Printer size={14} /> Imprimir PDF
              </button>
              <button 
                onClick={() => handleOpenExpModal()}
                className="bg-azul-escuro dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 dark:hover:bg-blue-500 transition-all shadow-sm"
              >
                <PlusIcon size={14} /> Nova Despesa
              </button>
            </div>
          </div>

          {/* Summary Cards Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm border-l-4 border-l-rose-500 shadow-azul-escuro/5 dark:shadow-black/20 transition-all">
              <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Saídas (Mês)</p>
              <p className="text-xl font-black text-azul-escuro dark:text-white tracking-tighter">
                R$ {(totalPaidExp + totalPendingExp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm border-l-4 border-l-emerald-500 shadow-azul-escuro/5 dark:shadow-black/20 transition-all">
              <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Pago</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                R$ {totalPaidExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm border-l-4 border-l-amber-500 shadow-azul-escuro/5 dark:shadow-black/20 transition-all">
              <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pendente</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-500 tracking-tighter">
                R$ {totalPendingExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Filters Expenses */}
          <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-2 print:hidden shadow-azul-escuro/5 dark:shadow-black/20 transition-all">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400 dark:text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Buscar por descrição..." 
                value={expSearchTerm}
                onChange={(e) => setExpSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 dark:focus:border-azul-claro/40 text-azul-escuro dark:text-white transition-all shadow-inner" 
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <select value={expMonthFilter} onChange={(e) => setExpMonthFilter(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border-none hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
                {months.map(m => <option key={m} value={m} className="dark:bg-slate-800">{m}</option>)}
              </select>

              <select value={expYearFilter} onChange={(e) => setExpYearFilter(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-blue-100 border-none hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
                <option value="2024" className="dark:bg-slate-800">2024</option>
                <option value="2025" className="dark:bg-slate-800">2025</option>
                <option value="2026" className="dark:bg-slate-800">2026</option>
              </select>

              <select value={expCategoryFilter} onChange={(e) => setExpCategoryFilter(e.target.value)} className="px-3 py-2 bg-azul-escuro dark:bg-slate-800 text-white dark:text-blue-100 rounded-md outline-none text-[10px] font-black uppercase border-none cursor-pointer hover:bg-azul-escuro/90 dark:hover:bg-slate-700 transition-all">
                <option value="all" className="dark:bg-slate-800">TODAS CATEGORIAS</option>
                {categories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Table Expenses */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
            {expLoading ? (
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
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {filteredExpenses.map((exp) => {
                      const isLate = !exp.pago && new Date(exp.vencimento) < new Date();
                      return (
                        <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                          <td className="px-4 py-3">
                            <span className="font-black text-azul-escuro dark:text-white text-sm uppercase">{exp.descricao}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell print:table-cell">
                            <span className="text-[9px] font-black uppercase text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                              {exp.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-black text-azul-escuro dark:text-blue-100">
                            R$ {parseFloat(exp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-500">
                            {new Date(exp.vencimento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            {exp.pago ? (
                              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-fit border border-emerald-200 dark:border-emerald-500/30">
                                <CheckCircle2Icon size={12} /> Pago
                              </span>
                            ) : (
                              <span className={`${isLate ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'} py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-fit border`}>
                                {isLate ? <AlertCircle size={12} /> : <XCircleIcon size={12} />}
                                {isLate ? 'Atrasado' : 'Pendente'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right print:hidden">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => toggleExpPago(exp)}
                                className={`p-2 rounded-lg transition-all ${exp.pago ? 'text-gray-400 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-400 dark:text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                              >
                                {exp.pago ? <XCircleIcon size={16} /> : <CheckCircle2Icon size={16} />}
                              </button>
                              <button 
                                onClick={() => handleOpenExpModal(exp)}
                                className="p-2 text-gray-400 dark:text-slate-600 hover:text-azul-claro hover:bg-azul-claro/10 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleExpDelete(exp.id)}
                                className="p-2 text-gray-400 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
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

          {/* Modal for Expenses */}
          {isExpModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl dark:shadow-black/40 overflow-hidden border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-azul-escuro dark:bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-azul-escuro/10">
                      {editingExpense ? <Edit2 size={24} /> : <PlusIcon size={24} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-azul-escuro dark:text-white tracking-tight">
                        {editingExpense ? 'Editar Despesa' : 'Nova Saída'}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Preencha os detalhes do custo.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsExpModalOpen(false)}
                    className="p-3 text-gray-400 dark:text-slate-600 hover:text-azul-escuro dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm"
                  >
                    <XCircleIcon size={24} />
                  </button>
                </div>

                <form onSubmit={handleExpSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Descrição</label>
                      <input 
                        type="text" 
                        required 
                        value={expFormData.descricao}
                        onChange={(e) => setExpFormData({...expFormData, descricao: e.target.value})}
                        placeholder="Ex: Aluguel da Sede"
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-900 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-bold text-azul-escuro dark:text-white shadow-inner placeholder:text-gray-300 dark:placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={expFormData.valor}
                        onChange={(e) => setExpFormData({...expFormData, valor: e.target.value})}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-900 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-mono font-bold text-azul-escuro dark:text-white shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Categoria</label>
                      <select 
                        value={expFormData.categoria}
                        onChange={(e) => setExpFormData({...expFormData, categoria: e.target.value})}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-900 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-bold text-azul-escuro dark:text-white shadow-inner cursor-pointer"
                      >
                        {categories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Vencimento</label>
                      <input 
                        type="date" 
                        required 
                        value={expFormData.vencimento}
                        onChange={(e) => setExpFormData({...expFormData, vencimento: e.target.value})}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-900 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-bold text-azul-escuro dark:text-white shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Projeto (Opcional)</label>
                      <select 
                        value={expFormData.projeto_id}
                        onChange={(e) => setExpFormData({...expFormData, projeto_id: e.target.value})}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-900 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-bold text-azul-escuro dark:text-white shadow-inner cursor-pointer"
                      >
                        <option value="" className="dark:bg-slate-800">Nenhum</option>
                        {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <input 
                      type="checkbox" 
                      id="pago-checkbox"
                      checked={expFormData.pago}
                      onChange={(e) => setExpFormData({...expFormData, pago: e.target.checked, data_pagamento: e.target.checked ? new Date().toISOString().split('T')[0] : ''})}
                      className="w-5 h-5 rounded-md text-azul-claro focus:ring-azul-claro dark:bg-slate-800 dark:border-white/10"
                    />
                    <label htmlFor="pago-checkbox" className="text-sm font-bold text-azul-escuro dark:text-blue-100 cursor-pointer uppercase tracking-tight">Já está pago?</label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsExpModalOpen(false)}
                      className="flex-1 py-4 font-black text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase text-[10px] tracking-widest"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={expLoading}
                      className="flex-[2] py-4 bg-azul-escuro dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-azul-escuro/20 dark:shadow-black/40 hover:scale-[1.02] active:scale-95 transition-all text-[10px] tracking-widest uppercase disabled:opacity-50"
                    >
                      {expLoading ? 'Salvando...' : editingExpense ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {printingPayment && <div className="fixed inset-0 bg-white z-[9999] p-10 print:block hidden"><div className="max-w-[700px] mx-auto"><CarneItem item={printingPayment} /></div></div>}
      {printingStudentPayments.length > 0 && <div className="fixed inset-0 bg-white z-[9999] p-6 print:block hidden flex-col gap-4 items-center"> {printingStudentPayments.map((p, i) => <CarneItem key={i} item={p} />)} </div>}
    </div>
  );
}
