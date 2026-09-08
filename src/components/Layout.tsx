import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { saasService } from '../services/saasService';
import { updateTenantHeadAndPWA } from '../utils/pwaUtils';
import { Home, Scissors, Users, Calendar, User as UserIcon, LogOut, Award, Shield, Plus, Search, Globe, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const activeShop = saasService.getActiveBarbershop();

  React.useEffect(() => {
    if (activeShop) {
      updateTenantHeadAndPWA(activeShop);
    }
  }, [activeShop]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'es' : 'pt';
    i18n.changeLanguage(newLang);
  };

  // Check if current URL is under a tenant slug e.g. /seu-elias/...
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSlug = pathParts[0] && !['login', 'register', 'saas', 'super-admin', 'services', 'barbers', 'booking', 'loyalty', 'appointments', 'profile', 'admin', 'barber-dashboard'].includes(pathParts[0])
    ? pathParts[0]
    : activeShop?.slug;

  const homePath = currentSlug ? `/${currentSlug}` : '/';
  const bookingPath = currentSlug ? `/${currentSlug}/booking` : '/booking';
  const servicesPath = currentSlug ? `/${currentSlug}/services` : '/services';
  const appointmentsPath = currentSlug ? `/${currentSlug}/appointments` : '/appointments';
  const loyaltyPath = currentSlug ? `/${currentSlug}/loyalty` : '/loyalty';

  const navItems = [
    { name: t('home'), path: homePath, icon: Home },
  ];

  if (user?.role === 'customer') {
    navItems.push(
      { name: 'Serviços', path: servicesPath, icon: Scissors },
      { name: 'Barbeiros', path: '/barbers', icon: Users },
      { name: t('booking'), path: bookingPath, icon: Plus },
      { name: t('appointments'), path: appointmentsPath, icon: Calendar }
    );
  }

  if (user?.role === 'barber') {
    navItems.push(
      { name: t('barber_dashboard'), path: '/barber-dashboard', icon: Calendar },
      { name: t('booking'), path: bookingPath, icon: Plus }
    );
  }

  if (user?.role === 'admin') {
    navItems.push(
      { name: 'Gestão & Caixa', path: '/admin', icon: Wallet },
      { name: t('booking'), path: bookingPath, icon: Plus }
    );
  }

  navItems.push(
    { name: t('loyalty'), path: loyaltyPath, icon: Award },
    { name: t('profile'), path: user ? '/profile' : '/login', icon: UserIcon }
  );

  if (user?.role === 'superadmin') {
    navItems.push({ name: 'Super Admin', path: '/super-admin', icon: Shield });
  }

  // Mobile Bottom Navigation items (Canonical 5-slot layout with + Agendar as primary FAB)
  let secondMobileItem = { name: 'Serviços', path: servicesPath, icon: Scissors };
  if (user?.role === 'barber') {
    secondMobileItem = { name: 'Agenda', path: '/barber-dashboard', icon: Calendar };
  } else if (user?.role === 'admin' || user?.role === 'superadmin') {
    secondMobileItem = { name: 'Gestão', path: '/admin', icon: Wallet };
  } else if (user?.role === 'customer') {
    secondMobileItem = { name: 'Horários', path: appointmentsPath, icon: Calendar };
  }

  interface MobileNavItem {
    name: string;
    path: string;
    icon: any;
    isAction?: boolean;
  }

  const mobileBottomNavItems: MobileNavItem[] = [
    { name: t('home') || 'Início', path: homePath, icon: Home },
    secondMobileItem,
    { name: '+ Agendar', path: bookingPath, icon: Plus, isAction: true },
    { name: t('loyalty') || 'Fidelidade', path: loyaltyPath, icon: Award },
    { name: user ? (t('profile') || 'Perfil') : 'Entrar', path: user ? '/profile' : '/login', icon: UserIcon },
  ];

  const isSaaSPage = location.pathname === '/' || location.pathname === '/saas';
  const isDashboardRoute = ['/admin', '/barber-dashboard', '/profile', '/appointments'].includes(location.pathname);
  const isFullWidthPage = !isDashboardRoute;

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden ${isSaaSPage ? 'bg-[#0F0F10] text-zinc-100' : 'bg-zinc-50'}`}>
      {/* SaaS Global Switcher Bar (only shown on internal or client demo pages, hidden on commercial SaaS page and tenant dashboards) */}
      

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
          <main className="flex-1 p-4 md:p-8 pb-36 md:pb-8 w-full max-w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      )}

      {/* Mobile Bottom Nav (hidden on SaaS commercial page) */}
      {!isSaaSPage && (
        <nav
          aria-label="Navegação inferior"
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-2 py-1 pb-safe z-50 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] flex items-end justify-around h-16"
        >
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isBookingActive = location.pathname === bookingPath || location.pathname.endsWith('/booking');
            const isActive = item.isAction ? isBookingActive : (location.pathname === item.path);

            if (item.isAction) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center -translate-y-4 group relative"
                  title="Agendar Horário"
                >
                  {/* Subtle golden ambient glow behind the FAB */}
                  <div className="absolute inset-0 rounded-full bg-[#f5ab2b]/40 blur-md group-hover:blur-lg transition-all" />

                  {/* Circular Golden FAB Button */}
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#d4a338] via-[#f5ab2b] to-[#fcd34d] flex items-center justify-center shadow-[0_6px_20px_rgba(245,171,43,0.45)] border-4 border-white active:scale-90 group-hover:scale-105 transition-all ${
                    isBookingActive ? 'ring-2 ring-zinc-950 ring-offset-2' : ''
                  }`}>
                    <Plus size={28} strokeWidth={3.5} className="text-zinc-950 drop-shadow-xs" />
                  </div>

                  {/* High contrast label */}
                  <span className="text-[10px] font-black text-zinc-900 tracking-tight mt-0.5 whitespace-nowrap">
                    + Agendar
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] ${
                  isActive ? 'text-[#d4a338]' : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'text-[#d4a338]' : 'text-stone-400'} />
                <span className={`text-[10px] tracking-tight mt-1 ${
                  isActive ? 'font-black text-stone-900' : 'font-medium text-stone-500'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
