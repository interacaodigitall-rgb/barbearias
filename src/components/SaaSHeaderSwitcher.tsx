import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { saasService } from '../services/saasService';
import { SaaSBarbershop } from '../models';
import { Smartphone, LayoutDashboard, Globe, ChevronDown, Check, Building2, Sparkles } from 'lucide-react';

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
  };

  const isClientView = location.pathname === '/booking' || location.pathname === '/appointments' || location.pathname === '/';
  const isAdminView = location.pathname === '/admin' || location.pathname === '/barber-dashboard';
  const isSaaSView = location.pathname === '/saas';

  return (
    <div className="bg-zinc-950 text-white border-b border-zinc-800 text-xs px-3 sm:px-6 py-2">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Barbershop active selector */}
        <div className="relative flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-extrabold text-[#d4a338] tracking-wider uppercase text-[11px]">
            <Sparkles size={13} />
            <span>SaaS Barbearia:</span>
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
              <div className="absolute left-0 mt-1.5 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Trocar Unidade / Barbearia
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
                      <div className="font-bold">{shop.name}</div>
                      <div className="text-[10px] text-zinc-400">{shop.city} • Unidade {shop.unit}</div>
                    </div>
                    {activeShop.id === shop.id && <Check size={14} className="text-[#d4a338]" />}
                  </button>
                ))}

                <div className="pt-1 border-t border-zinc-800">
                  <Link
                    to="/saas"
                    onClick={() => setIsOpen(false)}
                    className="block p-2 text-center text-[11px] font-bold text-[#d4a338] hover:bg-zinc-800 rounded-lg"
                  >
                    + Criar Nova Barbearia no SaaS
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <Link
            to="/booking"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isClientView 
                ? 'bg-[#d4a338] text-zinc-950 shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone size={13} />
            <span>App do Cliente</span>
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
            <span>Fluxo de Caixa & Gestão</span>
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
            <span>Venda SaaS / Planos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
