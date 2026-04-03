import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FolderKanban, 
  Settings, 
  ClipboardList,
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
  Eye,
  CheckCircle2,
  Globe,
  PlusCircle,
  Calendar,
  Clock,
  LogIn,
  FileText,
  Users,
  CreditCard,
  AlertTriangle,
  Edit3,
  ShieldCheck,
  Filter,
  Download,
  RefreshCw,
  SendHorizonal
} from 'lucide-react';
import Swal from 'sweetalert2';

// Logs Config
const ACAO_CONFIG = {
  login:          { icon: <LogIn size={14} />,       color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',    label: 'Login' },
  logout:         { icon: <LogIn size={14} />,        color: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400',  label: 'Logout' },
  carne_criado:   { icon: <FileText size={14} />,     color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Carnê' },
  aluno_criado:   { icon: <Users size={14} />,        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Aluno' },
  aluno_editado:  { icon: <Edit3 size={14} />,        color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',  label: 'Edição' },
  aluno_excluido: { icon: <Trash2 size={14} />,       color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',    label: 'Exclusão' },
  pagamento_quitado: { icon: <CreditCard size={14} />, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400', label: 'Pagamento' },
  despesa_criada: { icon: <CreditCard size={14} />,   color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', label: 'Despesa' },
  acao_criada:    { icon: <ShieldCheck size={14} />,  color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', label: 'Ação' },
  contrato_gerado: { icon: <FileText size={14} />,    color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',    label: 'Contrato' },
};
const DEFAULT_CONFIG = { icon: <AlertTriangle size={14} />, color: 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400', label: 'Evento' };
const LOGS_PER_PAGE = 30;

export default function Administration() {
  const [activeTab, setActiveTab] = useState('projects');

  // Projects States
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFormData, setProjectFormData] = useState({ nome: '', descricao: '', pix: '', status: 'Ativo' });

  // Actions States
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(true);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [actionFormData, setActionFormData] = useState({ titulo: '', descricao: '', data: new Date().toISOString().split('T')[0], projeto_id: '', status: 'Pendente' });

  // Logs States
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logAcaoFilter, setLogAcaoFilter] = useState('all');
  const [logPage, setLogPage] = useState(0);
  const [logTotal, setLogTotal] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchActions();
    fetchLogs();
  }, []);

  async function fetchProjects() {
    setLoadingProjects(true);
    const { data, error } = await supabase.from('projetos').select('*').order('nome', { ascending: true });
    if (!error) setProjects(data || []);
    setLoadingProjects(false);
  }

  const handleOpenProjectModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({ nome: project.nome, descricao: project.descricao || '', pix: project.pix || '', status: project.status || 'Ativo' });
    } else {
      setEditingProject(null);
      setProjectFormData({ nome: '', descricao: '', pix: '', status: 'Ativo' });
    }
    setIsProjectModalOpen(true);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setLoadingProjects(true);
    let res;
    if (editingProject) {
      res = await supabase.from('projetos').update(projectFormData).eq('id', editingProject.id);
    } else {
      res = await supabase.from('projetos').insert([projectFormData]);
    }
    if (!res.error) {
      Swal.fire('Sucesso!', 'Projeto salvo com sucesso.', 'success');
      setIsProjectModalOpen(false);
      fetchProjects();
    } else {
      Swal.fire('Erro', 'Erro ao salvar projeto.', 'error');
    }
    setLoadingProjects(false);
  };

  const handleProjectDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Tem certeza?', text: "Isso excluirá o projeto permanentemente!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir!' });
    if (isConfirmed) {
      const { error } = await supabase.from('projetos').delete().eq('id', id);
      if (!error) { Swal.fire('Excluído!', 'Projeto removido.', 'success'); fetchProjects(); }
    }
  };

  async function fetchActions() {
    setLoadingActions(true);
    const { data, error } = await supabase.from('acoes').select('*, projetos(nome)').order('data', { ascending: false });
    if (!error) setActions(data || []);
    setLoadingActions(false);
  }

  const handleOpenActionModal = (action = null) => {
    if (action) {
      setEditingAction(action);
      setActionFormData({ titulo: action.titulo, descricao: action.descricao || '', data: action.data || new Date().toISOString().split('T')[0], projeto_id: action.projeto_id || '', status: action.status || 'Pendente' });
    } else {
      setEditingAction(null);
      setActionFormData({ titulo: '', descricao: '', data: new Date().toISOString().split('T')[0], projeto_id: '', status: 'Pendente' });
    }
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setLoadingActions(true);
    let res;
    if (editingAction) {
      res = await supabase.from('acoes').update(actionFormData).eq('id', editingAction.id);
    } else {
      res = await supabase.from('acoes').insert([actionFormData]);
    }
    if (!res.error) {
      Swal.fire('Sucesso!', 'Ação salva com sucesso.', 'success');
      setIsActionModalOpen(false);
      fetchActions();
    } else {
      Swal.fire('Erro', 'Erro ao salvar ação.', 'error');
    }
    setLoadingActions(false);
  };

  const handleActionDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Excluir ação?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir' });
    if (isConfirmed) {
      const { error } = await supabase.from('acoes').delete().eq('id', id);
      if (!error) { Swal.fire('Excluído!', 'Ação removida.', 'success'); fetchActions(); }
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    let query = supabase
      .from('logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(logPage * LOGS_PER_PAGE, (logPage + 1) * LOGS_PER_PAGE - 1);

    if (logAcaoFilter !== 'all') query = query.eq('acao', logAcaoFilter);
    if (logSearchTerm) query = query.or(`user_email.ilike.%${logSearchTerm}%,descricao.ilike.%${logSearchTerm}%`);

    const { data, count } = await query;
    setLogs(data || []);
    setLogTotal(count || 0);
    setLoadingLogs(false);
  }, [logPage, logAcaoFilter, logSearchTerm]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [fetchLogs, activeTab]);

  const exportLogsCSV = () => {
    const header = ['Data/Hora', 'Usuário', 'Ação', 'Descrição', 'Entidade', 'IP'];
    const rows = logs.map(l => [new Date(l.created_at).toLocaleString('pt-BR'), l.user_email || '-', l.acao, l.descricao || '-', l.entidade || '-', l.ip || '-']);
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'logs.csv'; a.click();
  };

  const logTotalPages = Math.ceil(logTotal / LOGS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 lg:px-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100 dark:border-white/5 overflow-x-auto no-print scrollbar-hide mb-4">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'projects' ? 'border-azul-claro text-azul-escuro dark:text-white bg-azul-claro/5 dark:bg-azul-claro/10' : 'border-transparent text-gray-400 dark:text-slate-600 hover:text-azul-escuro dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
        >
          Projetos
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'actions' ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent text-gray-400 dark:text-slate-600 hover:text-purple-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
        >
          Ações & Eventos
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'logs' ? 'border-gray-500 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50' : 'border-transparent text-gray-400 dark:text-slate-600 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
        >
          Logs de Auditoria
        </button>
      </div>

      {/* ── PROJETOS ── */}
      {activeTab === 'projects' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
                <FolderKanban className="text-azul-claro" size={22} />
                Gestão de Projetos
              </h2>
              <p className="text-xs text-cinza-texto dark:text-slate-500 font-medium mt-0.5">Cadastre e gerencie os pilares de atuação da instituição.</p>
            </div>
            <button
              onClick={() => handleOpenProjectModal()}
              className="bg-azul-escuro dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 dark:hover:bg-blue-500 transition-all shadow-sm"
            >
              <Plus size={14} /> Novo Projeto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingProjects ? (
              <div className="col-span-full py-20 text-center font-black text-azul-escuro/10 dark:text-slate-700 uppercase tracking-widest animate-pulse">Carregando projetos...</div>
            ) : projects.map(project => (
              <div key={project.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-6 shadow-xl shadow-azul-escuro/5 dark:shadow-black/20 hover:scale-[1.02] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-azul-claro/10 dark:bg-blue-900/30 text-azul-claro p-3 rounded-2xl group-hover:bg-azul-claro group-hover:text-white transition-colors">
                    <FolderKanban size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenProjectModal(project)} className="p-2 text-gray-400 dark:text-slate-400 hover:text-azul-claro hover:bg-azul-claro/10 dark:hover:bg-blue-900/30 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleProjectDelete(project.id)} className="p-2 text-gray-400 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-azul-escuro dark:text-white uppercase tracking-tight mb-2">{project.nome}</h3>
                <p className="text-xs text-cinza-texto dark:text-slate-300 font-medium line-clamp-2 mb-4 h-8">{project.descricao || 'Sem descrição definida.'}</p>
                <div className="pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${project.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                    {project.status || 'Ativo'}
                  </span>
                  <div className="flex items-center gap-1 text-gray-300 dark:text-slate-400">
                    <Globe size={12} />
                    <span className="text-[10px] font-bold truncate max-w-[100px]">{project.pix || 'Sem PIX'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isProjectModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl dark:shadow-black/40 overflow-hidden border border-gray-100 dark:border-white/5">
                <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                  <h3 className="text-2xl font-black text-azul-escuro dark:text-white">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
                  <button onClick={() => setIsProjectModalOpen(false)} className="p-3 text-gray-400 dark:text-slate-500 hover:text-azul-escuro dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-2xl shadow-sm"><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleProjectSubmit} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Nome do Projeto</label>
                    <input type="text" required value={projectFormData.nome} onChange={e => setProjectFormData({...projectFormData, nome: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold text-azul-escuro dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Descrição</label>
                    <textarea rows="3" value={projectFormData.descricao} onChange={e => setProjectFormData({...projectFormData, descricao: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold resize-none text-azul-escuro dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Chave PIX</label>
                      <input type="text" value={projectFormData.pix} onChange={e => setProjectFormData({...projectFormData, pix: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-mono font-bold text-azul-escuro dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Status</label>
                      <select value={projectFormData.status} onChange={e => setProjectFormData({...projectFormData, status: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold text-azul-escuro dark:text-white">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 py-4 font-black text-gray-400 dark:text-slate-500 uppercase text-[10px] hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancelar</button>
                    <button type="submit" className="flex-[2] py-4 bg-azul-escuro dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:opacity-90 transition-all text-[10px] uppercase">Salvar Projeto</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AÇÕES & EVENTOS ── */}
      {activeTab === 'actions' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
                <Calendar className="text-purple-500" size={22} />
                Ações e Eventos
              </h2>
              <p className="text-xs text-cinza-texto dark:text-slate-500 font-medium mt-0.5">Planejamento e histórico de atividades sociais da instituição.</p>
            </div>
            <button
              onClick={() => handleOpenActionModal()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-sm"
            >
              <PlusCircle size={14} /> Nova Ação
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingActions ? (
              <div className="col-span-full py-20 text-center font-black text-azul-escuro/10 dark:text-slate-700 uppercase tracking-widest animate-pulse">Carregando ações...</div>
            ) : actions.map(action => (
              <div key={action.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all flex gap-6">
                <div className="flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 p-4 rounded-2xl min-w-[80px]">
                  <span className="text-[10px] font-black uppercase opacity-60 leading-none mb-1">{new Date(action.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  <span className="text-2xl font-black leading-none">{new Date(action.data).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${action.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {action.status || 'Pendente'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenActionModal(action)} className="text-gray-300 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleActionDelete(action.id)} className="text-gray-300 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <h4 className="font-black text-azul-escuro dark:text-white uppercase text-sm mb-1">{action.titulo}</h4>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium line-clamp-2 mb-3 leading-relaxed">{action.descricao || 'Sem descrição.'}</p>
                  <div className="flex items-center gap-2">
                    <FolderKanban size={10} className="text-purple-400" />
                    <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">{action.projetos?.nome || 'Geral'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isActionModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl dark:shadow-black/40 overflow-hidden border border-gray-100 dark:border-white/5">
                <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                  <h3 className="text-2xl font-black text-azul-escuro dark:text-white">{editingAction ? 'Editar Ação' : 'Nova Ação'}</h3>
                  <button onClick={() => setIsActionModalOpen(false)} className="p-3 text-gray-400 dark:text-slate-500 hover:text-azul-escuro dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-2xl shadow-sm"><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleActionSubmit} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Título da Ação</label>
                    <input type="text" required value={actionFormData.titulo} onChange={e => setActionFormData({...actionFormData, titulo: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold text-azul-escuro dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Descrição</label>
                    <textarea rows="2" value={actionFormData.descricao} onChange={e => setActionFormData({...actionFormData, descricao: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold resize-none text-azul-escuro dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Data</label>
                      <input type="date" required value={actionFormData.data} onChange={e => setActionFormData({...actionFormData, data: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold text-azul-escuro dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Projeto</label>
                      <select value={actionFormData.projeto_id} onChange={e => setActionFormData({...actionFormData, projeto_id: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold text-azul-escuro dark:text-white">
                        <option value="">Nenhum (Geral)</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Status</label>
                    <select value={actionFormData.status} onChange={e => setActionFormData({...actionFormData, status: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-600 outline-none transition-all font-bold text-azul-escuro dark:text-white">
                      <option value="Pendente">Pendente</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsActionModalOpen(false)} className="flex-1 py-4 font-black text-gray-400 dark:text-slate-500 uppercase text-[10px] hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancelar</button>
                    <button type="submit" className="flex-[2] py-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl hover:bg-purple-700 transition-all text-[10px] uppercase">Salvar Ação</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LOGS DE AUDITORIA ── */}
      {activeTab === 'logs' && (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
                <ClipboardList className="text-azul-claro" size={22} />
                Logs de Auditoria
              </h2>
              <p className="text-xs text-cinza-texto dark:text-slate-500 font-medium mt-0.5">Histórico completo de ações realizadas no sistema.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                <RefreshCw size={14} /> Atualizar
              </button>
              <button onClick={exportLogsCSV} className="flex items-center gap-2 px-4 py-2.5 bg-azul-escuro dark:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-azul-claro dark:hover:bg-blue-500 transition-all">
                <Download size={14} /> Exportar CSV
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por email ou descrição..."
                value={logSearchTerm}
                onChange={(e) => { setLogSearchTerm(e.target.value); setLogPage(0); }}
                className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-azul-claro/30 dark:focus:border-blue-700/40 transition-all text-azul-escuro dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600"
              />
            </div>
            <select
              value={logAcaoFilter}
              onChange={(e) => { setLogAcaoFilter(e.target.value); setLogPage(0); }}
              className="px-4 py-3 bg-azul-escuro dark:bg-blue-600 text-white rounded-xl outline-none text-[10px] font-black uppercase border-none cursor-pointer min-w-[160px]"
            >
              <option value="all">TODAS AS AÇÕES</option>
              {Object.entries(ACAO_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            {loadingLogs ? (
              <div className="py-20 text-center font-black text-azul-escuro/10 dark:text-slate-700 uppercase tracking-widest animate-pulse">Carregando logs...</div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center">
                <ClipboardList size={40} className="mx-auto text-gray-200 dark:text-slate-700 mb-3" />
                <p className="font-black text-azul-escuro dark:text-slate-400">Nenhum log encontrado.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-slate-800/50">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Ação</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Descrição</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Usuário</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {logs.map((log) => {
                        const cfg = ACAO_CONFIG[log.acao] || DEFAULT_CONFIG;
                        return (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-700 dark:text-slate-400 max-w-xs">{log.descricao || '—'}</td>
                            <td className="px-6 py-4 text-xs font-bold text-azul-escuro dark:text-white">{log.user_email || '—'}</td>
                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {logTotalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-gray-50 dark:border-white/5">
                    <span className="text-xs text-gray-400 dark:text-slate-500 font-bold">Página {logPage + 1} de {logTotalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setLogPage(p => Math.max(0, p - 1))} disabled={logPage === 0} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs font-black rounded-lg disabled:opacity-30">Anterior</button>
                      <button onClick={() => setLogPage(p => Math.min(logTotalPages - 1, p + 1))} disabled={logPage >= logTotalPages - 1} className="px-3 py-1.5 bg-azul-escuro dark:bg-blue-600 text-white text-xs font-black rounded-lg disabled:opacity-30">Próxima</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
