import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, Users, User, Phone, CreditCard, Hash, ChevronUp, ChevronDown, ChevronsUpDown, ListOrdered, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });
  const [studentsWithCarnes, setStudentsWithCarnes] = useState(new Set());
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState([]);
  const [studentProjectMap, setStudentProjectMap] = useState({}); // mapping aluno_id -> Set of projeto_ids

  // Form states
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [data_nascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('São Luís');
  const [uf, setUf] = useState('MA');
  const [cep, setCep] = useState('');
  const [pai, setPai] = useState('');
  const [mae, setMae] = useState('');
  const [resp, setResp] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [cpf, setCpf] = useState('');
  const [tel, setTel] = useState('');
  const [matricula_escola, setMatriculaEscola] = useState('');
  const [turma, setTurma] = useState('');
  const [turno, setTurno] = useState('');
  const [aluno_de_fora, setAlunoDeFora] = useState('Não');

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    // Fetch Alunos
    const { data: stuData, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome');

    // Fetch Financeiro to map projects and carnes
    const { data: finData } = await supabase.from('financeiro').select('aluno_id, projeto_id');
    
    // Build project map
    const map = {};
    const carnesSet = new Set();
    finData?.forEach(f => {
      carnesSet.add(f.aluno_id);
      if (f.projeto_id) {
        if (!map[f.aluno_id]) map[f.aluno_id] = new Set();
        map[f.aluno_id].add(f.projeto_id);
      }
    });
    setStudentProjectMap(map);
    setStudentsWithCarnes(carnesSet);

    // Fetch Projetos for filter
    const { data: proData } = await supabase.from('projetos').select('*');
    setProjects(proData || []);

    if (error) {
      Swal.fire('Erro', 'Não foi possível carregar os alunos.', 'error');
    } else {
      setStudents(stuData || []);
    }
    setLoading(false);
  }

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setCodigo(student.codigo || '');
      setNome(student.nome);
      setDataNascimento(student.data_nascimento || '');
      setSexo(student.sexo || '');
      setEndereco(student.endereco || '');
      setNumero(student.numero || '');
      setBairro(student.bairro || '');
      setCidade(student.cidade || 'São Luís');
      setUf(student.uf || 'MA');
      setCep(student.cep || '');
      setPai(student.pai || '');
      setMae(student.mae || '');
      setResp(student.resp || '');
      setParentesco(student.parentesco || '');
      setCpf(student.cpf || '');
      setTel(student.tel || '');
      setMatriculaEscola(student.matricula_escola || '');
      setTurma(student.turma || '');
      setTurno(student.turno || '');
      setAlunoDeFora(student.aluno_de_fora || 'Não');
    } else {
      setEditingStudent(null);
      const maxNum = students.reduce((acc, s) => {
        const num = parseInt(s.codigo?.replace(/\D/g, '') || '0');
        return num > acc ? num : acc;
      }, 0);
      setCodigo(`CAN-${String(maxNum + 1).padStart(2, '0')}`);
      setNome('');
      setDataNascimento('');
      setSexo('');
      setEndereco('');
      setNumero('');
      setBairro('');
      setCidade('São Luís');
      setUf('MA');
      setCep('');
      setPai('');
      setMae('');
      setResp('');
      setParentesco('');
      setCpf('');
      setTel('');
      setMatriculaEscola('');
      setTurma('');
      setTurno('');
      setAlunoDeFora('Não');
    }
    setIsModalOpen(true);
  };

  const maskCPF = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os primeiros 3 dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os segundos 3 dígitos
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen após os terceiros 3 dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Impede digitar mais de 11 dígitos
  };

  const maskPhone = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{2})(\d)/, '($1) $2') // Coloca parênteses em volta do DDD
      .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen após o prefixo (9 dígitos no total)
      .replace(/(-\d{4})\d+?$/, '$1'); // Impede digitar mais de 11 dígitos
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const studentData = {
      codigo, nome, data_nascimento, sexo,
      endereco, numero, bairro, cidade, uf, cep,
      pai, mae, resp, parentesco, cpf, tel,
      matricula_escola, turma, turno, aluno_de_fora
    };

    let error;
    if (editingStudent) {
      const res = await supabase
        .from('alunos')
        .update(studentData)
        .eq('id', editingStudent.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('alunos')
        .insert([studentData]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      Swal.fire('Erro', error.message, 'error');
    } else {
      Swal.fire({
        title: 'Sucesso!',
        text: editingStudent ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setIsModalOpen(false);
      fetchStudents();
    }
  };

  const handleDelete = async (id, nomeAlu) => {
    const result = await Swal.fire({
      title: 'Deseja excluir?',
      text: `Deseja realmente excluir o aluno "${nomeAlu}"? Os carnês já gerados permanecem no sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E53E3E',
      cancelButtonColor: '#132638',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      const { error } = await supabase.from('alunos').delete().eq('id', id);
      setLoading(false);

      if (error) {
        Swal.fire('Erro', 'Não foi possível excluir o aluno.', 'error');
      } else {
        Swal.fire('Excluído!', 'O registro do aluno foi removido.', 'success');
        fetchStudents();
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="text-gray-300" />;
    return sortConfig.direction === 'asc' ?
      <ChevronUp size={14} className="text-azul-claro" /> :
      <ChevronDown size={14} className="text-azul-claro" />;
  };

  const [onlyWithoutCarnes, setOnlyWithoutCarnes] = useState(false);

  const filteredStudents = students
    .filter(s => {
      const searchMatch = s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.resp && s.resp.toLowerCase().includes(searchTerm.toLowerCase()));

      const carneMatch = onlyWithoutCarnes ? !studentsWithCarnes.has(s.id) : true;
      const projectMatch = projectFilter === 'all' || (studentProjectMap[s.id] && studentProjectMap[s.id].has(projectFilter));

      return searchMatch && carneMatch && projectMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro flex items-center gap-2">
            <Users className="text-azul-claro" size={22} />
            Gestão de Alunos
          </h2>
          <p className="text-xs text-cinza-texto font-medium mt-0.5">Cadastre e gerencie os alunos vinculados aos projetos.</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-azul-escuro text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm w-full lg:w-auto"
        >
          <Plus size={14} />
          Cadastrar Aluno
        </button>
      </div>

      {/* Stats & Quick Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="bg-white px-3 py-1.5 rounded-md border border-gray-100 flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
            <Hash size={12} className="text-azul-claro" />
            <span className="text-[10px] font-black text-azul-escuro uppercase tracking-tight">{students.length} Total</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-md border border-gray-100 flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
            <CreditCard size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{studentsWithCarnes.size} Com Carnê</span>
          </div>
          <div className="bg-azul-claro/10 px-3 py-1.5 rounded-md border border-azul-claro/20 flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start">
            <User size={12} className="text-azul-claro" />
            <span className="text-[10px] font-black text-azul-escuro uppercase tracking-tight">{filteredStudents.length} {projectFilter !== 'all' ? 'Filtrados' : 'Vistos'}</span>
          </div>
        </div>

        <button
          onClick={() => setOnlyWithoutCarnes(!onlyWithoutCarnes)}
          className={`w-full sm:w-auto px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all border ${onlyWithoutCarnes ? 'bg-vermelho text-white border-vermelho shadow-sm shadow-red-200' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
        >
          {onlyWithoutCarnes ? '👀 Sem carnê' : 'Filtro: Sem Carnê'}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome, código ou responsável..."
            className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5">
          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-gray-50 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro border-none min-w-[160px]"
          >
            <option value="all">TODOS PROJETOS 📂</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('nome')}>
                  <div className="flex items-center gap-2">Cód / Aluno {getSortIcon('nome')}</div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('resp')}>
                  <div className="flex items-center gap-2">Responsável {getSortIcon('resp')}</div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">CPF</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contato</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && students.length === 0 ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-6 h-16 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-azul-claro/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                          {student.turma && (
                            <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-tighter">{student.turma} - {student.turno}</span>
                          )}
                          {studentsWithCarnes.has(student.id) && (
                            <span className="bg-blue-50 text-azul-claro text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">Carnê Ativo</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-azul-escuro">{student.nome}</span>
                        {student.matricula_escola && <span className="text-[10px] text-gray-400 font-mono">Mat: {student.matricula_escola}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm text-cinza-texto">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-300" />
                          {student.resp || <span className="text-gray-300 italic">Não informado</span>}
                        </div>
                        {student.parentesco && <span className="text-[10px] text-azul-claro font-bold ml-5 uppercase tracking-wider">{student.parentesco}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-cinza-texto font-mono">
                        <CreditCard size={14} className="text-gray-300" />
                        {student.cpf || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-cinza-texto">
                        <Phone size={14} className="text-gray-300" />
                        {student.tel || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(student)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(student.id, student.nome)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-gray-400 text-sm italic">Nenhum aluno cadastrado ou encontrado na busca.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {loading && students.length === 0 ? (
            <div className="py-12 text-center font-black text-azul-escuro/10 uppercase tracking-widest animate-pulse">Carregando...</div>
          ) : filteredStudents.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {student.turma && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100 uppercase">{student.turma} · {student.turno}</span>
                        )}
                        {studentsWithCarnes.has(student.id) && (
                          <span className="bg-blue-50 text-azul-claro text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100 uppercase">Carnê ✓</span>
                        )}
                      </div>
                      <p className="font-black text-azul-escuro text-sm uppercase leading-tight">{student.nome}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {student.resp ? `${student.resp}${student.parentesco ? ` (${student.parentesco})` : ''}` : 'Sem responsável'}
                      </p>
                      {student.tel && (
                        <p className="text-[10px] text-azul-claro font-bold flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {student.tel}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleOpenModal(student)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(student.id, student.nome)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400 text-sm italic">Nenhum aluno encontrado.</div>
          )}
        </div>
      </div>


      {/* Modal - Student Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-gradient-to-r from-azul-escuro to-[#1a2f43] p-8 text-white relative">
              <h3 className="text-2xl font-bold">{editingStudent ? 'Editar Ficha' : 'Ficha de Matrícula'}</h3>
              <p className="text-blue-200/80 text-sm mt-1">Dados básicos e acadêmicos do aluno</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[75vh]">

              {/* ── DADOS DO ALUNO ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro border-b border-azul-claro/20 pb-1 mb-3">Dados do Aluno</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Nome Completo *</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva Santos" required
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Data de Nascimento</label>
                <input type="date" value={data_nascimento} onChange={e => setDataNascimento(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Sexo</label>
                <select value={sexo} onChange={e => setSexo(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold">
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* ── ENDEREÇO ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro border-b border-azul-claro/20 pb-1 mb-3 mt-2">Endereço</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Endereço</label>
                <div className="flex gap-2">
                  <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, Avenida..." className="flex-1 p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Nº" className="w-20 p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold text-center" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Bairro</label>
                <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro"
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">CEP</label>
                <input type="text" value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" maxLength={9}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-mono" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Cidade</label>
                <input type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">UF</label>
                <input type="text" value={uf} onChange={e => setUf(e.target.value)} maxLength={2}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold uppercase" />
              </div>

              {/* ── FILIAÇÃO ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro border-b border-azul-claro/20 pb-1 mb-3 mt-2">Filiação</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Nome do Pai</label>
                <input type="text" value={pai} onChange={e => setPai(e.target.value)} placeholder="Nome completo do pai"
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Nome da Mãe</label>
                <input type="text" value={mae} onChange={e => setMae(e.target.value)} placeholder="Nome completo da mãe"
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              {/* ── ESCOLARIDADE ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro border-b border-azul-claro/20 pb-1 mb-3 mt-2">Escolaridade</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Escola</label>
                <input type="text" value={matricula_escola} onChange={e => setMatriculaEscola(e.target.value)} placeholder="Nome da escola"
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Turma / Série</label>
                <input type="text" value={turma} onChange={e => setTurma(e.target.value)} placeholder="Ex: 5º A"
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Turno</label>
                <select value={turno} onChange={e => setTurno(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold">
                  <option value="">Selecione...</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Aluno de Fora?</label>
                <div className="flex gap-6 mt-1 p-2 bg-gray-50 border-2 border-transparent rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-azul-escuro text-sm hover:opacity-80 transition-opacity">
                    <input type="radio" name="aluno_de_fora" value="Sim" checked={aluno_de_fora === 'Sim'} onChange={(e) => setAlunoDeFora(e.target.value)} className="w-4 h-4 accent-azul-claro cursor-pointer" />
                    Sim
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-azul-escuro text-sm hover:opacity-80 transition-opacity">
                    <input type="radio" name="aluno_de_fora" value="Não" checked={aluno_de_fora === 'Não'} onChange={(e) => setAlunoDeFora(e.target.value)} className="w-4 h-4 accent-azul-claro cursor-pointer" />
                    Não
                  </label>
                </div>
              </div>

              {/* ── RESPONSÁVEL ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro border-b border-azul-claro/20 pb-1 mb-3 mt-2">Responsável Legal</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Nome do Responsável *</label>
                <input type="text" value={resp} onChange={e => setResp(e.target.value)} placeholder="Nome do responsável" required
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Grau de Parentesco *</label>
                <select value={parentesco} onChange={e => setParentesco(e.target.value)} required
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold">
                  <option value="">Selecione...</option>
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Avô / Avó">Avô / Avó</option>
                  <option value="Tio / Tia">Tio / Tia</option>
                  <option value="Irmão / Irmã">Irmão / Irmã</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">CPF do Responsável *</label>
                <input type="text" value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} required
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-mono" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">Telefone / WhatsApp *</label>
                <input type="text" value={tel} onChange={e => setTel(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} required
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-azul-claro text-azul-escuro font-bold" />
              </div>

              <div className="flex gap-4 pt-4 md:col-span-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-azul-escuro font-bold hover:bg-gray-100 rounded-xl transition-colors">
                  Fechar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] py-4 bg-azul-escuro text-amarelo-canaa font-black rounded-xl shadow-xl shadow-azul-escuro/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  {loading ? 'Salvando...' : 'FINALIZAR CADASTRO'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}

