import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, Link2, FolderKanban, User, Users } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Member Management States
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  
  // Form states
  const [nome, setNome] = useState('');
  const [pix, setPix] = useState('');
  const [responsavel, setResponsavel] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .order('nome');
    
    if (error) {
      Swal.fire('Erro', 'Não foi possível carregar os projetos.', 'error');
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }

  async function fetchProjectMembers(projectId) {
    const { data, error } = await supabase
      .from('aluno_projeto')
      .select('id, aluno_id, alunos(nome, codigo, tel)')
      .eq('projeto_id', projectId);
    
    if (error) {
      console.error('Erro ao carregar membros:', error);
    } else {
      setProjectMembers(data || []);
    }
  }

  async function fetchAllStudents() {
    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome, codigo')
      .order('nome');
    
    if (!error) setAllStudents(data || []);
  }

  const handleOpenMembers = async (project) => {
    setSelectedProject(project);
    setIsMembersModalOpen(true);
    fetchProjectMembers(project.id);
    fetchAllStudents();
  };

  const handleLinkStudent = async (studentId) => {
    if (projectMembers.some(m => m.aluno_id === studentId)) {
      Swal.fire('Aviso', 'Este aluno já está vinculado a este projeto.', 'warning');
      return;
    }

    const { error } = await supabase
      .from('aluno_projeto')
      .insert([{ aluno_id: studentId, projeto_id: selectedProject.id }]);

    if (error) {
      if (error.code === '23505') {
        Swal.fire('Aviso', 'Este aluno já está vinculado a este projeto.', 'warning');
      } else {
        Swal.fire('Erro', 'Não foi possível vincular o aluno.', 'error');
      }
    } else {
      fetchProjectMembers(selectedProject.id);
      setIsLinkingModalOpen(false);
    }
  };

  const handleUnlinkStudent = async (vínculoId) => {
    const result = await Swal.fire({
      title: 'Desvincular Aluno?',
      text: "O aluno deixará de fazer parte deste projeto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, desvincular',
      cancelButtonText: 'Manter'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('aluno_projeto').delete().eq('id', vínculoId);
      if (error) {
        Swal.fire('Erro', 'Não foi possível desvincular.', 'error');
      } else {
        fetchProjectMembers(selectedProject.id);
      }
    }
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setNome(project.nome);
      setPix(project.pix || '');
      setResponsavel(project.responsavel || '');
    } else {
      setEditingProject(null);
      setNome('');
      setPix('');
      setResponsavel('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const projectData = { nome, pix, responsavel };

    let error;
    if (editingProject) {
      const res = await supabase
        .from('projetos')
        .update(projectData)
        .eq('id', editingProject.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('projetos')
        .insert([projectData]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      Swal.fire('Erro', error.message, 'error');
    } else {
      Swal.fire({
        title: 'Sucesso!',
        text: editingProject ? 'Projeto atualizado com sucesso.' : 'Projeto cadastrado com sucesso.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      setIsModalOpen(false);
      fetchProjects();
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Os carnês já gerados não serão afetados, mas você não poderá mais gerar novos carnês para este projeto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E53E3E',
      cancelButtonColor: '#132638',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      const { error } = await supabase.from('projetos').delete().eq('id', id);
      setLoading(false);

      if (error) {
        Swal.fire('Erro', 'Não foi possível excluir o projeto.', 'error');
      } else {
        Swal.fire('Excluído!', 'O projeto foi removido com sucesso.', 'success');
        fetchProjects();
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
            <FolderKanban className="text-azul-claro" size={22} />
            Gestão de Projetos
          </h2>
          <p className="text-xs text-cinza-texto dark:text-slate-500 font-medium mt-0.5">Cadastre e gerencie os projetos sociais do instituto.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-azul-escuro dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 dark:hover:bg-blue-500 transition-all shadow-sm w-full md:w-auto"
        >
          <Plus size={14} />
          Novo Projeto
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-2 transition-all">
        <div className="w-full relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400 dark:text-slate-500" size={14} />
          <input 
            type="text" 
            placeholder="Buscar projeto pelo nome..." 
            className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-xs font-medium text-azul-escuro dark:text-white border border-transparent focus:border-azul-claro/20 dark:focus:border-azul-claro/40 transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && projects.length === 0 ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 h-40 rounded-lg animate-pulse border border-gray-100 dark:border-white/5"></div>
          ))
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-md dark:hover:shadow-black/20 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-azul-claro/10 dark:bg-blue-900/30 p-2 rounded-md text-azul-claro">
                  <FolderKanban size={16} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(project)}
                    className="p-2 text-gray-400 dark:text-slate-600 hover:text-azul-escuro dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-gray-400 dark:text-slate-600 hover:text-vermelho dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-azul-escuro dark:text-white mb-2">{project.nome}</h3>
              
              <div className="flex items-center gap-2 text-xs text-cinza-texto dark:text-slate-400 mb-2">
                <User size={12} className="text-azul-claro" />
                <span className="truncate font-medium" title={project.responsavel}>
                  {project.responsavel || 'Sem responsável'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-black dark:text-slate-300 mb-3">
                <Link2 size={12} className="text-azul-claro" />
                <span className="truncate font-black uppercase tracking-tight" title={project.pix}>
                  {project.pix ? `PIX: ${project.pix}` : 'Sem chave PIX'}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600">ID: {project.id.substring(0, 8)}...</span>
                <button 
                  onClick={() => handleOpenMembers(project)}
                  className="flex-1 ml-4 bg-azul-claro/10 dark:bg-blue-900/30 text-azul-claro px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-tighter hover:bg-azul-claro hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Users size={12} />
                  Gerenciar Membros
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-400 dark:text-slate-600">
            Nenhum projeto encontrado.
          </div>
        )}
      </div>

      {/* Modal - Criar/Editar Projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/40 w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
            <div className="bg-azul-escuro dark:bg-slate-800 p-6 text-white text-center border-b border-white/10">
              <h3 className="text-xl font-bold">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <p className="text-blue-200 dark:text-slate-400 text-sm mt-1">
                {editingProject ? `Editando: ${editingProject.nome}` : 'Preencha os dados abaixo'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-azul-escuro dark:text-white flex items-center gap-2">
                  <FolderKanban size={16} className="text-azul-claro" />
                  Nome do Projeto
                </label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Ballet, Futsal, Inglês..."
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-xl outline-none focus:border-azul-claro dark:focus:border-blue-700 transition-colors text-azul-escuro dark:text-white font-medium placeholder:text-gray-300 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-azul-escuro dark:text-white flex items-center gap-2">
                  <User size={16} className="text-azul-claro" />
                  Responsável pelo Projeto
                </label>
                <input 
                   type="text" 
                   value={responsavel}
                   onChange={(e) => setResponsavel(e.target.value)}
                   placeholder="Ex: Prof. João Silva"
                   className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-xl outline-none focus:border-azul-claro dark:focus:border-blue-700 transition-colors text-azul-escuro dark:text-white font-medium placeholder:text-gray-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-azul-escuro dark:text-white flex items-center gap-2">
                  <Link2 size={16} className="text-azul-claro" />
                  Chave PIX (E-mail, CPF, CNPJ ou Aleatória)
                </label>
                <input 
                  type="text" 
                  value={pix}
                  onChange={(e) => setPix(e.target.value)}
                  placeholder="Chave para recebimento das mensalidades"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-xl outline-none focus:border-azul-claro dark:focus:border-blue-700 transition-colors text-azul-escuro dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-azul-escuro dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors border-2 border-transparent"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 bg-azul-escuro dark:bg-blue-600 text-amarelo-canaa dark:text-white font-bold rounded-xl shadow-lg shadow-azul-escuro/10 dark:shadow-black/30 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Membros */}
      {isMembersModalOpen && selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/40 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
            <div className="bg-azul-escuro dark:bg-slate-800 p-6 text-white flex justify-between items-center border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold">Membros do Projeto</h3>
                <p className="text-blue-200 dark:text-slate-400 text-xs mt-1 uppercase tracking-widest font-black">{selectedProject.nome}</p>
              </div>
              <button onClick={() => setIsMembersModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-azul-escuro dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-azul-claro" />
                  Alunos Vinculados ({projectMembers.length})
                </h4>
                <button 
                  onClick={() => { setIsLinkingModalOpen(true); setMemberSearchTerm(''); }}
                  className="bg-azul-claro text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-azul-claro/90 transition-all shadow-md shadow-azul-claro/20"
                >
                  <Plus size={14} />
                  Vincular Novo Aluno
                </button>
              </div>

              <div className="space-y-2">
                {projectMembers.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 dark:text-slate-600 font-medium">Nenhum aluno vinculado a este projeto ainda.</div>
                ) : (
                  projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-azul-escuro dark:text-white font-black shadow-sm border border-gray-100 dark:border-white/10">
                          {member.alunos.nome.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-azul-escuro dark:text-white">{member.alunos.nome}</p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-wider">{member.alunos.codigo || 'S/ COD'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUnlinkStudent(member.id)}
                        className="p-2 text-gray-300 dark:text-slate-600 hover:text-vermelho dark:hover:text-rose-400 transition-colors"
                        title="Desvincular Aluno"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-white/5 flex justify-end">
              <button onClick={() => setIsMembersModalOpen(false)} className="px-6 py-2 bg-azul-escuro dark:bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Busca para Vínculo */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-azul-escuro/60 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/40 w-full max-w-md overflow-hidden border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-azul-escuro dark:text-white mb-4">Selecione o Aluno</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar pelo nome ou matrícula..." 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none border-2 border-transparent focus:border-azul-claro dark:focus:border-blue-700 transition-all font-medium text-azul-escuro dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600"
                  autoFocus
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {allStudents
                .filter(s => 
                  !projectMembers.some(m => m.aluno_id === s.id) && 
                  (s.nome.toLowerCase().includes(memberSearchTerm.toLowerCase()) || (s.codigo && s.codigo.toLowerCase().includes(memberSearchTerm.toLowerCase())))
                )
                .slice(0, 15)
                .map(student => (
                  <button 
                    key={student.id}
                    onClick={() => handleLinkStudent(student.id)}
                    className="w-full text-left p-3 hover:bg-azul-claro/10 dark:hover:bg-blue-900/30 rounded-2xl transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-azul-escuro dark:text-white group-hover:text-azul-claro dark:group-hover:text-blue-400 transition-colors">{student.nome}</p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{student.codigo}</p>
                    </div>
                    <Plus size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-azul-claro dark:group-hover:text-blue-400" />
                  </button>
                ))
              }
              {allStudents.filter(s => !projectMembers.some(m => m.aluno_id === s.id) && (s.nome.toLowerCase().includes(memberSearchTerm.toLowerCase()) || (s.codigo && s.codigo.toLowerCase().includes(memberSearchTerm.toLowerCase())))).length === 0 && (
                <div className="py-10 text-center text-gray-400 dark:text-slate-600 text-sm font-medium">Nenhum aluno disponível encontrado.</div>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-white/5 flex gap-3">
              <button onClick={() => setIsLinkingModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
