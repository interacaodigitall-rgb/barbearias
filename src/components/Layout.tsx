import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { saasService } from '../services/saasService';
import SaaSHeaderSwitcher from './SaaSHeaderSwitcher';
import { Home, Scissors, Users, Calendar, User as UserIcon, LogOut, Award, Shield, Plus, Search, Globe, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const activeShop = saasService.getActiveBarbershop();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'es' : 'pt';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { name: t('home'), path: '/', icon: Home },
  ];

  if (user?.role === 'customer') {
    navItems.push(
      { name: 'Serviços', path: '/services', icon: Scissors },
      { name: 'Barbeiros', path: '/barbers', icon: Users },
      { name: t('booking'), path: '/booking', icon: Plus },
      { name: t('appointments'), path: '/appointments', icon: Calendar }
    );
  }

  if (user?.role === 'barber') {
    navItems.push(
      { name: t('barber_dashboard'), path: '/barber-dashboard', icon: Calendar },
      { name: t('booking'), path: '/booking', icon: Plus }
    );
  }

  if (user?.role === 'admin') {
    navItems.push(
      { name: 'Gestão & Caixa', path: '/admin', icon: Wallet },
      { name: t('booking'), path: '/booking', icon: Plus }
    );
  }

  navItems.push(
    { name: t('loyalty'), path: '/loyalty', icon: Award },
    { name: 'Planos SaaS', path: '/saas', icon: Globe },
    { name: t('profile'), path: '/profile', icon: UserIcon }
  );

  // For mobile bottom nav, we limit to 5 most important items
  const mobileNavItems = navItems.filter(item => 
    [t('home'), t('booking'), t('appointments'), 'Gestão & Caixa', t('loyalty'), 'Planos SaaS', t('profile'), t('barber_dashboard')].includes(item.name)
  ).slice(0, 5);

  const isSaaSPage = location.pathname === '/' || location.pathname === '/saas';
  const isDashboardRoute = ['/admin', '/barber-dashboard', '/profile', '/appointments'].includes(location.pathname);
  const isFullWidthPage = !isDashboardRoute;

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden ${isSaaSPage ? 'bg-[#0F0F10] text-zinc-100' : 'bg-zinc-50'}`}>
      {/* SaaS Global Switcher Bar (only shown on internal or client demo pages, hidden on commercial SaaS page) */}
      {!isSaaSPage && <SaaSHeaderSwitcher />}

      {isFullWidthPage ? (
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Mobile Header */}
          <div className="md:hidden bg-zinc-900 text-white p-4 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#d4a338]/60 bg-zinc-950 shrink-0 shadow-xs">
                <img 
                  src={activeShop.logoUrl || "https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg"}
                  alt={activeShop.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight uppercase leading-none">{activeShop.name}</h1>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{activeShop.unit}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={toggleLanguage} className="text-xl" title="Mudar Idioma">
                {i18n.language === 'pt' ? '🇵🇹' : '🇪🇸'}
              </button>
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-400 font-medium">{user.name.split(' ')[0]}</span>
                  <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-white">
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Desktop) */}
          <div className="hidden md:flex flex-col w-64 bg-zinc-900 text-white min-h-[calc(100vh-37px)] p-4 sticky top-0 h-[calc(100vh-37px)] shrink-0">
            <div className="mb-6 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#d4a338]/60 bg-zinc-950 flex items-center justify-center shrink-0 shadow-md">
                  <img 
                    src={activeShop.logoUrl || "https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg"}
                    alt={activeShop.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase leading-tight">{activeShop.name}</h1>
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">{activeShop.city} • {activeShop.unit}</p>
                </div>
              </div>
            </div>
            
            <div className="px-4 mb-4">
              <button 
                onClick={toggleLanguage} 
                className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 px-3 py-2 rounded-xl text-xs font-medium w-full"
              >
                <Globe size={14} />
                <span>{i18n.language === 'pt' ? 'Português (PT)' : 'Español (ES)'}</span>
              </button>
            </div>
            
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-xs font-bold ${
                      isActive ? 'bg-[#d4a338] text-zinc-950 shadow-md font-extrabold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors mt-auto text-xs font-semibold"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            )}
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      )}

      {/* Mobile Bottom Nav (hidden on SaaS commercial page) */}
      {!isSaaSPage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around p-2 pb-safe z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px] ${
                  isActive ? 'text-zinc-900 bg-zinc-50' : 'text-zinc-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold mt-1 tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
