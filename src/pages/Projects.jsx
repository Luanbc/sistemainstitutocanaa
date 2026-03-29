import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, Link2, FolderKanban, User } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro flex items-center gap-2">
            <FolderKanban className="text-azul-claro" size={22} />
            Gestão de Projetos
          </h2>
          <p className="text-xs text-cinza-texto font-medium mt-0.5">Cadastre e gerencie os projetos sociais do instituto.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-azul-escuro text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm w-full md:w-auto"
        >
          <Plus size={14} />
          Novo Projeto
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-3 py-2.5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
        <div className="w-full relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar projeto pelo nome..." 
            className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && projects.length === 0 ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-40 rounded-lg animate-pulse border border-gray-100"></div>
          ))
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-azul-claro/10 p-2 rounded-md text-azul-claro">
                  <FolderKanban size={16} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(project)}
                    className="p-2 text-gray-400 hover:text-azul-escuro hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-gray-400 hover:text-vermelho hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-azul-escuro mb-2">{project.nome}</h3>
              
              <div className="flex items-center gap-2 text-xs text-cinza-texto mb-2">
                <User size={12} className="text-azul-claro" />
                <span className="truncate font-medium" title={project.responsavel}>
                  {project.responsavel || 'Sem responsável'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-cinza-texto mb-3">
                <Link2 size={12} className="text-azul-claro" />
                <span className="truncate font-medium" title={project.pix}>
                  {project.pix ? `PIX: ${project.pix}` : 'Sem chave PIX'}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>ID: {project.id}</span>
                <span className="text-azul-claro">Projeto Ativo</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-400">
            Nenhum projeto encontrado.
          </div>
        )}
      </div>

      {/* Modal - Renderized conditionally or using a portal would be better, but for simplicity: */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-azul-escuro p-6 text-white text-center">
              <h3 className="text-xl font-bold">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <p className="text-blue-200 text-sm mt-1">
                {editingProject ? `Editando: ${editingProject.nome}` : 'Preencha os dados abaixo'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-azul-escuro flex items-center gap-2">
                  <FolderKanban size={16} className="text-azul-claro" />
                  Nome do Projeto
                </label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Ballet, Futsal, Inglês..."
                  className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro transition-colors text-azul-escuro font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-azul-escuro flex items-center gap-2">
                  <User size={16} className="text-azul-claro" />
                  Responsável pelo Projeto
                </label>
                <input 
                   type="text" 
                   value={responsavel}
                   onChange={(e) => setResponsavel(e.target.value)}
                   placeholder="Ex: Prof. João Silva"
                   className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro transition-colors text-azul-escuro font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-azul-escuro flex items-center gap-2">
                  <Link2 size={16} className="text-azul-claro" />
                  Chave PIX (E-mail, CPF, CNPJ ou Aleatória)
                </label>
                <input 
                  type="text" 
                  value={pix}
                  onChange={(e) => setPix(e.target.value)}
                  placeholder="Chave para recebimento das mensalidades"
                  className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-azul-claro transition-colors text-azul-escuro"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-azul-escuro font-bold hover:bg-gray-100 rounded-xl transition-colors border-2 border-transparent"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 bg-azul-escuro text-amarelo-canaa font-bold rounded-xl shadow-lg shadow-azul-escuro/10 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
