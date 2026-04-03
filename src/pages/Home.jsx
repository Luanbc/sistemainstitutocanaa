import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FolderKanban, Users, ShieldCheck, ArrowRight, LayoutDashboard, Calendar, Star, TrendingUp, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Home() {
  const [projetos, setProjetos] = useState([]);
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProjetos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    setLoading(true);
    const { data: proData } = await supabase.from('projetos').select('*');
    const { count: alunosCount } = await supabase.from('alunos').select('*', { count: 'exact', head: true });

    // Contagem de alunos por projeto (simulada ou real se houver relação clara)
    // Para simplificar, vamos pegar a lista de projetos e mostrar o status
    setProjetos(proData || []);
    setStats({
      totalAlunos: alunosCount || 0,
      totalProjetos: proData?.length || 0
    });
    setLoading(false);
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-2 lg:px-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-azul-escuro dark:bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl shadow-azul-escuro/20 transition-colors">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-azul-claro/20 text-azul-claro px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-azul-claro/20">
            Painel de Gestão de Projetos
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
            Bem-vindo<span className="text-azul-claro"></span>
          </h1>
          <p className="text-gray-400 dark:text-slate-400 text-lg font-medium leading-relaxed mb-8">
            Transformando vidas através da educação e esporte.<br></br>
            Gerencie seus alunos (Acadêmico), finanças (Financeiro) e projetos (Administrativo).
          </p>
          <div className="flex flex-wrap gap-4">
            <NavLink to="/relatorios" className="bg-white dark:bg-azul-claro text-azul-escuro px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-azul-claro dark:hover:bg-white hover:text-white dark:hover:text-azul-escuro transition-all">
              <TrendingUp size={18} /> Ver Estatísticas
            </NavLink>
            <NavLink to="/financeiro" className="bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all">
              Gestão Financeira <ArrowRight size={18} />
            </NavLink>
          </div>
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-azul-claro/10 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-azul-claro/10 rounded-full blur-3xl"></div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-300 uppercase tracking-widest mb-1">Alunos Beneficiados</p>
            <p className="text-2xl font-black text-azul-escuro dark:text-white tracking-tighter">{stats.totalAlunos}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-md">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-300 uppercase tracking-widest mb-1">Projetos Ativos</p>
            <p className="text-2xl font-black text-azul-escuro dark:text-white tracking-tighter">{stats.totalProjetos}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-md">
            <FolderKanban size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-300 uppercase tracking-widest mb-1">Transparência Total</p>
            <p className="text-2xl font-black text-azul-escuro dark:text-white tracking-tighter">100%</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-md">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-azul-escuro dark:text-white tracking-tight">Nossos Projetos</h2>
          <NavLink to="/administrativo" className="text-azul-claro font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
            Gerenciar Hub <ArrowRight size={16} />
          </NavLink>
        </div>

        {loading ? (
          <div className="py-20 text-center font-black text-azul-escuro/10 dark:text-white/10 uppercase tracking-widest text-xl">Carregando Projetos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projetos.map((projeto) => (
              <div key={projeto.id} className="bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-azul-claro">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gray-50 dark:bg-slate-800 text-azul-escuro dark:text-white p-2 rounded-md group-hover:bg-azul-escuro dark:group-hover:bg-azul-claro group-hover:text-white dark:group-hover:text-azul-escuro transition-colors">
                    <Star size={18} />
                  </div>
                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-sm">Ativo</span>
                </div>
                <h3 className="text-base font-black text-azul-escuro dark:text-white mb-2 uppercase tracking-tight leading-tight truncate">{projeto.nome}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <User size={12} className="text-azul-claro shrink-0" />
                  <p className="text-xs font-bold text-cinza-texto dark:text-slate-300 truncate" title={projeto.responsavel}>
                    {projeto.responsavel || 'Sem responsável'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 dark:text-slate-300 uppercase tracking-widest">Chave PIX</p>
                    <p className="text-[10px] font-bold text-azul-escuro dark:text-slate-200 truncate max-w-[120px]" title={projeto.pix}>{projeto.pix || 'Não cadastrada'}</p>
                  </div>
                  <NavLink to="/alunos" className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-azul-escuro dark:text-white hover:bg-azul-escuro dark:hover:bg-azul-claro hover:text-white transition-all">
                    <Users size={14} />
                  </NavLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
