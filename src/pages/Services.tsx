import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { firestoreService } from '../services/firestoreService';
import { saasService } from '../services/saasService';
import { Service, SaaSBarbershop } from '../models';
import { 
  Scissors, Clock, Sparkles, Search, ChevronRight, CheckCircle2, 
  Award, Shield, Phone, MessageCircle, Star, ArrowRight, X, Heart
} from 'lucide-react';

export default function Services() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  
  const [activeShop, setActiveShop] = useState<SaaSBarbershop>(saasService.getActiveBarbershop());
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function loadShopAndServices() {
      try {
        setLoading(true);
        let shop = saasService.getActiveBarbershop();
        
        if (slug) {
          const found = await saasService.getBarbershopBySlug(slug);
          if (found) {
            shop = found;
            setActiveShop(found);
            saasService.setActiveBarbershop(found.id);
          }
        }
        
        const data = await firestoreService.getServices(shop.slug);
        setServices(data.filter(s => s.isActive !== false));
      } catch (err) {
        console.error('Erro ao carregar serviços da barbearia:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShopAndServices();
  }, [slug]);

  const isBrazil = activeShop?.country?.toLowerCase().includes('brasil') || activeShop?.country?.toLowerCase().includes('br');
  const currencySymbol = isBrazil ? 'R$' : '€';

  // Helper de categorização inteligente
  const getServiceCategory = (service: Service): 'cabelo' | 'barba' | 'combos' | 'outros' => {
    const text = `${service.name} ${service.description || ''}`.toLowerCase();
    if (text.includes('combo') || text.includes('completo') || text.includes('vip') || text.includes('pacote')) return 'combos';
    if (text.includes('barba') || text.includes('bigode') || text.includes('toalha') || text.includes('navalha')) return 'barba';
    if (text.includes('corte') || text.includes('cabelo') || text.includes('fade') || text.includes('degradê') || text.includes('tesoura')) return 'cabelo';
    return 'outros';
  };

  const categories = [
    { id: 'all', label: 'Todos os Serviços' },
    { id: 'cabelo', label: 'Cabelo & Corte' },
    { id: 'barba', label: 'Barba & Toalha' },
    { id: 'combos', label: 'Combos & VIP' },
  ];

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'all' || getServiceCategory(service) === selectedCategory;
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  const bookingBasePath = slug ? `/${slug}/booking` : `/${activeShop.slug}/booking`;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#d4a338] flex items-center justify-center animate-spin">
          <Scissors size={24} />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Carregando catálogo de serviços...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-36 sm:pb-16 space-y-6">
      
      {/* 1. BRANDING HEADER PERSONALIZADO (MOBILE FIRST) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 p-5 sm:p-7 text-white shadow-xl overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-[#d4a338]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-amber-500/40 p-1 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
              {activeShop.logoUrl ? (
                <img 
                  src={activeShop.logoUrl} 
                  alt={activeShop.name} 
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Scissors size={32} className="text-[#d4a338]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#d4a338] text-zinc-950">
                  Barbearia Oficial
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                  <Star size={13} className="fill-amber-400" /> 4.9
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                {activeShop.name}
              </h1>
              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                {activeShop.tagline || 'Cortes clássicos, navalha afiada e toalha quente'} • {activeShop.city || 'Lisboa'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-300">
                <span className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg">
                  <Clock size={12} className="text-[#d4a338]" />
                  <span>Seg a Sáb: 09:00 - 20:30 (Fechamento 20h30)</span>
                </span>
                <span className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg">
                  <Phone size={12} className="text-[#d4a338]" />
                  <span>{activeShop.phone || '+351 968 659 043'}</span>
                </span>
              </div>
            </div>
          </div>

          <Link
            to={bookingBasePath}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#d4a338] via-[#f5ab2b] to-[#e89e22] hover:from-[#c5932a] hover:to-[#d4a338] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Scissors size={16} />
            <span>Agendar Horário</span>
          </Link>
        </div>
      </div>

      {/* 2. BARRA DE BUSCA E FILTROS INTERATIVOS */}
      <div className="space-y-3">
        {/* Input de Busca */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar serviço (ex: barba, degrade, combo...)"
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-stone-200/90 rounded-2xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#d4a338] shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categorias em Pílulas com Scroll Horizontal Suave no Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-md font-extrabold'
                    : 'bg-white border border-stone-200/80 text-zinc-600 hover:bg-stone-50'
                }`}
              >
                <span>{cat.label}</span>
                {cat.id === 'all' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-[#d4a338] text-zinc-950 font-black' : 'bg-stone-100 text-zinc-500'}`}>
                    {services.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LISTAGEM DE SERVIÇOS PROFISSIONAL E PERSONALIZADA */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-stone-200/80 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-[#d4a338] rounded-2xl mx-auto flex items-center justify-center">
            <Search size={22} />
          </div>
          <h3 className="text-base font-extrabold text-zinc-900">Nenhum serviço encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Não encontramos serviços correspondentes a sua pesquisa. Tente outras palavras ou limpe o filtro.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors"
          >
            Limpar Busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service, idx) => {
            const isHighlight = idx === 0 || service.name.toLowerCase().includes('combo') || service.name.toLowerCase().includes('completo');

            return (
              <div
                key={service.id}
                className={`relative bg-white rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between hover:shadow-lg group ${
                  isHighlight 
                    ? 'border-amber-400/70 shadow-md ring-1 ring-amber-400/30' 
                    : 'border-stone-200/90 shadow-xs hover:border-amber-300'
                }`}
              >
                {/* Badge de Destaque / Mais Escolhido */}
                {isHighlight && (
                  <div className="absolute -top-3 left-5">
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles size={11} className="fill-zinc-950" />
                      Mais Escolhido
                    </span>
                  </div>
                )}

                <div>
                  {/* Topo do Card: Nome e Preço */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-zinc-900 tracking-tight group-hover:text-[#d4a338] transition-colors">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
                        <span className="flex items-center gap-1 text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                          <Clock size={12} className="text-[#d4a338]" />
                          {service.durationMinutes} min
                        </span>
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                          +10 Pts Clube
                        </span>
                      </div>
                    </div>

                    {/* Preço em Destaque */}
                    <div className="text-right shrink-0">
                      <span className="text-xl sm:text-2xl font-black text-zinc-950">
                        {currencySymbol} {service.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Descrição do Serviço */}
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed line-clamp-3 mt-3 mb-5">
                    {service.description || 'Atendimento de alta precisão com acabamento impecável realizado por profissionais experientes.'}
                  </p>
                </div>

                {/* Ação: Botão Agendar Este Serviço */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-bold">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Cancelamento flexível</span>
                  </div>

                  <button
                    onClick={() => navigate(`${bookingBasePath}?serviceId=${service.id}`)}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-[#d4a338] text-white hover:text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group-hover:bg-[#d4a338] group-hover:text-zinc-950"
                  >
                    <span>Agendar</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. BANNER DE APOIO AO CLIENTE (WHATSAPP / DÚVIDAS) */}
      <div className="bg-stone-100/90 rounded-3xl p-5 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 text-[#d4a338] flex items-center justify-center shrink-0 shadow-xs">
            <MessageCircle size={24} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-zinc-900">Tem alguma dúvida ou pedido especial?</h4>
            <p className="text-xs text-zinc-500">
              Entre em contato direto com a equipe da {activeShop.name} • Fechamento às 20h30.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <a
            href={`https://wa.me/${(activeShop.phone || '+351 968 659 043').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Olá! Gostaria de tirar dúvidas sobre os serviços da ' + activeShop.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>

          <a
            href={`tel:${(activeShop.phone || '+351 968 659 043').replace(/\s+/g, '')}`}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-zinc-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Phone size={14} className="text-[#d4a338]" />
            <span>Ligar ({activeShop.phone || '+351 968 659 043'})</span>
          </a>
        </div>
      </div>

      {/* Spacer final para garantir folga com a Bottom Bar no mobile */}
      <div className="h-8 md:hidden" aria-hidden="true" />
    </div>
  );
}
