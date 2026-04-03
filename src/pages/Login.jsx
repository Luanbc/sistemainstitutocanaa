import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import { LogIn, Mail, Lock, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Swal.fire({
        title: 'Acesso Negado',
        text: 'E-mail ou senha incorretos!',
        icon: 'error',
        confirmButtonColor: '#132638',
        customClass: { popup: 'rounded-3xl' }
      });
    } else {
      navigate('/');
    }
  };

  const handleRecuperarSenha = async () => {
    if (!email) {
      return Swal.fire({
        title: 'Atenção',
        text: 'Por favor, digite seu e-mail no campo acima antes de clicar em "Esqueci a senha".',
        icon: 'warning',
        confirmButtonColor: '#132638',
        customClass: { popup: 'rounded-3xl' }
      });
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);

    if (error) {
      Swal.fire('Erro', error.message, 'error');
    } else {
      Swal.fire('E-mail Enviado!', 'Verifique sua caixa de entrada para redefinir sua senha.', 'success');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0A1118] transition-colors duration-500">
      {/* Toggle Theme */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-20 border border-white/10 backdrop-blur-md"
        title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amarelo-canaa" />}
      </button>

      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-azul-claro/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Login Card */}
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 dark:border-slate-800 w-full max-w-md relative z-10 transition-all duration-300">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="bg-gray-50/50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
            <img src="https://i.ibb.co/hJZBJKHb/azul.png" alt="Logo" className="w-16 h-16 object-contain scale-110" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-azul-escuro dark:text-white tracking-tight mb-2">Gestão Instituto Canaã</h2>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-azul-claro transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-medium text-azul-escuro dark:text-white outline-none focus:border-azul-claro focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-azul-claro transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-medium text-azul-escuro dark:text-white outline-none focus:border-azul-claro focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5 opacity-70">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Acesso Seguro</span>
            </div>
            <button
              type="button"
              onClick={handleRecuperarSenha}
              className="text-[11px] font-black tracking-wide text-azul-claro hover:text-azul-escuro transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-azul-escuro dark:bg-azul-claro text-white dark:text-azul-escuro py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-azul-claro dark:hover:bg-white focus:bg-azul-claro focus:ring-4 focus:ring-azul-claro/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Autenticando...' : (
              <>
                Acessar Painel <LogIn size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Background Bottom Wave or Footer */}
      <div className="absolute bottom-6 left-0 w-full text-center z-10 pointer-events-none space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
          &copy; {new Date().getFullYear()} Inst. Social e Educacional Canaã
        </p>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">
          Desenvolvido por Luan Costa
        </p>
      </div>
    </div>
  );
}
