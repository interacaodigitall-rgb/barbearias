import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saasService } from '../services/saasService';
import { useAuthStore } from '../store/authStore';
import { SaaSPlan, SaaSBarbershop } from '../models';
import { isStandalone } from '../utils/pwaUtils';
import { 
  Scissors, Smartphone, TrendingUp, DollarSign, Users, Sparkles, Check, 
  ArrowRight, ShieldCheck, Star, ChevronRight, Zap, CheckCircle2, 
  HelpCircle, Building2, Store, Phone, Award, MessageCircle, Clock, 
  Calendar, Lock, ExternalLink, X, HeartHandshake, CheckCircle
} from 'lucide-react';

const PARTNER_BARBERSHOPS = [
  {
    name: 'Mister Navalha',
    city: 'Lisboa & Porto',
    highlight: '4 unidades ativas',
    rating: '5.0',
    initials: 'MN',
    slug: 'mister-navalha',
    quote: 'Eliminamos o papel e as mensagens manuais. O faturamento subiu 32% no primeiro trimestre.'
  },
  {
    name: 'Sherlocks Barber Club',
    city: 'Braga',
    highlight: 'Alta rotatividade',
    rating: '4.9',
    initials: 'SB',
    slug: 'sherlocks',
    quote: 'O cálculo de comissões automático economiza 4 horas do nosso domingo toda semana.'
  },
  {
    name: "Roger'X Barber Studio",
    city: 'Coimbra',
    highlight: '100% digital',
    rating: '5.0',
    initials: 'RX',
    slug: 'rogerx-barbershop',
    quote: 'Os clientes adoram o agendamento PWA sem precisar baixar nada da App Store.'
  },
  {
    name: 'Barbearia Seu Elias',
    city: 'Lisboa & BH',
    highlight: 'Padrão internacional',
    rating: '5.0',
    initials: 'SE',
    slug: 'seu-elias',
    quote: 'O Quiet Service e o upsell de pomadas aumentaram nosso ticket médio logo no primeiro mês.'
  },
  {
    name: 'Don Corleone Lounge',
    city: 'Faro / Algarve',
    highlight: 'Experiência executiva',
    rating: '4.9',
    initials: 'DC',
    slug: 'don-corleone',
    quote: 'Gestão visual impecável e controle de caixa em tempo real em todas as cadeiras.'
  },
  {
    name: 'The Royal Barber Co.',
    city: 'Cascais',
    highlight: 'Clube de assinatura',
    rating: '5.0',
    initials: 'RB',
    slug: 'royal-barber',
    quote: 'O suporte e a estabilidade da plataforma nos permitiram abrir nossa segunda filial com confiança.'
  },
];

