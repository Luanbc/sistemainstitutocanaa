import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Users, FolderKanban, Wallet, FileText, Settings,
  X, BarChart3, AlertCircle, ChevronLeft, ChevronRight,
  Receipt, Zap, ClipboardList, UserCog
} from 'lucide-react';

const navItems = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Relatórios', path: '/relatorios', icon: BarChart3, isAdminOnly: true },
  { name: 'Despesas', path: '/despesas', icon: Receipt, isAdminOnly: true },
  { name: 'Alunos', path: '/alunos', icon: Users },
  { name: 'Projetos', path: '/projetos', icon: FolderKanban, isAdminOnly: true },
  { name: 'Financeiro', path: '/financeiro', icon: Wallet },
  { name: 'Inadimplentes', path: '/inadimplentes', icon: AlertCircle },
  { name: 'Ações', path: '/acoes', icon: Zap },
  { name: 'Contratos', path: '/contratos', icon: FileText },
  { name: 'Gerar Carnês', path: '/carnes', icon: FileText },
];

const adminItems = [
  { name: 'Logs', path: '/logs', icon: ClipboardList },
  { name: 'Usuários', path: '/usuarios', icon: UserCog },
  { name: 'Configurações', path: '/configuracoes', icon: Settings },
];

export function Sidebar({ isMobile, closeMenu, isCollapsed, toggleSidebar }) {
  const { profile, isAdmin } = useAuth();
  const [isHovered, setIsHovered] = React.useState(false);

  const isExpanded = !isCollapsed || isHovered || isMobile;
  const filteredItems = navItems.filter(item => !item.isAdminOnly || isAdmin);

  const linkClass = (isActive) =>
    `flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 font-medium whitespace-nowrap overflow-hidden ${!isExpanded ? 'justify-center px-3' : ''
    } ${isActive
      ? 'bg-azul-claro text-white shadow-md shadow-azul-claro/20'
      : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`;

  const content = (
    <>
      {/* Logo */}
      <div className={`p-5 flex items-center border-b border-gray-700/50 transition-all duration-300 ${!isExpanded ? 'justify-center px-4' : 'justify-between'}`}>
        <div className="flex items-center">
          <img src="https://i.ibb.co/XZ42Xw34/branca.png" alt="Logo" className="w-14 h-14 scale-[1.3] object-contain shrink-0 origin-left" />
          <div className={`flex flex-col transition-all duration-300 overflow-hidden ${isExpanded ? 'max-w-[150px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`}>
            <span className="text-white font-bold text-base tracking-tight whitespace-nowrap">Instituto Social e Educacional Canaã</span>
            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mt-0.5">
            </span>
          </div>
        </div>
        {isMobile && (
          <button onClick={closeMenu} className="text-gray-400 hover:text-white transition-colors">
            <X size={22} />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-3 overflow-y-auto overflow-x-hidden">
        <p className={`text-[9px] font-black uppercase text-gray-600 tracking-widest transition-all duration-300 overflow-hidden ${isExpanded ? 'h-3 opacity-100 mb-2 px-4' : 'h-0 opacity-0 mb-0 px-0'}`}>Menu</p>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={isMobile ? closeMenu : undefined}
            title={!isExpanded ? item.name : ''}
            className={({ isActive }) => linkClass(isActive)}
          >
            <item.icon size={18} className="shrink-0" />
            <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'max-w-[150px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Admin Section */}
      {isAdmin && (
        <div className="p-3 border-t border-gray-700/50 space-y-0.5 overflow-x-hidden">
          <p className={`text-[9px] font-black uppercase text-gray-600 tracking-widest transition-all duration-300 overflow-hidden ${isExpanded ? 'h-3 opacity-100 mb-2 px-4' : 'h-0 opacity-0 mb-0 px-0'}`}>Administração</p>
          {adminItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? closeMenu : undefined}
              title={!isExpanded ? item.name : ''}
              className={({ isActive }) => linkClass(isActive)}
            >
              <item.icon size={18} className="shrink-0" />
              <span className={`text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'max-w-[150px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Collapse button */}
      {!isMobile && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
          className={`absolute -right-3 top-20 bg-azul-claro text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-azul-escuro hover:scale-110 transition-all z-50 ${isCollapsed ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      )}

      {/* Developer Signature */}
      <div className="mt-auto p-4 border-t border-gray-700/50 flex flex-col items-center justify-center text-center">
        <p className={`text-[8px] font-black uppercase tracking-widest text-gray-600 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0 m-0'}`}>Desenvolvido por</p>
        <p className={`text-[10px] font-black uppercase tracking-widest text-emerald-500 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0 m-0'}`}>Luan Costa</p>
        {!isExpanded && (
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1" title="Desenvolvido por Luan Costa">LC</p>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return <div className="flex flex-col h-full">{content}</div>;
  }

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${isExpanded ? 'w-60' : 'w-[72px]'} bg-azul-escuro shadow-xl min-h-screen flex flex-col no-print hidden md:flex sticky top-0 h-screen transition-all duration-300 ease-in-out relative group`}
    >
      {content}
    </aside>
  );
}
