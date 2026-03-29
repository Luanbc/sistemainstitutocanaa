import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, FolderKanban, Wallet, TrendingUp, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProjetos: 0,
    totalPendente: 0,
    totalPago: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    // Em um cenário real, faríamos queries separadas ou uma RPC
    const { count: alunosCount } = await supabase.from('alunos').select('*', { count: 'exact', head: true });
    const { count: projetosCount } = await supabase.from('projetos').select('*', { count: 'exact', head: true });
    
    const { data: financeiro } = await supabase.from('financeiro').select('valor, pago');
    
    if (financeiro) {
      let pendente = 0;
      let pago = 0;
      financeiro.forEach(item => {
        const val = parseFloat(item.valor.replace(',', '.')) || 0;
        if (item.pago) pago += val;
        else pendente += val;
      });
      setStats({
        totalAlunos: alunosCount || 0,
        totalProjetos: projetosCount || 0,
        totalPendente: pendente,
        totalPago: pago
      });
    }
  }

  const chartData = {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'],
    datasets: [
      {
        label: 'Pago',
        data: [1200, 1900, 3000, 5000, stats.totalPago],
        backgroundColor: '#28a745',
      },
      {
        label: 'Pendente',
        data: [2100, 1500, 2000, 1800, stats.totalPendente],
        backgroundColor: '#E53E3E',
      },
    ],
  };

  const cards = [
    { title: 'Total de Alunos', value: stats.totalAlunos, icon: Users, color: 'bg-blue-500' },
    { title: 'Projetos Ativos', value: stats.totalProjetos, icon: FolderKanban, color: 'bg-indigo-500' },
    { title: 'Arrecadação (Pago)', value: stats.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: CheckCircle2, color: 'bg-green-500' },
    { title: 'Pendente', value: stats.totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: AlertCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-azul-escuro">Visão Geral</h2>
        <p className="text-cinza-texto">Bem-vindo ao painel administrativo do Instituto Canaã.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`${card.color} p-3 rounded-xl text-white`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-cinza-texto">{card.title}</p>
              <p className="text-xl font-bold text-azul-escuro">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-azul-escuro">Fluxo de Arrecadação</h3>
            <div className="flex items-center gap-2 text-sm text-cinza-texto">
              <TrendingUp size={16} className="text-green-500" />
              <span>+12% vs mês anterior</span>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar 
              data={chartData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>

        {/* Quick Actions / Recent Activity Placeholder */}
        <div className="bg-azul-escuro text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition-colors text-left border border-white/10">
                <Users size={18} className="text-azul-claro" />
                <span>Cadastrar Novo Aluno</span>
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition-colors text-left border border-white/10">
                <FileText size={18} className="text-amarelo-canaa" />
                <span>Gerar Novos Carnês</span>
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition-colors text-left border border-white/10">
                <Wallet size={18} className="text-green-400" />
                <span>Registrar Pagamento Mensal</span>
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-sm text-gray-400">
            Instituto Canaã - Versão 2.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
