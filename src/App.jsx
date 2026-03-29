import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Components
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Reports from './pages/Reports';
import Projects from './pages/Projects';
import Students from './pages/Students';
import Financial from './pages/Financial';
import Carnes from './pages/Carnes';
import Inadimplentes from './pages/Inadimplentes';
import Expenses from './pages/Expenses';
import Logs from './pages/Logs';
import Actions from './pages/Actions';
import Contratos from './pages/Contratos';
import BoletoOnline from './pages/BoletoOnline';

// Placeholders for now
const Placeholder = ({ title }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 italic text-gray-400">
    Página de {title} em desenvolvimento...
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/boleto/:id" element={<BoletoOnline />} />
            
            {/* Rotas Protegidas - Gerais */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/alunos" element={<Students />} />
                <Route path="/financeiro" element={<Financial />} />
                <Route path="/inadimplentes" element={<Inadimplentes />} />
                <Route path="/carnes" element={<Carnes />} />
                <Route path="/acoes" element={<Actions />} />
                <Route path="/contratos" element={<Contratos />} />
              </Route>
            </Route>

            {/* Rotas Protegidas - Apenas Admin */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route element={<Layout />}>
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/despesas" element={<Expenses />} />
                <Route path="/projetos" element={<Projects />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/usuarios" element={<Placeholder title="Gerenciamento de Usuários" />} />
                <Route path="/configuracoes" element={<Placeholder title="Configurações" />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
