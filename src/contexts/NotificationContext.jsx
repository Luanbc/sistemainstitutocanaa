import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const getDueDate = (pay) => {
  if (pay.vencimento && pay.vencimento.includes('/')) {
    const [day, month, year] = pay.vencimento.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  if (pay.mes && pay.ano) {
    const monthIdx = months.indexOf(pay.mes);
    if (monthIdx !== -1) return new Date(parseInt(pay.ano), monthIdx + 1, 0);
  }
  return null;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [overdueNotifs, setOverdueNotifs] = useState([]);
  const [todayNotifs, setTodayNotifs] = useState([]);
  const [soonNotifs, setSoonNotifs] = useState([]);
  const [paidNotifs, setPaidNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    in7Days.setHours(23, 59, 59, 999);

    // 1. Buscar pagamentos pendentes
    const { data: pendingData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('pago', false)
      .order('aluno_nome');

    // 2. Buscar pagamentos confirmados recentemente (últimas 48h)
    const since48h = new Date();
    since48h.setHours(since48h.getHours() - 48);

    const { data: paidData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('pago', true)
      .gte('updated_at', since48h.toISOString())
      .order('updated_at', { ascending: false })
      .limit(10);

    // Classificar pendentes por categoria
    const dismissedIds = JSON.parse(localStorage.getItem('@Canaa:dismissedNotifs') || '[]');
    const seenIds = JSON.parse(localStorage.getItem('@Canaa:seenNotifs') || '[]');

    const overdue = [];
    const dueToday = [];
    const dueSoon = [];
    let newUnreadCount = 0;

    (pendingData || []).forEach(pay => {
      if (dismissedIds.includes(pay.id)) return;

      const dueDate = getDueDate(pay);
      if (!dueDate) return;

      if (dueDate < today) {
        overdue.push({ ...pay, dueDate, type: 'overdue' });
        if (!seenIds.includes(pay.id)) newUnreadCount++;
      } else if (dueDate >= today && dueDate <= todayEnd) {
        dueToday.push({ ...pay, dueDate, type: 'today' });
        if (!seenIds.includes(pay.id)) newUnreadCount++;
      } else if (dueDate > todayEnd && dueDate <= in7Days) {
        dueSoon.push({ ...pay, dueDate, type: 'soon' });
      }
    });

    const paid = (paidData || [])
      .filter(pay => !dismissedIds.includes(pay.id))
      .map(pay => ({ ...pay, type: 'paid' }));

    setOverdueNotifs(overdue);
    setTodayNotifs(dueToday);
    setSoonNotifs(dueSoon);
    setPaidNotifs(paid);

    setUnreadCount(newUnreadCount);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const totalNotifs = overdueNotifs.length + todayNotifs.length + soonNotifs.length + paidNotifs.length;

  const markAllRead = () => {
    setUnreadCount(0);
    const seenIds = JSON.parse(localStorage.getItem('@Canaa:seenNotifs') || '[]');
    const allIds = [...overdueNotifs, ...todayNotifs].map(n => n.id);
    localStorage.setItem('@Canaa:seenNotifs', JSON.stringify(Array.from(new Set([...seenIds, ...allIds]))));
  };

  const clearAll = () => {
    const dismissedIds = JSON.parse(localStorage.getItem('@Canaa:dismissedNotifs') || '[]');
    const allIds = [...overdueNotifs, ...todayNotifs, ...soonNotifs, ...paidNotifs].map(n => n.id);
    localStorage.setItem('@Canaa:dismissedNotifs', JSON.stringify(Array.from(new Set([...dismissedIds, ...allIds]))));
    
    setOverdueNotifs([]);
    setTodayNotifs([]);
    setSoonNotifs([]);
    setPaidNotifs([]);
    setUnreadCount(0);
    setIsOpen(false);
  };

  const clearNotification = (id) => {
    const dismissedIds = JSON.parse(localStorage.getItem('@Canaa:dismissedNotifs') || '[]');
    if (!dismissedIds.includes(id)) {
      localStorage.setItem('@Canaa:dismissedNotifs', JSON.stringify([...dismissedIds, id]));
      fetchNotifications();
    }
  };

  const toggleOpen = () => {
    setIsOpen(prev => {
      if (!prev) markAllRead();
      return !prev;
    });
  };
  const close = () => {
    if (isOpen) markAllRead();
    setIsOpen(false);
  };

  return (
    <NotificationContext.Provider value={{
      overdueNotifs,
      todayNotifs,
      soonNotifs,
      paidNotifs,
      unreadCount,
      totalNotifs,
      isOpen,
      toggleOpen,
      close,
      clearAll,
      clearNotification,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
