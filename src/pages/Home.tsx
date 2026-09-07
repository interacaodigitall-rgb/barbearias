import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { saasService } from '../services/saasService';
import { appointmentService } from '../services/appointmentService';
import { loyaltyService } from '../services/loyaltyService';
import { firestoreService } from '../services/firestoreService';
import { Appointment, Service, Barber, SaaSBarbershop } from '../models';
import { barberImages } from '../assets/images/barberImages';
import { 
  Scissors, 
  Menu, 
  X, 
  ChevronUp, 
  Calendar, 
  Award, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  User as UserIcon,
  Sparkles,
  ExternalLink,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  const [activeShop, setActiveShop] = useState<SaaSBarbershop>(saasService.getActiveBarbershop());
  const [shopNotFound, setShopNotFound] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [points, setPoints] = useState<number>(120);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);

  useEffect(() => {
    async function resolveShop() {
      if (slug) {
        const found = await saasService.getBarbershopBySlug(slug);
        if (found) {
          setActiveShop(found);
          saasService.setActiveBarbershop(found.id);
          setShopNotFound(false);
        } else {
          setShopNotFound(true);
        }
      } else {
        const def = saasService.getActiveBarbershop();
        setActiveShop(def);
        setShopNotFound(false);
      }
    }
    resolveShop();
  }, [slug]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sList, bList] = await Promise.all([
          firestoreService.getServices(activeShop.slug),
          firestoreService.getBarbers(activeShop.slug)
        ]);
        setServices(sList);
        setBarbers(bList);

        if (user) {
          const [appts, pts] = await Promise.all([
            appointmentService.getCustomerAppointments(user.uid),
            loyaltyService.getPoints(user.uid)
          ]);
          setAppointments(appts.filter(a => a.status === 'pending' || a.status === 'confirmed'));
          setPoints(pts);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeShop.slug, user]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (shopNotFound) {
    return (
      <div className="min-h-screen bg-[#121417] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-[#d4a338] flex items-center justify-center mb-4">
          <Scissors size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Barbearia Não Encontrada</h2>
        <p className="text-zinc-400 text-sm max-w-md mt-2">
          Não encontramos nenhuma barbearia ativa com o endereço <code className="text-[#d4a338] bg-zinc-900 px-2 py-0.5 rounded font-mono">/{slug}</code>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Link to="/saas" className="px-5 py-2.5 bg-[#d4a338] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl">
            Conhecer o SaaS
          </Link>
          <Link to="/mister-navalha" className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl">
            Ver Mister Navalha
          </Link>
          <Link to="/seu-elias" className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl">
            Ver Barbearia Seu Elias
          </Link>
          <Link to="/sherlocks" className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl">
            Ver Sherlocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#eae5db] text-zinc-900 font-sans selection:bg-[#f5ab2b] selection:text-zinc-950">
      {/* ========================================================================= */}
      {/* 1. VINTAGE HEADER (Matching pc01.png)                                    */}
      {/* ========================================================================= */}
      <header className="w-full bg-[#eae5db] border-b border-stone-300/60 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between">
          
          {/* Circular Retro Vintage Badge Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-stone-800 flex flex-col items-center justify-center p-1 bg-[#f4f0e8] shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-stone-600">Desde 2013</span>
              <span className="font-serif italic font-extrabold text-sm md:text-base leading-none text-stone-900 tracking-tight text-center">
                {activeShop.name.toLowerCase().includes('elias') ? 'Seu Elias' : activeShop.name}
              </span>
              <span className="text-[6px] md:text-[7px] font-bold uppercase tracking-wider text-[#d4a338] mt-0.5">Barba • Cabelo</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-stone-900 leading-none">
                {activeShop.name}
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mt-1">
                {activeShop.city} • {activeShop.unit}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-stone-700">
            <button onClick={() => scrollToTop()} className="hover:text-stone-950 hover:underline underline-offset-8 transition-colors">
              Início
            </button>
            <button onClick={() => scrollToSection('app-section')} className="hover:text-stone-950 hover:underline underline-offset-8 transition-colors">
              O App
            </button>
            <button onClick={() => scrollToSection('story-section')} className="hover:text-stone-950 hover:underline underline-offset-8 transition-colors">
              História
            </button>
            <button onClick={() => scrollToSection('services-section')} className="hover:text-stone-950 hover:underline underline-offset-8 transition-colors">
              Serviços
            </button>
            <Link to="/loyalty" className="hover:text-stone-950 hover:underline underline-offset-8 transition-colors flex items-center gap-1">
              <Award size={14} className="text-[#d4a338]" />
              Cashback
            </Link>
            <Link to="/saas" className="text-[#9e741c] hover:text-stone-950 transition-colors">
              SaaS Barbearias
            </Link>
          </nav>

          {/* Right Action & Hamburger Menu Icon */}
          <div className="flex items-center gap-3">
            <Link 
              to={slug ? `/${slug}/booking` : `/${activeShop.slug}/booking`} 
              className="hidden sm:inline-flex items-center gap-2 bg-[#252321] hover:bg-[#1a1817] text-[#f5ab2b] font-black px-5 py-2.5 text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
            >
              <Scissors size={14} />
              Agendar Horário
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 text-stone-900 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
              aria-label="Abrir Menu"
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-sm bg-[#23211f] text-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#f5ab2b] flex items-center justify-center text-[#f5ab2b]">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-white">{activeShop.name}</h3>
                    <p className="text-[10px] text-stone-400">{activeShop.city} • {activeShop.unit}</p>
                  </div>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-2 text-stone-400 hover:text-white">
                  <X size={22} />
                </button>
              </div>

              {/* User Status */}
              {user ? (
                <div className="my-6 p-4 rounded-xl bg-stone-900 border border-stone-800">
                  <p className="text-xs text-stone-400 font-medium">Conectado como</p>
                  <p className="text-sm font-bold text-white mt-0.5">{user.name}</p>
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-[#f5ab2b] font-bold">
                    <span>Cashback Acumulado:</span>
                    <span>{points} pts (€ {(points * 0.1).toFixed(2)})</span>
                  </div>
                </div>
              ) : (
                <div className="my-6 p-4 rounded-xl bg-stone-900 border border-stone-800 text-center">
                  <p className="text-xs text-stone-300 mb-3">Acesse sua conta para agendar mais rápido e ganhar cashback.</p>
                  <Link 
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-block w-full py-2 bg-[#f5ab2b] text-stone-950 font-bold text-xs uppercase tracking-wider rounded-lg"
                  >
                    Entrar ou Cadastrar
                  </Link>
                </div>
              )}

              {/* Links */}
              <div className="space-y-2 text-sm font-bold tracking-wider uppercase">
                <Link to={slug ? `/${slug}/booking` : `/${activeShop.slug}/booking`} onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-[#f5ab2b]">
                  ✂️ Novo Agendamento
                </Link>
                <Link to="/appointments" onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-stone-300 hover:text-white">
                  📅 Meus Agendamentos
                </Link>
                <Link to="/services" onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-stone-300 hover:text-white">
                  💈 Tabela de Serviços
                </Link>
                <Link to="/barbers" onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-stone-300 hover:text-white">
                  👤 Nossos Barbeiros
                </Link>
                <Link to="/loyalty" onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-stone-300 hover:text-white">
                  ⭐ Programa Seu Estilo (Cashback)
                </Link>
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-stone-300 hover:text-white">
                  💼 Gestão & Fluxo de Caixa
                </Link>
                <Link to="/saas" onClick={() => setMenuOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-stone-800/80 text-[#f5ab2b]/90 hover:text-[#f5ab2b]">
                  🚀 Portal SaaS (Planos Barbearia)
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-800 text-[11px] text-stone-500 text-center">
              <p>{activeShop.name} • Gestão Inteligente</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH SEU ESTILO CASHBACK (Matching pc01.png)              */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#181615] overflow-hidden">
        {/* Top subtle fade connecting with cream header */}
        <div className="grid grid-cols-1 md:grid-cols-3 min-h-[520px] lg:min-h-[580px] items-stretch">
          
          {/* Left Column: Model Pompadour with Watermark (pc01.png) */}
          <div className="relative group overflow-hidden bg-[#1f1d1b] flex items-end justify-center">
            {/* Outline Typographic Watermark behind model */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
              <span className="text-[120px] lg:text-[160px] font-black uppercase tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.08)] opacity-60">
                SEU
              </span>
            </div>
            
            <img 
              src={barberImages.modelSide} 
              alt="Estilo Pompadour Barbearia" 
              referrerPolicy="no-referrer"
              className="relative z-10 w-full h-[380px] md:h-full object-cover object-top opacity-90 contrast-110 group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 pointer-events-none" />
          </div>

          {/* Center Column: SEU ESTILO Charcoal Box (pc01.png) */}
          <div className="bg-[#24211e] p-8 md:p-12 lg:p-14 flex flex-col justify-center text-center items-center z-20 shadow-2xl border-x border-stone-800/80">
            {/* Framed Logo Badge */}
            <div className="border border-[#f5ab2b]/80 px-5 py-1.5 tracking-[0.35em] text-xs font-black text-[#f5ab2b] uppercase mb-8">
              SEU ESTILO
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-6 max-w-sm">
              Receba cashback em cada real gasto em nossas barbearias.
            </h2>

            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-xs mb-8">
              Em breve descontos em academias, restaurantes, e várias empresas parceiras.
            </p>

            {/* Interactive Points / Loyalty CTA */}
            {user ? (
              <div className="w-full max-w-xs bg-stone-900/90 border border-stone-700/80 p-4 rounded-xl text-left mb-4">
                <div className="flex justify-between items-center text-xs text-stone-300 mb-1">
                  <span>Seu saldo atual:</span>
                  <span className="text-[#f5ab2b] font-black text-sm">{points} Pts</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#f5ab2b] h-full" style={{ width: `${Math.min(100, (points / 200) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-stone-400 mt-2">Equivalente a <strong className="text-white">€ {(points * 0.1).toFixed(2)}</strong> em descontos em serviços ou produtos.</p>
              </div>
            ) : null}

            <Link
              to={slug ? `/${slug}/booking` : `/${activeShop.slug}/booking`}
              className="inline-block px-8 py-3.5 bg-[#f5ab2b] hover:bg-[#e09820] text-zinc-950 font-black text-xs uppercase tracking-widest transition-transform hover:scale-105 shadow-xl"
            >
              Agendar & Acumular
            </Link>
          </div>

          {/* Right Column: Model Afro Fade with Watermark (pc01.png) */}
          <div className="relative group overflow-hidden bg-[#1f1d1b] flex items-end justify-center">
            {/* Outline Typographic Watermark behind model */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
              <span className="text-[120px] lg:text-[160px] font-black uppercase tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.08)] opacity-60">
                ELIAS
              </span>
            </div>

            <img 
              src={barberImages.modelAfro} 
              alt="Estilo Afro Fade Barbearia" 
              referrerPolicy="no-referrer"
              className="relative z-10 w-full h-[380px] md:h-full object-cover object-top opacity-90 contrast-110 group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 pointer-events-none" />
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. APP SHOWCASE BANNER & PHONE MOCKUPS (Matching pc02.png)                */}
      {/* ========================================================================= */}
      <section id="app-section" className="w-full bg-[#f5ab2b] py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content (Text + Store Badges) */}
            <div className="lg:col-span-6 text-zinc-950 z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[1.05]">
                AGENDE ATRAVÉS <br />
                <span className="text-zinc-950">DO APP {activeShop.name.toUpperCase()}</span>
              </h2>

              <p className="text-zinc-900/90 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-xl">
                Avalie o seu atendimento, consulte seus horários de agendamento e muito mais! Baixe agora, gratuitamente, o App {activeShop.name} e tenha acesso prático e rápido aos nossos horários. Acredite, o agendamento é mais rápido pelo nosso aplicativo!
              </p>

              {/* Badges & Instant Web App Link */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {/* Google Play Pill Badge */}
                <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-md hover:bg-zinc-900 cursor-pointer transition-colors">
                  <div className="w-6 h-6 flex items-center justify-center text-[#48ff82] text-xs font-black">
                    ▶
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold leading-none">DISPONÍVEL NO</p>
                    <p className="text-sm font-bold tracking-tight leading-tight">Google Play</p>
                  </div>
                </div>

                {/* App Store Pill Badge */}
                <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-md hover:bg-zinc-900 cursor-pointer transition-colors">
                  <div className="w-6 h-6 flex items-center justify-center text-white text-base">
                    
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold leading-none">Baixar na</p>
                    <p className="text-sm font-bold tracking-tight leading-tight">Mac App Store</p>
                  </div>
                </div>

                {/* Direct Web Agendamento */}
                <Link
                  to="/booking"
                  className="bg-white text-zinc-950 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
                >
                  <Smartphone size={16} />
                  Agendar Online Agora
                </Link>
              </div>
            </div>

            {/* Right Content: Dual Tilted Realistic iPhone Mockups (pc02.png) */}
            <div className="lg:col-span-6 flex justify-center items-center relative py-6">
              <div className="relative flex items-center justify-center w-full max-w-lg">
                
                {/* Phone 1: Welcome Screen (Front Left) */}
                <div className="w-56 sm:w-64 bg-zinc-900 p-2.5 rounded-[40px] shadow-2xl border-4 border-zinc-800 -rotate-6 transform hover:rotate-0 transition-transform duration-500 z-20">
                  {/* Dynamic Island / Notch */}
                  <div className="w-20 h-4 bg-zinc-950 mx-auto rounded-full mb-2" />
                  
                  {/* Screen Content */}
                  <div className="bg-[#2b2724] rounded-[30px] overflow-hidden p-3 text-white flex flex-col justify-between h-[360px] sm:h-[400px]">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 px-1">
                      <span>9:41 AM</span>
                      <span className="font-bold text-[#f5ab2b]">{activeShop.name}</span>
                    </div>

                    {/* Barber Portrait */}
                    <div className="my-auto text-center space-y-2">
                      <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-[#f5ab2b]/60 shadow-lg">
                        <img 
                          src="/adriano.webp" 
                          alt="Barbeiro" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      <div className="w-7 h-7 mx-auto bg-[#f5ab2b] text-zinc-950 rounded-full flex items-center justify-center font-black text-xs">
                        ✂️
                      </div>

                      <p className="text-xs font-bold text-stone-200 max-w-[190px] mx-auto leading-tight">
                        Crie seu login e senha se cadastrando no aplicativo. Isso leva poucos minutos.
                      </p>

                      <div className="flex justify-center gap-1.5 pt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5ab2b]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      </div>
                    </div>

                    <div className="text-center text-[9px] text-stone-400 uppercase tracking-wider">
                      Pular Tutorial
                    </div>
                  </div>
                </div>

                {/* Phone 2: Profile Screen (Back Right) */}
                <div className="w-56 sm:w-64 bg-zinc-900 p-2.5 rounded-[40px] shadow-2xl border-4 border-zinc-800 rotate-6 transform hover:rotate-0 transition-transform duration-500 z-10 -ml-16 sm:-ml-20">
                  {/* Dynamic Island / Notch */}
                  <div className="w-20 h-4 bg-zinc-950 mx-auto rounded-full mb-2" />

                  {/* Screen Content */}
                  <div className="bg-[#1f1d1b] rounded-[30px] overflow-hidden p-3 text-white flex flex-col justify-between h-[360px] sm:h-[400px]">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 border-b border-zinc-800 pb-2">
                      <Menu size={12} />
                      <span className="font-black uppercase tracking-wider text-xs text-white">MEU PERFIL</span>
                      <div className="w-3" />
                    </div>

                    <div className="my-auto text-center space-y-2">
                      <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#f5ab2b]">
                        <img 
                          src="/almir.webp" 
                          alt="Cliente" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <h4 className="text-xs font-bold text-white">João Souza da Silva</h4>
                      
                      <button className="px-3 py-1 bg-[#f5ab2b] text-zinc-950 font-bold rounded-md text-[9px] uppercase tracking-wider shadow-sm">
                        EDITAR PERFIL
                      </button>

                      <div className="bg-zinc-900/80 p-2 rounded-xl text-left text-[9px] text-stone-400 space-y-1.5 border border-zinc-800 mt-2">
                        <div className="flex items-center gap-1 text-stone-300">
                          <Phone size={10} className="text-[#f5ab2b]" />
                          <span>+351 912 345 678</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-300">
                          <MapPin size={10} className="text-[#f5ab2b]" />
                          <span className="truncate">{activeShop.city} • {activeShop.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[9px] text-stone-500">
                      ID: #7829-01
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BRAND STORY SECTION (Matching pc03.png)                                */}
      {/* ========================================================================= */}
      <section id="story-section" className="w-full bg-[#eae5db] py-20 md:py-28 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative flex flex-col md:flex-row items-stretch">
            
            {/* Left Mustard Gold Block with Stacked Typography (pc03.png) */}
            <div className="w-full md:w-5/12 bg-[#f5ab2b] p-8 sm:p-12 lg:p-16 flex flex-col justify-center shadow-lg z-10">
              <div className="space-y-0 leading-none">
                <p className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white">
                  BAR
                </p>
                <p className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white">
                  BE
                </p>
                <p className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white">
                  ARIA
                </p>
                <p className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-zinc-950 mt-2">
                  {activeShop.name.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Right White Card Overlay (pc03.png) */}
            <div className="w-full md:w-7/12 bg-white p-8 sm:p-12 lg:p-14 shadow-2xl z-20 md:-ml-8 mt-6 md:mt-10 border border-stone-200/60 flex flex-col justify-between">
              <div>
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                  Barbeiro desde os 13 anos por influência familiar, {activeShop.name} sempre gostou de mudanças e de desafios. Há pouco mais de cinco anos, insatisfeito com a mesmice, foi buscar referências no exterior e resolveu trazer um conceito até então inovador. Pioneiro no estilo sofisticado de barbearias, atualmente comanda unidades de referência:
                </p>

                <blockquote className="border-l-2 border-[#f5ab2b] pl-4 text-stone-900 italic text-sm sm:text-base font-serif mb-6">
                  “Antigamente cortar cabelo era algo corriqueiro e desinteressante para o homem, então, minha ideia é proporcionar uma verdadeira experiência ao meu cliente. Ele não vem só para fazer a barba, cabelo e bigode, mas vem como um programa mesmo, uma distração, para ter um momento só dele, ou dele com o filho, por exemplo.”
                </blockquote>
              </div>

              <div>
                <button
                  onClick={() => setStoryModalOpen(true)}
                  className="px-8 py-4 bg-[#332f2c] hover:bg-[#201e1d] text-[#f5ab2b] font-black text-xs uppercase tracking-widest transition-colors shadow-md inline-flex items-center gap-2"
                >
                  HISTÓRIA DO {activeShop.name.toUpperCase()}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Floating Back to Top Button (pc03.png bottom right) */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-[#5c554e] hover:bg-[#332f2c] text-white flex items-center justify-center shadow-2xl transition-all rounded-xs hover:scale-110"
          title="Voltar ao Topo"
          aria-label="Voltar ao Topo"
        >
          <ChevronUp size={24} />
        </button>
      </section>

      {/* ========================================================================= */}
      {/* 5. SERVICES SHOWCASE & CATEGORIZED CATALOG                                */}
      {/* ========================================================================= */}
      <section id="services-section" className="relative w-full bg-zinc-950 text-white overflow-hidden py-16 md:py-24 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 border border-[#f5ab2b]/60 px-4 py-1 text-[11px] font-black tracking-widest text-[#f5ab2b] uppercase mb-4 bg-[#f5ab2b]/10 rounded-full">
              <Scissors size={13} />
              Catálogo Oficial de Serviços & Preços
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-3">
              {activeShop.name}
            </h2>
            <p className="text-stone-400 text-sm md:text-base leading-relaxed">
              {activeShop.tagline || 'Cortes de precisão, barboterapia de alto padrão e cuidados masculinos exclusivos.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-stone-400">
              <span className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg">
                <MapPin size={14} className="text-[#f5ab2b]" />
                {activeShop.city}, {activeShop.country}
              </span>
              <span className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg">
                <Clock size={14} className="text-[#f5ab2b]" />
                Segunda a Sábado | 9h–20h
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {[
              { id: 'all', label: 'Todos os Serviços' },
              { id: 'Cortes & Cabelo', label: 'Cortes & Cabelo' },
              { id: 'Barba & Rosto', label: 'Barba & Rosto' },
              { id: 'Estética & Rosto', label: 'Estética & Rosto' },
              { id: 'Combos & Packs', label: 'Combos & Packs' },
            ].map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-[#f5ab2b] text-zinc-950 shadow-lg shadow-[#f5ab2b]/20 scale-105' 
                      : 'bg-zinc-900/80 text-stone-400 hover:text-white hover:bg-zinc-800 border border-stone-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Services Grid with Direct MARCAÇÃO CTA */}
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services
                .filter(s => {
                  if (selectedCategory === 'all') return true;
                  const cat = s.category || (
                    s.name.toLowerCase().includes('barba') && (s.name.toLowerCase().includes('corte') || s.name.toLowerCase().includes('pack')) ? 'Combos & Packs' :
                    s.name.toLowerCase().includes('barba') || s.name.toLowerCase().includes('barboterapia') ? 'Barba & Rosto' :
                    s.name.toLowerCase().includes('pele') || s.name.toLowerCase().includes('sobrancelha') ? 'Estética & Rosto' :
                    s.name.toLowerCase().includes('pack') ? 'Combos & Packs' : 'Cortes & Cabelo'
                  );
                  return cat === selectedCategory;
                })
                .map((service) => (
                  <div 
                    key={service.id}
                    className="bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-[#f5ab2b]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/60 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Category tag and duration */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#f5ab2b] bg-[#f5ab2b]/10 px-2.5 py-1 rounded-md border border-[#f5ab2b]/20">
                          {service.category || 'Procedimento'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400 bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                          <Clock size={12} className="text-[#f5ab2b]" />
                          {service.durationMinutes || service.duration || 30} min
                        </span>
                      </div>

                      {/* Service Name */}
                      <h3 className="text-xl font-black text-white group-hover:text-[#f5ab2b] transition-colors mb-2">
                        {service.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-stone-400 leading-relaxed mb-6">
                        {service.description || 'Procedimento profissional executado com equipamentos higienizados e produtos de alta qualidade.'}
                      </p>
                    </div>

                    {/* Bottom Row: Price + MARCAÇÃO Button */}
                    <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Valor</span>
                        <span className="text-2xl font-black text-[#f5ab2b]">
                          € {service.price.toFixed(2)}
                        </span>
                      </div>

                      <Link
                        to={`/${activeShop.slug}/booking?serviceId=${service.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f5ab2b] hover:bg-[#e09820] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-105 active:scale-95"
                      >
                        <Scissors size={14} />
                        Marcação
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-stone-900 border border-stone-800">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-[#f5ab2b] flex items-center justify-center mx-auto mb-3">
                <Scissors size={22} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Catálogo em Configuração</h3>
              <p className="text-xs text-stone-400 mb-4">
                Nenhum serviço foi cadastrado para esta barbearia ainda.
              </p>
            </div>
          )}

          {/* Quick Notice */}
          <div className="mt-12 text-center">
            <p className="text-xs text-stone-400">
              Precisa de ajuda ou agendamento para eventos? Contacte a barbearia diretamente pelo telefone <span className="text-white font-bold">{activeShop.phone || '+351 910 000 123'}</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5B. EQUIPE DE PROFISSIONAIS (BARBEIROS)                                    */}
      {/* ========================================================================= */}
      <section id="barbers-section" className="w-full bg-[#181615] text-white py-16 md:py-24 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 border border-[#f5ab2b]/60 px-4 py-1 text-[11px] font-black tracking-widest text-[#f5ab2b] uppercase mb-4 bg-[#f5ab2b]/10 rounded-full">
              <Award size={13} />
              Especialistas em Navalha & Tesoura
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-3">
              Nossa Equipe de Barbeiros
            </h2>
            <p className="text-stone-400 text-sm md:text-base leading-relaxed">
              Profissionais experientes, dedicados a proporcionar o melhor corte e atendimento da região.
            </p>
          </div>

          {barbers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {barbers.map((barber) => (
                <div 
                  key={barber.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center hover:border-[#f5ab2b]/50 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Barber Avatar */}
                    <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#f5ab2b] shadow-xl group-hover:scale-105 transition-transform bg-stone-950">
                      <img 
                        src={barber.photoUrl || barberImages.modelSide} 
                        alt={barber.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Rating Stars */}
                    <div className="flex items-center justify-center gap-1 text-[#f5ab2b] mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                      <span className="text-xs font-bold text-white ml-1">{barber.rating ? barber.rating.toFixed(1) : '5.0'}</span>
                    </div>

                    {/* Barber Name */}
                    <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#f5ab2b] transition-colors mb-1">
                      {barber.name}
                    </h3>

                    {/* Bio */}
                    <p className="text-xs text-stone-400 line-clamp-3 mb-6">
                      {barber.bio || 'Barbeiro especialista com anos de dedicação ao estilo masculino clássico e contemporâneo.'}
                    </p>
                  </div>

                  {/* Direct Booking CTA */}
                  <Link
                    to={`/${activeShop.slug}/booking?barberId=${barber.id}`}
                    className="w-full py-2.5 bg-stone-800 hover:bg-[#f5ab2b] text-white hover:text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Calendar size={13} />
                    Agendar com {barber.name.split(' ')[0]}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-stone-900 border border-stone-800">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-[#f5ab2b] flex items-center justify-center mx-auto mb-3">
                <Scissors size={22} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Equipe em Atualização</h3>
              <p className="text-xs text-stone-400 mb-5">
                Nenhum barbeiro foi cadastrado para esta unidade ainda. Você pode realizar agendamentos selecionando &quot;Sem Preferência&quot;.
              </p>
              <Link
                to={`/${activeShop.slug}/booking`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f5ab2b] hover:bg-[#e09820] text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                <Calendar size={14} />
                Agendar Horário
              </Link>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. USER APPOINTMENTS FLOATING BAR (If customer has upcoming appointments) */}
      {/* ========================================================================= */}
      {user && appointments.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-30 bg-zinc-900/95 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f5ab2b] text-zinc-950 flex items-center justify-center font-bold shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#f5ab2b] tracking-wider">Próximo Horário Agendado</p>
                <p className="text-xs font-bold text-white">
                  {format(new Date(appointments[0].date), "dd 'de' MMMM", { locale: ptBR })} às {appointments[0].time}
                </p>
              </div>
            </div>
            <Link 
              to="/appointments" 
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              Ver Detalhes
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODALS (History & Services)                                            */}
      {/* ========================================================================= */}
      {/* Story Modal */}
      {storyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#24211e] text-white max-w-2xl w-full p-6 sm:p-8 rounded-2xl shadow-2xl border border-stone-800 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setStoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="border border-[#f5ab2b]/60 px-4 py-1 text-[10px] font-black tracking-widest text-[#f5ab2b] uppercase inline-block mb-4">
              Nossa Trajetória
            </div>
            <h3 className="text-2xl font-black uppercase text-white mb-4">A Essência do {activeShop.name}</h3>
            <div className="space-y-4 text-stone-300 text-sm leading-relaxed">
              <p>
                {activeShop.storyText || 'Nossa barbearia nasceu da paixão pelo ofício clássico da navalha, tesoura e toalha quente, aliada a técnicas contemporâneas de visagismo masculino e produtos de alta performance.'}
              </p>
              <p>
                Acreditamos que cada homem merece um refúgio onde o atendimento não seja apenas uma necessidade diária, mas uma pausa relaxante com café espresso, cerveja gelada, boa conversa e cuidado impecável.
              </p>
              <p>
                Com profissionais altamente qualificados e contínuo aprimoramento internacional, o {activeShop.name} é sinônimo de tradição, requinte e pontualidade.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
              <button 
                onClick={() => setStoryModalOpen(false)}
                className="px-6 py-2.5 bg-[#f5ab2b] text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services List Modal */}
      {servicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#24211e] text-white max-w-2xl w-full p-6 sm:p-8 rounded-2xl shadow-2xl border border-stone-800 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setServicesModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="border border-[#f5ab2b]/60 px-4 py-1 text-[10px] font-black tracking-widest text-[#f5ab2b] uppercase inline-block mb-4">
              Menu Completo
            </div>
            <h3 className="text-2xl font-black uppercase text-white mb-6">Nossos Serviços & Cuidados</h3>

            <div className="divide-y divide-stone-800">
              {services.map((s) => (
                <div key={s.id} className="py-4 flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-base text-white group-hover:text-[#f5ab2b] transition-colors">{s.name}</h4>
                    <p className="text-xs text-stone-400 mt-0.5">{s.description || 'Cuidado especializado com acabamento impecável.'}</p>
                    <span className="text-[10px] text-stone-500 font-medium">{s.durationMinutes || s.duration || 30} minutos</span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-black text-base text-[#f5ab2b]">€ {s.price.toFixed(2)}</span>
                    <Link
                      to={`/${activeShop.slug}/booking?serviceId=${s.id}`}
                      onClick={() => setServicesModalOpen(false)}
                      className="px-3 py-1.5 bg-[#f5ab2b] hover:bg-[#e09820] text-zinc-950 font-bold text-xs uppercase rounded-lg transition-transform hover:scale-105"
                    >
                      Marcação
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-stone-800 flex justify-between items-center">
              <Link 
                to={`/${activeShop.slug}/booking`}
                onClick={() => setServicesModalOpen(false)}
                className="px-6 py-3 bg-[#f5ab2b] hover:bg-[#e09820] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-transform hover:scale-105"
              >
                Agendar Horário Agora
              </Link>
              <button 
                onClick={() => setServicesModalOpen(false)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#181615] text-stone-400 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#f5ab2b] flex items-center justify-center text-[#f5ab2b] font-bold">
              ✂️
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wider uppercase">{activeShop.name}</p>
              <p className="text-xs text-stone-500">Barba, Cabelo, Bigode & Tradição</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-wider font-semibold">
            <button onClick={() => scrollToTop()} className="hover:text-white">Início</button>
            <button onClick={() => scrollToSection('app-section')} className="hover:text-white">O App</button>
            <button onClick={() => scrollToSection('story-section')} className="hover:text-white">História</button>
            <button onClick={() => scrollToSection('services-section')} className="hover:text-white">Serviços</button>
            <Link to="/saas" className="text-[#f5ab2b] hover:underline">SaaS Para Barbearias</Link>
          </div>

          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} {activeShop.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
