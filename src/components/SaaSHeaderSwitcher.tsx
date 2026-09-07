import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { saasService } from '../services/saasService';
import { SaaSBarbershop } from '../models';
import { Smartphone, LayoutDashboard, Globe, ChevronDown, Check, Building2, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';

export default function SaaSHeaderSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const [shops, setShops] = useState<SaaSBarbershop[]>([]);
  const [activeShop, setActiveShop] = useState<SaaSBarbershop>(saasService.getActiveBarbershop());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await saasService.getBarbershops();
      setShops(all);
    }
    load();
  }, []);

  const handleSelectShop = (shop: SaaSBarbershop) => {
    saasService.setActiveBarbershop(shop.id);
    setActiveShop(shop);
    setIsOpen(false);
    // If currently on a tenant-specific route, navigate to the new slug
    if (location.pathname.startsWith('/') && !['/saas', '/super-admin', '/admin', '/login', '/register'].includes(location.pathname)) {
      navigate(`/${shop.slug}`);
    }
  };

  const isClientView = location.pathname === `/${activeShop.slug}` || location.pathname === '/booking';
  const isAdminView = location.pathname === '/admin' || location.pathname === '/barber-dashboard';
  const isSaaSView = location.pathname === '/' || location.pathname === '/saas';
  const isSuperAdminView = location.pathname === '/super-admin';

  return (
    <div className="bg-zinc-950 text-white border-b border-zinc-800 text-xs px-3 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Barbershop active selector */}
        <div className="relative flex items-center gap-2">
          <Link to="/saas" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity mr-1">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-zinc-900 border border-[#d4a338]/40 shrink-0">
              <img 
                src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
                alt="ProBarbearia" 
                className="w-full h-full object-cover"
                
              />
            </div>
            <span className="font-black text-white text-[11px] uppercase tracking-tight hidden sm:inline">
              Pro<span className="text-[#d4a338]">Barbearia</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 font-extrabold text-[#d4a338] tracking-wider uppercase text-[11px]">
            <Sparkles size={13} />
            <span>Unidade Ativa:</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 transition-colors text-zinc-200 font-bold"
            >
              <Building2 size={13} className="text-[#d4a338]" />
              <span className="truncate max-w-[140px] sm:max-w-none">{activeShop.name} - {activeShop.unit}</span>
              <ChevronDown size={12} className="text-zinc-400" />
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Selecionar Barbearia (Multi-Tenant)
                </div>
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      activeShop.id === shop.id 
                        ? 'bg-[#d4a338]/20 text-[#d4a338] font-bold' 
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {shop.name}
                        <span className="text-[9px] font-mono text-[#d4a338]">/{shop.slug}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">{shop.city} • Unidade {shop.unit}</div>
                    </div>
                    {activeShop.id === shop.id && <Check size={14} className="text-[#d4a338]" />}
                  </button>
                ))}

                <div className="pt-1 border-t border-zinc-800 flex items-center justify-between px-1">
                  <Link
                    to="/super-admin"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-1"
                  >
                    <ShieldCheck size={13} className="text-[#d4a338]" />
                    Super Admin
                  </Link>
                  <Link
                    to="/saas"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-[11px] font-bold text-[#d4a338] hover:bg-zinc-800 rounded-lg"
                  >
                    + Nova Barbearia
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to={`/${activeShop.slug}`}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-mono font-bold text-zinc-300 hover:text-white transition-colors"
            title="Abrir página PWA pública do cliente"
          >
            <span>/{activeShop.slug}</span>
            <ExternalLink size={10} className="text-[#d4a338]" />
          </Link>
        </div>

        {/* Right: Quick View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <Link
            to={`/${activeShop.slug}`}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isClientView 
                ? 'bg-[#d4a338] text-zinc-950 shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone size={13} />
            <span>PWA Cliente (/:slug)</span>
          </Link>

          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isAdminView 
                ? 'bg-[#d4a338] text-zinc-950 shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={13} />
            <span>Painel Barbearia</span>
          </Link>

          <Link
            to="/super-admin"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isSuperAdminView 
                ? 'bg-[#d4a338] text-zinc-950 shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={13} />
            <span>Super Admin</span>
          </Link>

          <Link
            to="/saas"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isSaaSView 
                ? 'bg-[#d4a338] text-zinc-950 shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe size={13} />
            <span>Página de Vendas (/)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
