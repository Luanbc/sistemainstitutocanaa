import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../lib/logger';
import {
  FileText, User, FolderKanban, Calendar, DollarSign, ListOrdered,
  Printer, CheckCircle2, AlertCircle, Eye, Trash2, Save
} from 'lucide-react';
import Swal from 'sweetalert2';
import CarneItem from '../components/financeiro/CarneItem';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Carnes() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsWithCarnes, setStudentsWithCarnes] = useState(new Set());

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [installments, setInstallments] = useState(12);
  const [value, setValue] = useState('50,00');
  const [pularMes, setPularMes] = useState(''); // Ex: "1, 7"
  const [vencimentoDia, setVencimentoDia] = useState('10');
  const [isBolsista, setIsBolsista] = useState(false);

  // Preview state
  const [previewSlips, setPreviewSlips] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: stus } = await supabase.from('alunos').select('*').order('nome');
    const { data: projs } = await supabase.from('projetos').select('*').order('nome');
    const { data: finData } = await supabase.from('financeiro').select('aluno_id');

    const ids = new Set(finData?.map(f => f.aluno_id) || []);
    setStudentsWithCarnes(ids);
    setStudents(stus || []);
    setProjects(projs || []);
  }

  const limparString = (t) => t ? t.normalize('NFD').replace(/[^A-Z0-9]/gi, '').toUpperCase() : '';

  const handlePreview = (e) => {
    if (e) e.preventDefault();
    if (!selectedStudentId || !selectedProjectId) {
      return Swal.fire('Atenção', 'Selecione o aluno e o projeto para gerar o preview.', 'warning');
    }

    const student = students.find(s => s.id === selectedStudentId);
    const project = projects.find(p => p.id === selectedProjectId);

    if (!project.pix) {
      return Swal.fire('Erro no Projeto', 'Este projeto não possui uma chave PIX cadastrada. Vá em "Projetos" e adicione uma chave para continuar.', 'error');
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
      // DNA limitado a 25 caracteres para máxima compatibilidade com bancos
      const dnaStr = (limparString(project.nome).substring(0, 4) + limparString(student.nome).substring(0, 10)).toUpperCase();
      const studentCode = limparString(student.codigo || '000').substring(0, 5);
      const dna = (dnaStr + studentCode + (d.getMonth() + 1)).substring(0, 25);

      slips.push({
        id: student.codigo || '000',
        aluno: student.nome,
        aluno_id: student.id,
        resp: student.resp,
        cpf_resp: student.cpf, // CPF do Responsável
        turma: student.turma,
        turno: student.turno,
        tel: student.tel,
        projeto: project.nome,
        projeto_id: project.id,
        pix: project.pix,
        valor: isBolsista ? '0,00' : value,
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

  const handleSave = async () => {
    if (previewSlips.length === 0) return;

    let mode = 'static'; // Valor padrão para bolsistas (será ignorado na geração)

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
          cancelButton: '!rounded-xl px-6 py-3 font-black tracking-widest uppercase text-[11px]'
        },
        preConfirm: () => {
          const selected = document.querySelector('input[name="pix_mode"]:checked');
          return selected ? selected.value : null;
        }
      });

      if (!selectedMode) return;
      mode = selectedMode;
    }

    setLoading(true);

    // 1. Primeiro salvamos os registros básicos para ganhar os IDs Reais
    const recordsToInitialSave = previewSlips.map(s => ({
      aluno_id: s.aluno_id,
      aluno_nome: s.aluno,
      projeto: s.projeto,
      projeto_id: s.projeto_id,
      mes: s.mes,
      mes_num: s.mes_num,
      ano: s.ano,
      valor: s.valor,
      pago: s.is_bolsista ? true : false, // Bolsista já nasce como pago/isento
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
      setLoading(false);
      return Swal.fire('Erro', 'Falha ao salvar registros iniciais: ' + dbError.message, 'error');
    }

    let finalRecords = [...insertedRecords];

    // 2. Se for modo Mercado Pago, geramos os PIX um por um usando os IDs reais
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

          // Pular geração de PIX se for bolsista
          if (record.is_bolsista) {
            console.log(`Pulando PIX para Bolsista: ${record.aluno_nome}`);
            continue;
          }

          const progressEl = document.getElementById('mp-progress');
          if (progressEl) progressEl.innerText = i + 1;

          const { data: mpData, error: mpError } = await supabase.functions.invoke('mp-generate-pix', {
            body: {
              paymentId: record.id, // ID REAL DO BANCO
              amount: record.valor,
              description: `Parcela ${record.parc} - ${record.aluno_nome}`,
              email: 'financeiro@canaa.com'
            }
          });

          if (mpError) throw mpError;

          // Atualizamos nosso array local com o que a função salvou no banco
          finalRecords[i] = { ...record, ...mpData };
        }
      } catch (err) {
        setLoading(false);
        return Swal.fire('Erro na Automação', 'Falha ao gerar um dos PIX. Verifique seu token e logs.', 'error');
      }
    }

    setLoading(false);

    // Registrar log de auditoria
    const student = students.find(s => s.id === selectedStudentId);
    await logAction(supabase, user, 'carne_criado',
      `Carnê de ${insertedRecords.length} parcela(s) gerado para ${student?.nome || 'aluno'}.`,
      'financeiro');

    // Atualizar o preview com os dados oficiais (especialmente os QR Codes novos)
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-2 no-print">
        <div className="bg-azul-claro/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-azul-claro mb-4">
          <FileText size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-azul-escuro font-inter tracking-tight">Gerador de Carnês</h2>
        <p className="text-cinza-texto max-w-lg mx-auto">Organize o financeiro do Instituto com geração em massa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Identification */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-azul-escuro/5 border border-gray-100 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-azul-claro flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-azul-claro text-white flex items-center justify-center text-[10px]">1</span>
              Identificação do Aluno
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <User size={12} className="text-azul-claro" /> Selecione o Aluno
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-azul-claro focus:bg-white focus:shadow-md transition-all text-azul-escuro font-bold appearance-none cursor-pointer shadow-sm hover:border-gray-200"
                >
                  <option value="">Escolha um aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.codigo}) {studentsWithCarnes.has(s.id) ? '✅ Já Gerado' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <FolderKanban size={12} className="text-azul-claro" /> Vincular ao Projeto
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-azul-claro focus:bg-white focus:shadow-md transition-all text-azul-escuro font-bold appearance-none cursor-pointer shadow-sm hover:border-gray-200"
                >
                  <option value="">Escolha um projeto...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial & Scheduling */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-azul-escuro/5 border border-gray-100 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-azul-claro flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-azul-claro text-white flex items-center justify-center text-[10px]">2</span>
              Configurações do Carnê
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <DollarSign size={12} className="text-azul-claro" /> Valor (R$)
                </label>
                <div className="relative group/val">
                  <input
                    type="text"
                    value={isBolsista ? '0,00' : value}
                    disabled={isBolsista}
                    onChange={(e) => setValue(e.target.value)}
                    className={`w-full p-4 border-2 rounded-2xl outline-none focus:border-azul-claro focus:bg-white focus:shadow-md transition-all font-black shadow-sm hover:border-gray-200 ${isBolsista ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-azul-escuro'}`}
                  />
                  {isBolsista && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-600 bg-white px-2 py-1 rounded-md shadow-sm">Isento ✨</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <ListOrdered size={12} className="text-azul-claro" /> Nº de Parcelas
                </label>
                <input
                  type="number"
                  min="1" max="60"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-azul-claro focus:bg-white focus:shadow-md transition-all text-azul-escuro font-bold shadow-sm hover:border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <Calendar size={12} className="text-azul-claro" /> Dia de Vencimento
                </label>
                <input
                  type="number" min="1" max="31"
                  value={vencimentoDia}
                  onChange={(e) => setVencimentoDia(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-azul-claro focus:bg-white focus:shadow-md transition-all text-azul-escuro font-bold shadow-sm hover:border-gray-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isBolsista}
                  onChange={(e) => setIsBolsista(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-xs font-black uppercase tracking-widest text-emerald-600">Este Aluno é BOLSISTA (Isento de Pagamento)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <Calendar size={12} className="text-azul-claro" /> Início da Cobrança
                </label>
                <div className="flex gap-2">
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="flex-1 p-4 bg-gray-50 rounded-2xl text-sm font-bold border-2 border-gray-100 focus:bg-white focus:border-azul-claro focus:shadow-md outline-none transition-all shadow-sm hover:border-gray-200"
                  >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    className="w-24 p-4 bg-gray-50 rounded-2xl text-sm font-bold border-2 border-gray-100 focus:bg-white focus:border-azul-claro focus:shadow-md outline-none transition-all text-center shadow-sm hover:border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                  <AlertCircle size={12} className="text-azul-claro" /> Pular Meses (Ex: 1, 7)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1, 7 (Janeiro e Julho)"
                  value={pularMes}
                  onChange={(e) => setPularMes(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-azul-claro focus:bg-white focus:shadow-md transition-all text-azul-escuro font-bold placeholder:font-normal shadow-sm hover:border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Summary */}
        <div className="space-y-6">
          <div className="bg-azul-escuro p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-azul-escuro/20 h-fit sticky top-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Resumo da Geração</h3>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-blue-200 text-xs font-bold">Total de Lançamentos</span>
                <span className="font-black text-xl">{installments}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-blue-200 text-xs font-bold">Valor Mensal</span>
                <span className="font-black text-xl">R$ {value}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-blue-200 text-xs font-bold">Vencimento</span>
                <span className="font-black text-xl">Dia {vencimentoDia}</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <CheckCircle2 size={14} /> PIX Validado
              </div>
              <p className="text-[10px] text-blue-100 leading-relaxed font-medium">O QR Code será gerado automaticamente com base na chave PIX do projeto vinculado.</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handlePreview}
                className="w-full bg-white text-azul-escuro py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-azul-claro hover:text-white transition-all active:scale-95"
              >
                <Eye size={18} /> GERAR PREVIEW
              </button>
              <button
                onClick={handleSave}
                disabled={previewSlips.length === 0 || loading}
                className="w-full bg-azul-claro text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-azul-claro/20 disabled:opacity-30 disabled:grayscale disabled:active:scale-100 active:scale-95"
              >
                {loading ? 'SALVANDO...' : (
                  <>
                    <Save size={18} /> SALVAR CARNÊS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewSlips.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between no-print px-6 bg-white p-6 rounded-3xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-azul-escuro uppercase tracking-tight">Preview</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{previewSlips.length} carnês preparados</p>
              </div>
            </div>
            <button
              onClick={() => setPreviewSlips([])}
              className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <Trash2 size={18} /> Limpar
            </button>
          </div>

          <div className="space-y-4 print:space-y-0 print:block">
            {previewSlips.map((slip, i) => (
              <CarneItem key={i} item={slip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