export default function SaaSLanding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans] = useState<SaaSPlan[]>(saasService.getPlans());

  useEffect(() => {
    if (user?.role === 'customer' || isStandalone()) {
      const activeShop = saasService.getActiveBarbershop();
      const targetSlug = activeShop?.slug || 'rogerx-barbershop';
      navigate(`/${targetSlug}`, { replace: true });
    }
  }, [user, navigate]);
  
  // Registration modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPlanForSignup, setSelectedPlanForSignup] = useState<'starter' | 'pro' | 'imperio'>('pro');
  const [createdTenant, setCreatedTenant] = useState<SaaSBarbershop | null>(null);
  const [newShopForm, setNewShopForm] = useState({
    name: '',
    unit: 'Centro',
    city: 'Lisboa',
    phone: '+351 968 659 043'
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopForm.name) return;

    const created = await saasService.registerNewBarbershop({
      name: newShopForm.name,
      unit: newShopForm.unit,
      city: newShopForm.city,
      phone: newShopForm.phone,
      plan: selectedPlanForSignup
    });

    setIsRegisterOpen(false);
    setCreatedTenant(created);
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-zinc-100 font-sans selection:bg-[#d4a338] selection:text-zinc-950">
      
      {/* 1. CLEAN COMMERCIAL HEADER */}
      <header className="sticky top-0 z-50 bg-[#0F0F10]/95 backdrop-blur-md border-b border-zinc-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo ProBarbearia */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-[#d4a338]/40 flex items-center justify-center shadow-[0_2px_12px_rgba(212,163,56,0.35)] group-hover:scale-105 transition-transform">
              <img 
                src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
                alt="ProBarbearia Logo" 
                className="w-full h-full object-cover"
                
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight uppercase leading-none text-white">
                Pro<span className="text-[#d4a338]">Barbearia</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
                Multi-Tenant Cloud
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-300">
            <button 
              onClick={() => scrollToSection('recursos')}
              className="hover:text-[#d4a338] transition-colors cursor-pointer"
            >
              Recursos
            </button>
            <button 
              onClick={() => scrollToSection('funcionalidades')}
              className="hover:text-[#d4a338] transition-colors cursor-pointer"
            >
              Funcionalidades
            </button>
            <button 
              onClick={() => scrollToSection('parceiros')}
              className="hover:text-[#d4a338] transition-colors cursor-pointer"
            >
              Parceiros
            </button>
            <button 
              onClick={() => scrollToSection('precos')}
              className="hover:text-[#d4a338] transition-colors cursor-pointer"
            >
              Preços
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Login
            </Link>

            <button
              onClick={() => {
                setSelectedPlanForSignup('pro');
                setIsRegisterOpen(true);
              }}
              className="px-5 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(212,163,56,0.25)] hover:shadow-[0_6px_20px_rgba(212,163,56,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Começar 14 Dias Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Success Notification if a tenant was registered */}
      {createdTenant && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
          <div className="p-5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                Barbearia Ativada com Sucesso!
              </span>
              <h4 className="text-base font-bold mt-1">
                "{createdTenant.name}" está pronta para receber agendamentos!
              </h4>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                Seu link público exclusivo: <strong className="text-white">/{createdTenant.slug}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/${createdTenant.slug}`}
                className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl shadow hover:bg-zinc-100 flex items-center gap-1.5"
              >
                <Smartphone size={14} />
                Abrir App da Barbearia
              </Link>
              <button
                onClick={() => setCreatedTenant(null)}
                className="p-2 text-emerald-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4a338]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[350px] h-[350px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-[#d4a338]/40 text-[#d4a338] text-xs font-extrabold uppercase tracking-wider shadow-inner">
              <Sparkles size={14} />
              <span>O Software de Gestão Mais Completo para Barbearias</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Seu Próprio App de Barbearia com <span className="text-[#d4a338] underline decoration-[#d4a338]/40 underline-offset-8">Fluxo de Caixa</span> & Comissões.
            </h1>

            <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Entregue aos seus clientes uma experiência de agendamento VIP no celular sem downloads. Tenha controle financeiro absoluto em tempo real, comissões automatizadas e aumente as vendas com produtos de cuidado masculino.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <button
                onClick={() => {
                  setSelectedPlanForSignup('pro');
                  setIsRegisterOpen(true);
                }}
                className="w-full sm:w-auto px-8 py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_25px_rgba(212,163,56,0.35)] transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Criar Minha Barbearia Grátis</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="#parceiros"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('parceiros');
                }}
                className="w-full sm:w-auto px-6 py-4 bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-sm uppercase tracking-wider rounded-2xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Store size={18} className="text-[#d4a338]" />
                <span>Ver Barbearias Parceiras</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#d4a338]" />
                14 dias de teste grátis
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#d4a338]" />
                Sem fidelidade contratual
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#d4a338]" />
                Ativação em menos de 2 minutos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOVA SEÇÃO DE PROVA SOCIAL: Barbearias parceiras que confiam no nosso sistema */}
      <section id="parceiros" className="py-16 border-y border-zinc-800/80 bg-[#121214] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">
              Prova Social & Credibilidade
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Barbearias parceiras que confiam no nosso sistema
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm">
              Mais de 180 estabelecimentos pelo país usam o BarberSaaS para gerenciar mais de 45.000 atendimentos mensais.
            </p>
          </div>

          {/* Grid de Barbearias Parceiras (Logos, Nomes, Cidades e Avaliações) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PARTNER_BARBERSHOPS.map((partner, idx) => (
              <div 
                key={idx}
                className="bg-[#18181B] border border-zinc-800/90 hover:border-[#d4a338]/50 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-black text-base text-[#d4a338] shadow-inner">
                        {partner.initials}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white leading-tight">
                          {partner.name}
                        </h3>
                        <p className="text-xs text-zinc-400">{partner.city}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/10 text-[#d4a338] border border-amber-400/20 whitespace-nowrap">
                      {partner.highlight}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 italic mt-4 leading-relaxed">
                    "{partner.quote}"
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-[#d4a338] text-[#d4a338]" />
                    ))}
                    <span className="text-xs font-black text-white ml-1">{partner.rating}</span>
                  </div>

                  <Link
                    to={`/${partner.slug}`}
                    className="text-[11px] font-bold text-[#d4a338] hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Ver App PWA</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Banner Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="bg-[#18181B]/70 border border-zinc-800/70 p-5 rounded-2xl text-center">
              <span className="text-3xl font-black text-white tracking-tight">180+</span>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Barbearias Ativas</p>
            </div>
            <div className="bg-[#18181B]/70 border border-zinc-800/70 p-5 rounded-2xl text-center">
              <span className="text-3xl font-black text-[#d4a338] tracking-tight">45.000+</span>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Agendamentos / Mês</p>
            </div>
            <div className="bg-[#18181B]/70 border border-zinc-800/70 p-5 rounded-2xl text-center">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">+35%</span>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Média de Crescimento</p>
            </div>
            <div className="bg-[#18181B]/70 border border-zinc-800/70 p-5 rounded-2xl text-center">
              <span className="text-3xl font-black text-white tracking-tight">4.9 / 5</span>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Satisfação Geral</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECURSOS EXCLUSIVOS: Tudo o que sua barbearia precisa para faturar mais */}
      <section id="recursos" className="py-20 bg-[#0F0F10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">
              Arquitetura Especializada
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Tudo o que sua barbearia precisa para faturar mais
            </h2>
            <p className="text-zinc-400 text-sm">
              Criado especificamente para eliminar o caos operacional e proporcionar uma gestão moderna e lucrativa.
            </p>
          </div>

          {/* Cards com mais espaçamento, padding interno generoso e tema escuro premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#18181B] p-8 sm:p-9 rounded-3xl border border-zinc-800/90 hover:border-[#d4a338]/50 shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-[#d4a338] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smartphone size={28} />
              </div>
              <h3 className="font-extrabold text-lg text-white">App do Cliente PWA Exclusivo</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Design mobile de alta conversão. Seus clientes agendam em menos de 1 minuto diretamente pelo link da sua barbearia, sem fricção de download na Play Store ou Apple Store.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#d4a338]">
                <Check size={14} /> Link próprio: seudominio.com/barbearia
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#18181B] p-8 sm:p-9 rounded-3xl border border-zinc-800/90 hover:border-emerald-500/50 shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp size={28} />
              </div>
              <h3 className="font-extrabold text-lg text-white">Fluxo de Caixa em Tempo Real</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Lançamento automático assim que o corte é finalizado. Visualize em gráficos claros o faturamento do dia, despesas com insumos e ticket médio sem planilhas ou cadernos.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Check size={14} /> Saldo de caixa e DRE simplificado
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#18181B] p-8 sm:p-9 rounded-3xl border border-zinc-800/90 hover:border-blue-500/50 shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-400/10 border border-blue-400/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <DollarSign size={28} />
              </div>
              <h3 className="font-extrabold text-lg text-white">Rateio de Comissões Automático</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Defina comissões personalizadas por barbeiro (ex: 50%, 60% ou valor fixo). O relatório de pagamento sai pronto em segundos, acabando com atritos e disputas de fechamento.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-400">
                <Check size={14} /> Fechamento individual por profissional
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#18181B] p-8 sm:p-9 rounded-3xl border border-zinc-800/90 hover:border-purple-500/50 shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-400/10 border border-purple-400/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles size={28} />
              </div>
              <h3 className="font-extrabold text-lg text-white">Upsell & Quiet Service</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Venda pomadas, óleos e tratamentos capilares antes da confirmação do agendamento. Permita que clientes executivos escolham corte em silêncio ou serviços adicionais.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-purple-400">
                <Check size={14} /> Aumento de até 25% no ticket médio
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#18181B] p-8 sm:p-9 rounded-3xl border border-zinc-800/90 hover:border-amber-400/50 shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-[#d4a338] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award size={28} />
              </div>
              <h3 className="font-extrabold text-lg text-white">Clube de Fidelidade Integrado</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Cada agendamento gera pontos e níveis automáticos no perfil do cliente. Incentive retornos quinzenais com recompensas exclusivas que mantêm sua cadeira sempre ocupada.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#d4a338]">
                <Check size={14} /> Retenção comprovada de clientes
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#18181B] p-8 sm:p-9 rounded-3xl border border-zinc-800/90 hover:border-emerald-500/50 shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageCircle size={28} />
              </div>
              <h3 className="font-extrabold text-lg text-white">Lembretes Automáticos WhatsApp</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Reduza o não-comparecimento (no-show) em até 85%. Dispare lembretes de confirmação automáticos com link para remarcar sem sobrecarregar sua recepção.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Check size={14} /> Menos horários ociosos na agenda
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PLANOS DE ASSINATURA: Escolha o plano ideal com destaque dourado no Pro */}
      <section id="precos" className="py-20 bg-[#121214] border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">
              Transparência Total
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Escolha o plano ideal para sua barbearia
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm">
              Comece agora com 14 dias de teste grátis. Cancele quando quiser, sem taxas surpresa.
            </p>

            {/* Toggle de Ciclo de Cobrança */}
            <div className="inline-flex items-center p-1 bg-zinc-900 rounded-2xl border border-zinc-800 mt-4 shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-[#d4a338] text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly' ? 'bg-[#d4a338] text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="bg-emerald-500 text-zinc-950 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  -20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan) => {
              const isPopular = plan.popular;
              const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                    isPopular 
                      ? 'bg-[#18181B] border-2 border-[#d4a338] shadow-[0_0_40px_rgba(212,163,56,0.18)] md:-translate-y-2.5 ring-1 ring-[#d4a338]/50' 
                      : 'bg-[#18181B]/70 border border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#d4a338] text-zinc-950 text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1.5">
                      <Sparkles size={12} />
                      <span>MAIS ESCOLHIDO</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
                      {plan.badge && !isPopular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-zinc-400 text-xs mt-2 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="my-6 pt-2 pb-4 border-y border-zinc-800/80">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black text-white">€ {price.toFixed(0)}</span>
                        <span className="text-zinc-400 text-xs font-bold uppercase">/ mês</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <span className="text-[11px] text-emerald-400 font-bold block mt-1.5">
                          Cobrado anualmente com 20% de desconto
                        </span>
                      )}
                    </div>

                    {/* Simplified Feature List */}
                    <div className="space-y-3 pt-1">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs text-zinc-300">
                          <CheckCircle2 size={16} className="text-[#d4a338] shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={() => {
                        setSelectedPlanForSignup(plan.id === 'plan-starter' ? 'starter' : plan.id === 'plan-enterprise' ? 'imperio' : 'pro');
                        setIsRegisterOpen(true);
                      }}
                      className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                        isPopular 
                          ? 'bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 shadow-[0_6px_20px_rgba(212,163,56,0.3)]' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      Começar 14 Dias Grátis
                    </button>
                    <p className="text-center text-[10px] text-zinc-500 font-medium mt-2.5">
                      Sem cartão de crédito inicial
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION FINAL: Faixa de fechamento antes do rodapé */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1d22] via-[#16171a] to-[#0d0d0f] border border-[#d4a338]/30 p-8 sm:p-12 md:p-16 shadow-2xl">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4a338]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#d4a338]/10 border border-[#d4a338]/20 text-[#d4a338] text-xs font-bold uppercase tracking-wider">
              <Zap size={14} /> Comece Agora
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Pronto para transformar a gestão da sua barbearia?
            </h2>

            <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-2xl">
              Pare de perder tempo com mensagens manuais no WhatsApp, descontrole de fluxo de caixa e cadernos perdidos. Comece seu teste grátis hoje ou fale diretamente com um de nossos especialistas.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => {
                  setSelectedPlanForSignup('pro');
                  setIsRegisterOpen(true);
                }}
                className="px-8 py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_8px_25px_rgba(212,163,56,0.3)] transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Testar Gratuitamente por 14 Dias</span>
                <ArrowRight size={16} />
              </button>

              <a
                href="https://wa.me/351968659043?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20BarberSaaS%20para%20minha%20barbearia."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all text-center flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                <span>Falar com Suporte no WhatsApp</span>
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#d4a338]" /> Ativação imediata
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#d4a338]" /> Suporte humanizado
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#d4a338]" /> Migração gratuita de dados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/80 bg-[#0c0c0d] py-12 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-950 border border-[#d4a338]/40 flex items-center justify-center shrink-0">
              <img 
                src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
                alt="ProBarbearia Logo" 
                className="w-full h-full object-cover"
                
              />
            </div>
            <div>
              <span className="text-sm font-black uppercase text-white tracking-wider">
                Pro<span className="text-[#d4a338]">Barbearia</span>
              </span>
              <p className="text-[10px] text-zinc-500">© 2026 ProBarbearia Cloud Technologies. Todos os direitos reservados.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link to="/login" className="hover:text-white transition-colors">Área do Cliente / Barbeiro</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Painel Administrativo</Link>
            <Link to="/super-admin" className="hover:text-white transition-colors">Super Admin</Link>
            <a href="https://wa.me/351968659043" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4a338] transition-colors">Suporte WhatsApp (+351 968 659 043)</a>
          </div>
        </div>
      </footer>

      {/* MODAL DE CADASTRO DARK THEME PREMIUM */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-700/80 animate-in zoom-in-95 duration-200 text-white relative">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-950 border border-amber-400/30 flex items-center justify-center mx-auto mb-2.5 shadow-md">
                <img 
                  src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
                  alt="ProBarbearia Logo" 
                  className="w-full h-full object-cover"
                  
                />
              </div>
              <h3 className="text-xl font-extrabold text-white">Cadastre Sua Barbearia no ProBarbearia</h3>
              <p className="text-xs text-zinc-400 mt-1">14 dias de teste grátis. Configure em menos de 2 minutos.</p>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nome da Barbearia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barbearia Lord & Navy"
                  value={newShopForm.name}
                  onChange={(e) => setNewShopForm({ ...newShopForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0F0F10] border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:border-[#d4a338] focus:ring-1 focus:ring-[#d4a338] outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Centro"
                    value={newShopForm.unit}
                    onChange={(e) => setNewShopForm({ ...newShopForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0F0F10] border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:border-[#d4a338] focus:ring-1 focus:ring-[#d4a338] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lisboa"
                    value={newShopForm.city}
                    onChange={(e) => setNewShopForm({ ...newShopForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0F0F10] border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:border-[#d4a338] focus:ring-1 focus:ring-[#d4a338] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  placeholder="+351 968 659 043"
                  value={newShopForm.phone}
                  onChange={(e) => setNewShopForm({ ...newShopForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0F0F10] border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:border-[#d4a338] focus:ring-1 focus:ring-[#d4a338] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Plano Selecionado
                </label>
                <select
                  value={selectedPlanForSignup}
                  onChange={(e) => setSelectedPlanForSignup(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#0F0F10] border border-zinc-700 rounded-xl text-sm text-white focus:border-[#d4a338] focus:ring-1 focus:ring-[#d4a338] outline-none transition-colors"
                >
                  <option value="starter">Starter (€ 29 / mês) - Até 2 barbeiros</option>
                  <option value="pro">Pro Barber SaaS (€ 59 / mês) - Mais Escolhido</option>
                  <option value="imperio">Império & Franquias (€ 119 / mês)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  Ativar Meu Teste Grátis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
