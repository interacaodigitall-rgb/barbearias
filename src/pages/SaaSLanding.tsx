import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saasService } from '../services/saasService';
import { SaaSPlan, SaaSBarbershop } from '../models';
import { 
  Scissors, Smartphone, TrendingUp, DollarSign, Users, Sparkles, Check, 
  ArrowRight, ShieldCheck, Star, ChevronRight, Zap, CheckCircle2, 
  HelpCircle, Building2, Store, Phone, Award, VolumeX
} from 'lucide-react';

export default function SaaSLanding() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans] = useState<SaaSPlan[]>(saasService.getPlans());
  const [shops, setShops] = useState<SaaSBarbershop[]>([]);
  const [activeShop, setActiveShop] = useState<SaaSBarbershop>(saasService.getActiveBarbershop());
  
  // Registration modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPlanForSignup, setSelectedPlanForSignup] = useState<'starter' | 'pro' | 'imperio'>('pro');
  const [createdTenant, setCreatedTenant] = useState<SaaSBarbershop | null>(null);
  const [newShopForm, setNewShopForm] = useState({
    name: '',
    unit: 'Centro',
    city: 'Lisboa',
    phone: '+351 912 345 678'
  });

  React.useEffect(() => {
    async function load() {
      const allShops = await saasService.getBarbershops();
      setShops(allShops);
    }
    load();
  }, []);

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
    setActiveShop(created);
    setCreatedTenant(created);
    const allShops = await saasService.getBarbershops();
    setShops(allShops);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* SaaS Top Header Quick Navigation */}
      <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800/80 px-5 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d4a338] text-zinc-950 flex items-center justify-center font-black">
            <Scissors size={18} />
          </div>
          <span className="text-sm font-black uppercase text-white tracking-wider">BarberSaaS Multi-Tenant</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/super-admin"
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-[#d4a338]" />
            Painel Super Admin
          </Link>
          <Link
            to="/admin"
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Painel Barbearia
          </Link>
        </div>
      </div>

      {/* Success Notification if a tenant was registered */}
      {createdTenant && (
        <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-in fade-in">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
              Barbearia Ativada!
            </span>
            <h4 className="text-base font-bold mt-1">
              "{createdTenant.name}" está pronta para agendamentos!
            </h4>
            <p className="text-xs text-emerald-300 font-mono mt-0.5">
              Link exclusivo: <strong>{window.location.origin}/{createdTenant.slug}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/${createdTenant.slug}`}
              className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl shadow hover:bg-zinc-100 flex items-center gap-1.5"
            >
              <Smartphone size={14} />
              Abrir PWA da Barbearia
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
            >
              Acessar Painel Admin
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-8 md:p-14 border border-zinc-800 shadow-2xl">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#d4a338]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-[#d4a338]/40 text-[#d4a338] text-xs font-extrabold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>O Ecossistema SaaS para Barbearias de Sucesso</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Seu Próprio App de Barbearia com <span className="text-[#d4a338]">Fluxo de Caixa</span> & Comissões.
          </h1>

          <p className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-2xl">
            Entregue uma experiência premium aos seus clientes através de um App moderno no celular. Tenha controle financeiro absoluto em tempo real, rateio automático de comissões e multiplique as vendas com upsell de produtos.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedPlanForSignup('pro');
                setIsRegisterOpen(true);
              }}
              className="px-8 py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_10px_25px_rgba(212,163,56,0.35)] transition-all transform hover:-translate-y-0.5 text-center"
            >
              Criar Minha Barbearia no SaaS
            </button>

            <Link
              to="/booking"
              className="px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-sm uppercase tracking-wider rounded-2xl transition-all text-center flex items-center justify-center gap-2"
            >
              <Smartphone size={18} className="text-[#d4a338]" />
              Ver App do Cliente
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              14 dias grátis de teste
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Sem cartão de crédito inicial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Suporte via WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* Barbershop Tenant Switcher Demonstration */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Multi-Tenant SaaS</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 mt-0.5">
              Barbearias Ativas na Plataforma
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm">
              Cada barbearia parceira possui seu link exclusivo, fluxo de caixa individual e app personalizado.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 self-start md:self-auto"
          >
            <Building2 size={16} className="text-[#d4a338]" />
            + Cadastrar Nova Barbearia
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {shops.map((shop) => {
            const isActive = activeShop.id === shop.id;
            return (
              <div
                key={shop.id}
                className={`p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                  isActive 
                    ? 'border-[#d4a338] bg-amber-50/20 shadow-md ring-1 ring-[#d4a338]' 
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-zinc-950 shadow-sm"
                      style={{ backgroundColor: shop.primaryColor || '#d4a338' }}
                    >
                      <Scissors size={18} />
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                      shop.plan === 'imperio' ? 'bg-purple-100 text-purple-700' :
                      shop.plan === 'pro' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                    }`}>
                      Plano {shop.plan.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-extrabold text-base text-zinc-900">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-zinc-500">{shop.city}, {shop.country} • Unidade {shop.unit}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-mono font-bold text-[#b8860b]">
                      <span>/{shop.slug}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Mensalidade:</span>
                    <span className="font-extrabold text-zinc-900">
                      € {shop.monthlyFee.toFixed(2)}/mês
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={`/${shop.slug}`}
                      className="py-2 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[11px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                    >
                      <Smartphone size={13} className="text-[#d4a338]" />
                      Abrir PWA
                    </Link>

                    <button
                      onClick={() => {
                        saasService.setActiveBarbershop(shop.id);
                        navigate('/admin');
                      }}
                      className="py-2 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[11px] font-bold text-center transition-colors"
                    >
                      Painel Admin
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Pillars of the SaaS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Recursos Exclusivos</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-900">
            Tudo o que sua barbearia precisa para faturar mais
          </h2>
          <p className="text-zinc-500 text-sm">
            Criado especificamente para a rotina dinâmica de barbearias de alto padrão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#d4a338] flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <h3 className="font-extrabold text-base text-zinc-900">App do Cliente PWA</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Design mobile 100% otimizado. Seus clientes agendam em menos de 1 minuto sem precisar de download na Play Store ou Apple Store.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-extrabold text-base text-zinc-900">Fluxo de Caixa em Tempo Real</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Lançamento automático ao concluir cortes. Saiba seu saldo diário, despesas operacionais e ticket médio sem planilhas complicadas.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <h3 className="font-extrabold text-base text-zinc-900">Comissões Automáticas</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Defina a porcentagem de cada barbeiro (50%, 60% ou fixo). O sistema faz o rateio automático no momento em que o atendimento é finalizado.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h3 className="font-extrabold text-base text-zinc-900">Upsell & Quiet Service</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Venda ceras, óleos e tratamentos capilares diretamente no fluxo de agendamento, além da opção "Quiet Service" para corte em silêncio.
            </p>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Section */}
      <section className="bg-zinc-900 text-white rounded-3xl p-8 md:p-12 border border-zinc-800 shadow-xl space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Planos de Assinatura</span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight">
            Escolha o plano ideal para sua barbearia
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm">
            Comece com 14 dias de teste grátis. Cancele quando quiser, sem fidelidade.
          </p>

          {/* Billing Cycle Switch */}
          <div className="inline-flex items-center p-1 bg-zinc-800 rounded-2xl border border-zinc-700 mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anual <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

            return (
              <div
                key={plan.id}
                className={`p-6 md:p-8 rounded-3xl flex flex-col justify-between relative transition-transform duration-200 ${
                  isPopular 
                    ? 'bg-zinc-950 border-2 border-[#d4a338] shadow-2xl md:-translate-y-2' 
                    : 'bg-zinc-950/70 border border-zinc-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#d4a338] text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
                  <p className="text-zinc-400 text-xs mt-1 min-h-[32px]">{plan.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{price.toFixed(0)} €</span>
                      <span className="text-zinc-400 text-xs font-bold">/mês</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">Cobrado anualmente</span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-zinc-800">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <Check size={14} className="text-[#d4a338] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => {
                      setSelectedPlanForSignup(plan.id === 'plan-starter' ? 'starter' : plan.id === 'plan-enterprise' ? 'enterprise' : 'pro');
                      setIsRegisterOpen(true);
                    }}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md ${
                      isPopular 
                        ? 'bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    Começar 14 Dias Grátis
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Register Barbershop Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-amber-50 text-[#d4a338] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-200">
                <Scissors size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900">Cadastre Sua Barbearia</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Teste gratuitamente por 14 dias sem compromisso.</p>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Nome da Barbearia</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barbearia Lord & Navy"
                  value={newShopForm.name}
                  onChange={(e) => setNewShopForm({ ...newShopForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Unidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Centro / Guarda"
                    value={newShopForm.unit}
                    onChange={(e) => setNewShopForm({ ...newShopForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lisboa / Porto"
                    value={newShopForm.city}
                    onChange={(e) => setNewShopForm({ ...newShopForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  required
                  placeholder="+351 912 345 678"
                  value={newShopForm.phone}
                  onChange={(e) => setNewShopForm({ ...newShopForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Plano Selecionado</label>
                <select
                  value={selectedPlanForSignup}
                  onChange={(e) => setSelectedPlanForSignup(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-zinc-900 outline-none"
                >
                  <option value="starter">Plano Starter (29 €/mês)</option>
                  <option value="pro">Plano Pro Barber (59 €/mês) - Recomendado</option>
                  <option value="enterprise">Plano Império & Redes (99 €/mês)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                >
                  Ativar Teste Grátis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
