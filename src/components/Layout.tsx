import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { saasService } from '../services/saasService';
import { SaaSBarbershop } from '../models';
import { updateTenantHeadAndPWA } from '../utils/pwaUtils';
import { Home, Scissors, Users, Calendar, User as UserIcon, LogOut, Award, Shield, Plus, Search, Globe, Wallet, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Reactive state for active barbershop to stay in sync with tenant routes
  const [activeShop, setActiveShop] = React.useState<SaaSBarbershop>(() => saasService.getActiveBarbershop());

  // Listen to active shop changes
  React.useEffect(() => {
    const handleShopChange = () => {
      setActiveShop(saasService.getActiveBarbershop());
    };
    window.addEventListener('barbersaas_active_shop_changed', handleShopChange);
    return () => window.removeEventListener('barbersaas_active_shop_changed', handleShopChange);
  }, []);

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

  // Determine active tenant slug dynamically from current URL or stored active barbershop
  const pathParts = location.pathname.split('/').filter(Boolean);
  const excludedPrefixes = ['login', 'register', 'saas', 'super-admin', 'services', 'barbers', 'booking', 'loyalty', 'appointments', 'profile', 'admin', 'gerente', 'barber-dashboard'];
  
  const routeSlug = pathParts[0] && !excludedPrefixes.includes(pathParts[0]) ? pathParts[0] : null;
  const targetSlug = routeSlug || activeShop?.slug || 'rogerx-barbershop';

  // Navigation targets are always scoped to the active barbershop tenant - NEVER to '/'
  const homePath = `/${targetSlug}`;
  const bookingPath = `/${targetSlug}/booking`;
  const servicesPath = `/${targetSlug}/services`;
  const appointmentsPath = `/${targetSlug}/appointments`;
  const loyaltyPath = `/${targetSlug}/loyalty`;

  // Handler for Início navigation on iOS Standalone & Web
  const handleHomeClick = (e: React.MouseEvent) => {
    // If already at the barbershop home page, smoothly scroll to top (#inicio)
    if (location.pathname === homePath || location.pathname === `/${targetSlug}/`) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems = [
    { name: t('home') || 'Início', path: homePath, icon: Home, isHome: true },
  ];

  if (user?.role === 'customer') {
    navItems.push(
      { name: 'Serviços', path: servicesPath, icon: Scissors, isHome: false },
      { name: 'Barbeiros', path: `/${targetSlug}/barbers`, icon: Users, isHome: false },
      { name: t('booking'), path: bookingPath, icon: Plus, isHome: false },
      { name: t('appointments'), path: appointmentsPath, icon: Calendar, isHome: false }
    );
  }

  if (user?.role === 'barber') {
    navItems.push(
      { name: t('barber_dashboard'), path: '/barber-dashboard', icon: Calendar, isHome: false },
      { name: t('booking'), path: bookingPath, icon: Plus, isHome: false }
    );
  }

  if (user?.role === 'admin' || user?.role === 'owner') {
    navItems.push(
      { name: 'Gestão & Caixa', path: '/admin', icon: Wallet, isHome: false },
      { name: 'PDV / Balcão', path: '/gerente', icon: ShoppingBag, isHome: false },
      { name: t('booking'), path: bookingPath, icon: Plus, isHome: false }
    );
  }

  if (user?.role === 'gerente') {
    navItems.push(
      { name: 'PDV & Caixa', path: '/gerente', icon: ShoppingBag, isHome: false },
      { name: 'Gestão Admin', path: '/admin', icon: Wallet, isHome: false },
      { name: t('booking'), path: bookingPath, icon: Plus, isHome: false }
    );
  }

  navItems.push(
    { name: t('loyalty'), path: loyaltyPath, icon: Award, isHome: false },
    { name: t('profile'), path: user ? '/profile' : '/login', icon: UserIcon, isHome: false }
  );

  if (user?.role === 'superadmin') {
    navItems.push({ name: 'Super Admin', path: '/super-admin', icon: Shield, isHome: false });
  }

  // Check if current user has management/staff permissions
  const isStaffUser = Boolean(user && ['barber', 'admin', 'owner', 'superadmin', 'gerente'].includes(user.role));

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'barber') return '/barber-dashboard';
    if (user.role === 'gerente') return '/gerente';
    if (user.role === 'admin' || user.role === 'owner') return '/admin';
    if (user.role === 'superadmin') return '/super-admin';
    return '/profile';
  };

  // Mobile Bottom Navigation items (Canonical 5-slot layout with + Agendar as primary FAB)
  let secondMobileItem: { name: string; path: string; icon: any; isAction?: boolean; isHome?: boolean } = { name: 'Serviços', path: servicesPath, icon: Scissors };
  if (user?.role === 'barber') {
    secondMobileItem = { name: 'Agenda', path: '/barber-dashboard', icon: Calendar };
  } else if (user?.role === 'gerente') {
    secondMobileItem = { name: 'PDV / Caixa', path: '/gerente', icon: ShoppingBag };
  } else if (user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superadmin') {
    secondMobileItem = { name: 'Gestão', path: '/admin', icon: Wallet };
  } else if (user?.role === 'customer') {
    secondMobileItem = { name: 'Horários', path: appointmentsPath, icon: Calendar };
  }

  interface MobileNavItem {
    name: string;
    path: string;
    icon: any;
    isAction?: boolean;
    isStaffHighlight?: boolean;
    isHome?: boolean;
  }

  // 5th Item: For authenticated staff, replace "Entrar" with "Painel" / "Minha Gestão"
  let fifthMobileItem: MobileNavItem = { name: 'Entrar', path: '/login', icon: UserIcon };
  if (user) {
    if (user.role === 'barber') {
      fifthMobileItem = { name: 'Minha Gestão', path: '/barber-dashboard', icon: Scissors, isStaffHighlight: true };
    } else if (user.role === 'gerente') {
      fifthMobileItem = { name: 'Painel PDV', path: '/gerente', icon: ShoppingBag, isStaffHighlight: true };
    } else if (user.role === 'admin' || user.role === 'owner') {
      fifthMobileItem = { name: 'Painel', path: '/admin', icon: Shield, isStaffHighlight: true };
    } else if (user.role === 'superadmin') {
      fifthMobileItem = { name: 'Painel', path: '/super-admin', icon: Shield, isStaffHighlight: true };
    } else {
      fifthMobileItem = { name: t('profile') || 'Perfil', path: '/profile', icon: UserIcon };
    }
  }

  const mobileBottomNavItems: MobileNavItem[] = [
    { name: t('home') || 'Início', path: homePath, icon: Home, isHome: true },
    secondMobileItem,
    { name: '+ Agendar', path: bookingPath, icon: Plus, isAction: true },
    { name: t('loyalty') || 'Fidelidade', path: loyaltyPath, icon: Award },
    fifthMobileItem,
  ];

  const isSaaSPage = location.pathname === '/' || location.pathname === '/saas';
  const isDashboardRoute = ['/admin', '/gerente', '/barber-dashboard', '/profile', '/appointments'].includes(location.pathname);
  const isFullWidthPage = !isDashboardRoute;

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden ${isSaaSPage ? 'bg-[#0F0F10] text-zinc-100' : 'bg-zinc-50'}`}>
      {/* Top Banner for Authenticated Staff browsing public pages */}
      {isStaffUser && !isDashboardRoute && (
        <aside
          aria-label="Acesso Rápido ao Painel Administrativo"
          className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md text-white border-b border-amber-500/40 px-3.5 py-1.5 shadow-md flex items-center justify-between text-xs transition-all"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-stone-300 text-[11px] font-medium truncate">
              {user.role === 'barber' ? 'Painel do Barbeiro' : user.role === 'gerente' ? 'Frente de Caixa / PDV' : 'Painel de Gestão'}: <strong className="text-amber-400 font-bold">{user.name.split(' ')[0]}</strong>
            </span>
          </div>
          <Link
            to={getDashboardPath()}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a338] hover:bg-[#c4932d] text-zinc-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-transform active:scale-95 shadow-sm shrink-0"
          >
            <Shield size={13} />
            <span>Voltar ao Painel</span>
          </Link>
        </aside>
      )}

      {isFullWidthPage ? (
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Mobile Header */}
          <div className="md:hidden bg-zinc-900/90 backdrop-blur-md text-white p-4 flex justify-between items-center sticky top-0 z-40">
            <Link to={homePath} onClick={handleHomeClick} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#d4a338]/60 bg-zinc-950 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <img 
                  src={activeShop.logoUrl || "https://iili.io/n34KhGf.jpg"}
                  alt={activeShop.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight uppercase leading-none">{activeShop.name}</h1>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{activeShop.unit}</p>
              </div>
            </Link>
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
            <Link to={homePath} onClick={handleHomeClick} className="mb-6 px-4 flex items-center justify-between group hover:opacity-90 transition-opacity">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#d4a338]/60 bg-zinc-950 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <img 
                    src={activeShop.logoUrl || "https://iili.io/n34KhGf.jpg"}
                    alt={activeShop.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase leading-tight">{activeShop.name}</h1>
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">{activeShop.city} • {activeShop.unit}</p>
                </div>
              </div>
            </Link>
            
            <div className="px-4 mb-4">
              <button 
                onClick={toggleLanguage} 
                className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 px-3 py-2 rounded-xl text-xs font-medium w-full"
              >
                <Globe size={14} />
                <span>{i18n.language === 'pt' ? 'Português (PT)' : 'Español (ES)'}</span>
              </button>
            </div>

            {(location.pathname.startsWith('/admin') || location.pathname.startsWith('/gerente') || location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/barber-dashboard')) && (
              <div className="px-4 mb-3">
                <Link
                  to={homePath}
                  onClick={handleHomeClick}
                  className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl bg-zinc-850 hover:bg-[#d4a338] text-[#d4a338] hover:text-zinc-950 transition-all text-xs font-black uppercase tracking-wider border border-amber-500/30 group shadow-sm"
                  title="Voltar ao App do Cliente"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  <span>← Voltar ao App</span>
                </Link>
              </div>
            )}
            
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isHomeItem = item.isHome;
                const isHomeActive = isHomeItem && (location.pathname === homePath || location.pathname === `/${targetSlug}` || location.pathname === `/${targetSlug}/`);
                const isActive = isHomeItem ? isHomeActive : (location.pathname === item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={isHomeItem ? handleHomeClick : undefined}
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
            const isHomeItem = item.isHome;
            const isHomeActive = isHomeItem && (location.pathname === homePath || location.pathname === `/${targetSlug}` || location.pathname === `/${targetSlug}/`);
            const isActive = item.isAction ? isBookingActive : isHomeItem ? isHomeActive : (location.pathname === item.path);

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

            const isItemStaff = item.isStaffHighlight;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={isHomeItem ? handleHomeClick : undefined}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] relative ${
                  isActive ? 'text-[#d4a338]' : isItemStaff ? 'text-amber-600 hover:text-amber-700' : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                {isItemStaff && (
                  <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#d4a338]' : isItemStaff ? 'text-amber-600' : 'text-stone-400'} />
                <span className={`text-[10px] tracking-tight mt-1 ${
                  isActive ? 'font-black text-stone-900' : isItemStaff ? 'font-bold text-amber-700' : 'font-medium text-stone-500'
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
