import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Exemplo de notificações estáticas para o frontend
  const mockNotifications = [
    { id: 1, title: 'Devolução Atrasada', message: 'Betoneira 400L (Locação #102) não foi devolvida hoje.', time: '1h atrás', unread: true },
    { id: 2, title: 'Nova Reserva', message: 'Cliente João Silva solicitou um Martelete 800W para amanhã.', time: '3h atrás', unread: true },
    { id: 3, title: 'Manutenção Concluída', message: 'Serra Circular XYZ voltou da manutenção.', time: 'Ontem', unread: false },
  ];

  // Global search is not yet implemented — returns empty list
  const filteredResults: { id: string; path: string; icon: string; title: string; subtitle: string }[] = [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (resultPath: string) => {
    navigate(resultPath);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('sharktools_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('sharktools_theme', 'dark'); } catch (e) { }
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('sharktools_theme', 'light'); } catch (e) { }
    }
  }, [isDarkMode]);

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/locacoes', icon: 'receipt_long', label: 'Locações' },
    { path: '/calendario', icon: 'calendar_month', label: 'Calendário' },
    { path: '/inventario', icon: 'inventory_2', label: 'Estoque' },
    { path: '/clientes', icon: 'group', label: 'Clientes' },
    { path: '/financeiro', icon: 'account_balance_wallet', label: 'Financeiro' },
    { path: '/fiscal', icon: 'request_quote', label: 'Fiscal' },
    { path: '/relatorios', icon: 'bar_chart', label: 'Relatórios' },
    { path: '/usuarios', icon: 'admin_panel_settings', label: 'Usuários' },
    { path: '/configuracoes', icon: 'settings', label: 'Configurações' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">sailing</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-primary dark:text-white text-base font-bold leading-none">SharkTools</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">SaaS de Gestão</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = path === item.path || (path.startsWith(item.path) && item.path !== '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                  ? 'bg-primary/10 text-primary dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgxQ4cOSUB9QFlY_Xudqi8aTaitcCm2RgbMY0sqSiPis5td3Z9LqGdJKQWxSoa7Uf8DVX_MYdWSxYkNFj0jLrmni75zJ7PJKVf6OLdWwLcecKADHKgnwmcMJE1XUhyRPA5HL-4XEDC2pRy5kYWJcAO6kJq40bgsyzq6eGrbPfwjJ1LLsmBGwLQlJUkPWEmCs2SD-epcOr54-oS6OmRQ69linuAsQpH_E_8d-U7wze1kk-90p3EdB_tWZ9r-V3nqX2O4EFKjD3d7FlJ"
                alt="Admin"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary dark:text-white">Carlos Silva</span>
              <span className="text-[10px] text-slate-500">Super Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl" ref={searchRef}>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar clientes, equipamentos, locações..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-500 dark:text-white"
              />

              {/* Search Dropdown */}
              {isSearchOpen && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  {filteredResults.length > 0 ? (
                    <ul className="py-2">
                      {filteredResults.map((result) => (
                        <li key={result.id}>
                          <button
                            onClick={() => handleSearchSelect(result.path)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start gap-3 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">
                                {result.icon}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {result.title}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {result.subtitle}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      Nenhum resultado encontrado para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors flex items-center justify-center"
              title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              <span className="material-symbols-outlined">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
                title="Notificações"
              >
                <span className="material-symbols-outlined">notifications</span>
                {mockNotifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notificações</h3>
                    <button className="text-xs text-primary font-medium hover:underline">Marcar todas como lidas</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {mockNotifications.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {mockNotifications.map((notif) => (
                          <div key={notif.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${notif.unread ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`mt-1 size-2 shrink-0 rounded-full ${notif.unread ? 'bg-primary' : 'bg-transparent'}`}></div>
                              <div className="flex-1 space-y-1">
                                <p className={`text-sm ${notif.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium pt-1">
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">notifications_off</span>
                        <p className="text-sm">Nenhuma notificação nova.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
                    <button className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-primary transition-colors">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Ajuda">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center justify-center"
              title="Sair"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <Link
              to="/locacoes/nova"
              className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nova Locação
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
