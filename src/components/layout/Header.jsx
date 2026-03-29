import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { LogOut, Menu, Bell, AlertCircle, Clock, CheckCircle2, ArrowRight, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Componente de item individual
function NotifItem({ notif, onWhatsApp, onClear }) {
  const configs = {
    overdue: {
      icon: <AlertCircle size={15} />,
      bg: 'bg-rose-50',
      text: 'text-rose-500',
      badge: 'bg-rose-50 text-rose-600',
      label: '🚨 Atrasado',
    },
    today: {
      icon: <Calendar size={15} />,
      bg: 'bg-amber-50',
      text: 'text-amber-500',
      badge: 'bg-amber-50 text-amber-600',
      label: '📅 Vence Hoje',
    },
    soon: {
      icon: <Clock size={15} />,
      bg: 'bg-blue-50',
      text: 'text-blue-500',
      badge: 'bg-blue-50 text-blue-600',
      label: '⏳ Em Breve',
    },
    paid: {
      icon: <CheckCircle2 size={15} />,
      bg: 'bg-emerald-50',
      text: 'text-emerald-500',
      badge: 'bg-emerald-50 text-emerald-600',
      label: '✅ Confirmado',
    },
  };

  const c = configs[notif.type] || configs.soon;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors relative group">
      <div className="flex items-start justify-between gap-3 pr-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${c.bg} ${c.text}`}>
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-azul-escuro text-xs uppercase truncate">{notif.aluno_nome}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
              {notif.mes}/{notif.ano} · R$ {notif.valor}
              {notif.projeto ? ` · ${notif.projeto}` : ''}
            </p>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${c.badge}`}>
              {c.label}
            </span>
          </div>
        </div>
        {notif.tel && notif.type !== 'paid' && (
          <button
            onClick={() => onWhatsApp(notif)}
            className="shrink-0 p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all"
            title="Cobrar via WhatsApp"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <button 
         onClick={(e) => { e.stopPropagation(); onClear(notif.id); }}
         className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:opacity-0 group-hover:opacity-100 transition-all"
         title="Remover"
       >
         <X size={14} />
      </button>
    </div>
  );
}

// Seção com título colapsável
function NotifSection({ title, color, items, onWhatsApp, onClear }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`px-4 py-2 flex items-center gap-2 ${color} sticky top-0 z-10`}>
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        <span className="text-[9px] font-black bg-white/60 rounded-full px-1.5 py-0.5">{items.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((notif, idx) => (
          <NotifItem key={`${notif.id}-${idx}`} notif={notif} onWhatsApp={onWhatsApp} onClear={onClear} />
        ))}
      </div>
    </div>
  );
}

export function Header({ toggleMobileMenu }) {
  const { user, profile } = useAuth();
  const { overdueNotifs, todayNotifs, soonNotifs, paidNotifs, unreadCount, totalNotifs, isOpen, toggleOpen, close, clearAll, clearNotification } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Atenção',
      text: 'Deseja realmente sair do sistema?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#132638',
      cancelButtonColor: '#E53E3E',
      confirmButtonText: 'Sim',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) await supabase.auth.signOut();
  };

  const handleNotifWhatsApp = (notif) => {
    const phone = (notif.tel || '').replace(/\D/g, '');
    if (!phone) return;
    const isOverdue = notif.type === 'overdue';
    const isToday = notif.type === 'today';
    let msg = '';
    if (isOverdue) {
      msg = `⚠️ *AVISO FINANCEIRO:* A mensalidade de *${notif.aluno_nome}* (${notif.mes}/${notif.ano}) está em atraso. Por favor regularize para evitar a suspensão da vaga.`;
    } else if (isToday) {
      msg = `📅 Olá! A mensalidade de *${notif.aluno_nome}* referente a *${notif.mes}/${notif.ano}* vence *hoje*.`;
    } else {
      msg = `Olá! Lembramos que a mensalidade de *${notif.aluno_nome}* referente a *${notif.mes}/${notif.ano}* vence em breve.`;
    }
    msg += `\n\n*Valor:* R$ ${notif.valor}\n\nAgradecemos a parceria! 🙏`;
    if (notif.mp_qr_code) msg += `\n\n*PIX COPIA E COLA:*\n${notif.mp_qr_code}`;
    window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`, '_blank');
    close();
  };

  return (
    <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm no-print sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-azul-escuro hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-base sm:text-xl font-bold text-azul-escuro hidden sm:block m-0 truncate max-w-[200px] md:max-w-none">
          Instituto Canaã
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Sino de Notificações */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleOpen}
            className="relative p-2 text-gray-500 hover:text-azul-escuro hover:bg-gray-100 rounded-xl transition-all"
            title="Notificações"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[9px] font-black items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
            {unreadCount === 0 && paidNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-white text-[8px] font-black items-center justify-center">
                  {paidNotifs.length}
                </span>
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-4 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-5 bg-azul-escuro text-white">
                <div className="flex items-center gap-3">
                  <Bell size={18} />
                  <span className="font-black text-sm uppercase tracking-widest">Notificações</span>
                  {totalNotifs > 0 && (
                    <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      {totalNotifs}
                    </span>
                  )}
                </div>
                <button onClick={close} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Corpo do Dropdown */}
              <div className="max-h-96 overflow-y-auto">
                {totalNotifs === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-sm font-black text-azul-escuro">Tudo em dia!</p>
                    <p className="text-xs text-gray-400 mt-1">Nenhuma notificação pendente.</p>
                  </div>
                ) : (
                  <>
                    <NotifSection
                      title="Atrasados"
                      color="bg-rose-50 text-rose-600 border-b border-rose-100"
                      items={overdueNotifs}
                      onWhatsApp={handleNotifWhatsApp}
                      onClear={clearNotification}
                    />
                    <NotifSection
                      title="Vencem Hoje"
                      color="bg-amber-50 text-amber-600 border-b border-amber-100"
                      items={todayNotifs}
                      onWhatsApp={handleNotifWhatsApp}
                      onClear={clearNotification}
                    />
                    <NotifSection
                      title="Próximos 7 dias"
                      color="bg-blue-50 text-blue-600 border-b border-blue-100"
                      items={soonNotifs}
                      onWhatsApp={handleNotifWhatsApp}
                      onClear={clearNotification}
                    />
                    <NotifSection
                      title="Pagamentos Confirmados (48h)"
                      color="bg-emerald-50 text-emerald-600 border-b border-emerald-100"
                      items={paidNotifs}
                      onWhatsApp={handleNotifWhatsApp}
                      onClear={clearNotification}
                    />
                  </>
                )}
              </div>

              {/* Footer */}
              {totalNotifs > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={clearAll}
                    className="w-full py-2.5 bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Limpar Notificações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right hidden md:block">
            <span className="text-sm font-semibold text-azul-escuro leading-none">
              {profile?.role === 'admin' ? 'Administrador' : 'Operador'}
            </span>
            <br></br><span className="text-xs text-cinza-texto">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 text-vermelho rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
