import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0A1118]">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-azul-claro/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Login Card */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 w-full max-w-md relative z-10">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="bg-gray-50/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
            <img src="https://i.ibb.co/hJZBJKHb/azul.png" alt="Logo" className="w-16 h-16 object-contain scale-110" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-azul-escuro tracking-tight mb-2">Gestão Instituto Canaã</h2>
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
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium text-azul-escuro outline-none focus:border-azul-claro focus:bg-white transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-azul-claro transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium text-azul-escuro outline-none focus:border-azul-claro focus:bg-white transition-all"
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
            className="w-full bg-azul-escuro text-white py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-azul-claro focus:bg-azul-claro focus:ring-4 focus:ring-azul-claro/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
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
