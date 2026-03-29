import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ adminOnly = false }) {
  const { session, profile, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-cinza-fundo">
        <div className="w-12 h-12 border-4 border-azul-claro border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver logado, manda pro login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige admin mas o usuário não é admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Se logado e com permissão, renderiza as páginas filhas
  return <Outlet />;
}
