import React, { createContext, useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
      // Always release loading, even if profile fetch fails
      setLoading(false);
    };

    // Busca a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de autenticação (login, logout, token refresh, recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'PASSWORD_RECOVERY') {
        setTimeout(async () => {
          const { value: newPassword } = await Swal.fire({
            title: 'Redefinição de Senha',
            text: 'Bem-vindo de volta! Digite abaixo sua nova senha de acesso.',
            input: 'password',
            icon: 'info',
            inputPlaceholder: 'Sua nova senha',
            allowOutsideClick: false,
            allowEscapeKey: false,
            backdrop: '#0A1118', // Fundo escuro opaco para esconder o sistema
            customClass: { popup: 'rounded-[2rem]' },
            confirmButtonText: 'Salvar e Acessar',
            confirmButtonColor: '#10b981',
            inputValidator: (value) => {
              if (!value || value.length < 6) {
                return 'A senha deve ter pelo menos 6 caracteres!';
              }
            }
          });

          if (newPassword) {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
              Swal.fire('Erro!', 'Ocorreu um erro ao atualizar sua senha.', 'error');
            } else {
              await Swal.fire({
                title: 'Senha Criada!',
                text: 'Tudo pronto! Agora, por favor, faça o login no sistema utilizando sua nova senha.',
                icon: 'success',
                confirmButtonColor: '#10b981',
                allowOutsideClick: false,
                allowEscapeKey: false,
                backdrop: '#0A1118'
              });
              // Força o deslogamento imediato para obrigar o fluxo natural de tela de Login
              await supabase.auth.signOut();
            }
          }
        }, 800);
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading is now released inside fetchProfile itself,
  // so this secondary effect is no longer needed.

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === 'admin',
    isOperator: profile?.role === 'operator',
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
