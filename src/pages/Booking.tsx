import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { firestoreService } from '../services/firestoreService';
import { appointmentService } from '../services/appointmentService';
import { productService } from '../services/productService';
import { saasService } from '../services/saasService';
import { Service, Barber, Product, AppointmentProductItem, SaaSBarbershop } from '../models';
import { 
  ArrowLeft, ChevronRight, Clock, Calendar as CalendarIcon, CheckCircle2, 
  Scissors, Sparkles, User as UserIcon, UserCheck, Plus, Minus, ShoppingBag, 
  VolumeX, Check, AlertCircle, ShieldCheck, X, Phone, MessageCircle 
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Booking() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();

  // Active Barbershop
  const [activeShop, setActiveShop] = useState<SaaSBarbershop>(saasService.getActiveBarbershop());

  useEffect(() => {
    async function resolveShop() {
      if (slug) {
        const found = await saasService.getBarbershopBySlug(slug);
        if (found) {
          setActiveShop(found);
          saasService.setActiveBarbershop(found.id);
        }
      }
    }
    resolveShop();
  }, [slug]);

  // Step state (1: Service, 2: Barber, 3: Date & Time, 4: Products, 5: Confirm)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Data lists
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null | 'no-preference'>('no-preference');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [quietService, setQuietService] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'local' | 'cash' | 'mbway' | 'multibanco'>('local');

  // Logic & loading
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Restore pending booking if saved
  useEffect(() => {
    const saved = localStorage.getItem('pending_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (services.length > 0 && parsed.serviceId) {
            const foundService = services.find(s => s.id === parsed.serviceId);
            if (foundService) setSelectedService(foundService);
          }
          if (barbers.length > 0 && parsed.barberId) {
            if (parsed.barberId === 'no-preference') {
              setSelectedBarber('no-preference');
            } else {
              const foundBarber = barbers.find(b => b.id === parsed.barberId);
              if (foundBarber) setSelectedBarber(foundBarber);
            }
          }
          if (parsed.date) setSelectedDate(parsed.date);
          if (parsed.time) setSelectedTime(parsed.time);
          if (parsed.products) setSelectedProducts(parsed.products);
          if (parsed.quietService !== undefined) setQuietService(parsed.quietService);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.step) setStep(parsed.step);

          if (user) {
            localStorage.removeItem('pending_booking');
          }
        }
      } catch (e) {
        console.error('Error restoring pending booking:', e);
      }
    }
  }, [services, barbers, user]);

  // Next 14 days list for the date carousel
  const nextDays = Array.from({ length: 14 }).map((_, i) => {
    const d = addDays(new Date(), i);
    return {
      dateString: format(d, 'yyyy-MM-dd'),
      dayOfWeek: format(d, 'EEE', { locale: ptBR }).toUpperCase().replace('.', ''),
      dayOfMonth: format(d, 'dd'),
      month: format(d, 'MMM', { locale: ptBR }).toUpperCase().replace('.', '')
    };
  });

  useEffect(() => {
    // Set initial date to today
    if (nextDays.length > 0 && !selectedDate) {
      setSelectedDate(nextDays[0].dateString);
    }
  }, []);

  // Load initial services, barbers, products
  useEffect(() => {
    async function loadData() {
      const targetShop = slug || activeShop.slug;
      const [s, b, p] = await Promise.all([
        firestoreService.getServices(targetShop),
        firestoreService.getBarbers(targetShop),
        productService.getProducts()
      ]);
      const activeServices = s.filter(srv => srv.isActive !== false);
      const activeBarbers = b.filter(brb => brb.isActive !== false);

      setServices(activeServices);
      setBarbers(activeBarbers);
      setProducts(p.filter(prd => prd.isActive !== false));

      // Handle direct pre-selection via URL search query
      const serviceIdParam = searchParams.get('serviceId');
      if (serviceIdParam) {
        const foundService = activeServices.find(srv => srv.id === serviceIdParam);
        if (foundService) {
          setSelectedService(foundService);
          setStep(2); // Advance directly to Barber Selection
        }
      }

      const barberIdParam = searchParams.get('barberId');
      if (barberIdParam) {
        const foundBarber = activeBarbers.find(brb => brb.id === barberIdParam);
        if (foundBarber) {
          setSelectedBarber(foundBarber);
        }
      }
    }
    loadData();
  }, [slug, activeShop.slug, searchParams]);

  // Load booked times when date or barber changes
  useEffect(() => {
    async function checkTimes() {
      if (selectedDate) {
        const appts = await appointmentService.getAllAppointments();
        const booked = appts
          .filter(a => a.date === selectedDate && a.status !== 'cancelled')
          .filter(a => {
            if (selectedBarber === 'no-preference' || !selectedBarber) return false;
            return a.barberId === selectedBarber.id;
          })
          .map(a => a.time);
        setBookedTimes(booked);
      }
    }
    checkTimes();
  }, [selectedBarber, selectedDate]);

  // Product stepper helper
  const handleProductQuantity = (productId: string, delta: number) => {
    setSelectedProducts(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Calculate totals
  const servicePrice = selectedService ? selectedService.price : 0;
  const productsTotal = Object.entries(selectedProducts).reduce((sum, [pId, qty]) => {
    const prod = products.find(p => p.id === pId);
    const quantity = Number(qty);
    return sum + (prod ? prod.price * quantity : 0);
  }, 0);
  const grandTotal = servicePrice + productsTotal;

  // Selected products itemized list for saving
  const selectedProductsItems: AppointmentProductItem[] = Object.entries(selectedProducts).map(([pId, qty]) => {
    const prod = products.find(p => p.id === pId);
    return {
      productId: pId,
      name: prod?.name || 'Produto',
      price: prod?.price || 0,
      quantity: Number(qty)
    };
  });

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    if (!user) {
      const pendingData = {
        shopSlug: slug || activeShop.slug,
        serviceId: selectedService.id,
        barberId: selectedBarber === 'no-preference' || !selectedBarber ? 'no-preference' : selectedBarber.id,
        date: selectedDate,
        time: selectedTime,
        products: selectedProducts,
        quietService,
        notes,
        step: 5
      };
      localStorage.setItem('pending_booking', JSON.stringify(pendingData));
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const barberIdToSave = selectedBarber === 'no-preference' || !selectedBarber
        ? (barbers[0]?.id || 'b1')
        : selectedBarber.id;

      await appointmentService.createAppointment({
        customerId: user.uid,
        barberId: barberIdToSave,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        paymentMethod,
        paymentStatus: 'pending',
        branch: 'PT',
        barbershopId: activeShop.id,
        selectedProducts: selectedProductsItems,
        quietService,
        notes,
        totalAmount: grandTotal
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar agendamento.');
      setLoading(false);
    }
  };

  // Morning and Afternoon/Night slot lists matching closing time at 20:30
  const morningTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
  const afternoonTimes = [
    '14:00', '14:30', '15:00', '15:30', '16:00', 
    '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // Back button handler based on step
  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as any);
    } else {
      navigate(-1);
    }
  };

  // Step Titles matching the Lovable images
  const stepTitles: Record<number, string> = {
    1: 'Escolha o Serviço',
    2: 'Escolha o Barbeiro',
    3: 'Data e Horário',
    4: 'Produtos Recomendados',
    5: 'Confirmar'
  };

  const shopPhone = activeShop.phone || '+351 968 659 043';
  const cleanPhoneForWa = shopPhone.replace(/[^0-9]/g, '');
  const cleanPhoneForTel = shopPhone.replace(/\s+/g, '');

  if (isSuccess) {
    const waText = encodeURIComponent(
      `Olá! Acabei de realizar um agendamento na ${activeShop.name}:\n` +
      `Serviço: ${selectedService?.name}\n` +
      `Data/Hora: ${selectedDate} às ${selectedTime}\n` +
      `Profissional: ${selectedBarber === 'no-preference' ? 'Sem Preferência' : selectedBarber?.name}`
    );

    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 size={44} className="animate-bounce" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4a338]">Agendamento Concluído</span>
            <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">Horário Reservado!</h3>
            <p className="text-zinc-500 text-sm mt-2">
              Seu agendamento na unidade <span className="font-semibold text-zinc-800">{activeShop.name} - {activeShop.unit}</span> foi confirmado com sucesso.
            </p>
          </div>

          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">Serviço:</span>
              <span className="font-bold text-zinc-900">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Data e Hora:</span>
              <span className="font-bold text-zinc-900">{selectedDate} às {selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Profissional:</span>
              <span className="font-bold text-zinc-900">
                {selectedBarber === 'no-preference' ? 'Sem Preferência' : selectedBarber?.name}
              </span>
            </div>
            {quietService && (
              <div className="flex justify-between text-amber-700 bg-amber-50 p-1.5 rounded-lg text-xs font-semibold">
                <span>Modo Quiet Service:</span>
                <span>Ativo 🤫</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-zinc-200">
              <span className="font-bold text-zinc-700">Total a pagar no local:</span>
              <span className="font-extrabold text-[#d4a338] text-base">
                {grandTotal.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Quick Contact & WhatsApp Redirection */}
          <div className="space-y-2.5 pt-1">
            <a
              href={`https://wa.me/${cleanPhoneForWa}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              <span>Enviar no WhatsApp da Barbearia</span>
            </a>

            <a
              href={`tel:${cleanPhoneForTel}`}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Phone size={14} className="text-[#d4a338]" />
              <span>Ligar para a Barbearia: {shopPhone}</span>
            </a>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <button
              onClick={() => navigate('/appointments')}
              className="w-full py-3.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-md transition-all"
            >
              Ver Meus Agendamentos
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-2xl transition-all"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-12">
      {/* Top Header matching mobile mockups with gold brand styling */}
      <div className="sticky top-0 z-30 bg-[#fbfbfa]/95 backdrop-blur-md pt-2 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-zinc-200/50 transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="text-center flex-1 pr-6">
            <h1 className="text-lg font-extrabold text-zinc-900 tracking-tight">
              {stepTitles[step]}
            </h1>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              {activeShop.name} - {activeShop.unit}
            </p>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s 
                  ? 'w-7 bg-[#d4a338]' 
                  : step > s 
                    ? 'w-3 bg-zinc-800' 
                    : 'w-2 bg-zinc-200'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Escolha o Serviço (Matches image 2) */}
      {step === 1 && (
        <div className="px-4 py-5 space-y-3 animate-in fade-in duration-200">
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id;
            return (
              <div
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
                className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs hover:shadow-md ${
                  isSelected 
                    ? 'border-[#d4a338] bg-amber-50/40 ring-1 ring-[#d4a338]' 
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full border border-amber-200/80 bg-amber-50 flex items-center justify-center text-[#d4a338] shrink-0 group-hover:scale-105 transition-transform">
                    {service.name.toLowerCase().includes('barba') ? (
                      <Sparkles size={20} />
                    ) : (
                      <Scissors size={20} />
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 tracking-tight">
                      {service.name}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-zinc-400 mt-0.5">
                      <Clock size={13} className="mr-1" />
                      <span>{service.durationMinutes} MIN</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-[#d4a338]">
                    {service.price.toFixed(2)} €
                  </span>
                  <ChevronRight size={18} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 2: Escolha o Barbeiro (Matches image 3) */}
      {step === 2 && (
        <div className="px-4 py-5 space-y-4 animate-in fade-in duration-200">
          <div className="text-center">
            <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest">
              SELECIONE O PROFISSIONAL
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* SEM PREFERÊNCIA CARD */}
            <div
              onClick={() => {
                setSelectedBarber('no-preference');
                setStep(3);
              }}
              className={`cursor-pointer p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
                selectedBarber === 'no-preference'
                  ? 'border-[#d4a338] ring-2 ring-[#d4a338]/20 bg-amber-50/20'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-[#d4a338] flex items-center justify-center mb-3 text-[#d4a338] shadow-sm">
                <Scissors size={26} className="rotate-45" />
              </div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900">
                SEM PREFERÊNCIA
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Qualquer profissional livre</p>
            </div>

            {/* BARBERS LIST */}
            {barbers.map((barber) => {
              const isSelected = selectedBarber !== 'no-preference' && selectedBarber?.id === barber.id;
              return (
                <div
                  key={barber.id}
                  onClick={() => {
                    setSelectedBarber(barber);
                    setStep(3);
                  }}
                  className={`cursor-pointer p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-[#d4a338] ring-2 ring-[#d4a338]/20 bg-amber-50/20'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-900 mb-3 bg-zinc-100 shadow-sm">
                    {barber.photoUrl ? (
                      <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                        <UserIcon size={24} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900">
                    {barber.name}
                  </h4>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">★ 5.0 (Master)</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: Data e Horário (Matches images 4 & 5) */}
      {step === 3 && (
        <div className="px-4 py-5 space-y-6 animate-in fade-in duration-200">
          {/* Horário de Atendimento e Fechamento */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-900">
              <Clock size={16} className="text-[#d4a338] shrink-0" />
              <div>
                <span className="font-bold text-zinc-900 block sm:inline">Horário de Funcionamento: </span>
                <span className="text-zinc-700 font-semibold">Segunda a Sábado das 09:00 às 20:30</span>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-[#d4a338] text-zinc-950 font-extrabold text-[10px] uppercase tracking-wider rounded-md">
              Até 20h30
            </span>
          </div>

          {/* ESCOLHA A DATA */}
          <div>
            <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-3">
              ESCOLHA A DATA
            </span>

            {/* Horizontal Swipeable Date Carousel */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
              {nextDays.map((d) => {
                const isSelected = selectedDate === d.dateString;
                return (
                  <button
                    key={d.dateString}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.dateString);
                      setSelectedTime(''); // Reset selected slot for new day
                    }}
                    className={`shrink-0 snap-start w-16 py-3 px-2 rounded-2xl text-center transition-all duration-200 border ${
                      isSelected
                        ? 'bg-[#d4a338] text-zinc-950 border-[#d4a338] shadow-md font-extrabold'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span className={`block text-[11px] font-bold uppercase ${isSelected ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {d.dayOfWeek}
                    </span>
                    <span className="block text-xl font-extrabold mt-0.5">
                      {d.dayOfMonth}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MANHÃ SLOTS */}
          <div>
            <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2.5">
              MANHÃ
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {morningTimes.map((time) => {
                const isBooked = bookedTimes.includes(time);
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 text-center text-sm font-bold rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#d4a338] text-zinc-950 border-[#d4a338] shadow-sm scale-102'
                        : isBooked
                          ? 'bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed line-through'
                          : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TARDE / NOITE SLOTS */}
          <div>
            <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2.5">
              TARDE / NOITE
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {afternoonTimes.map((time) => {
                const isBooked = bookedTimes.includes(time);
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 text-center text-sm font-bold rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#d4a338] text-zinc-950 border-[#d4a338] shadow-sm scale-102'
                        : isBooked
                          ? 'bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed line-through'
                          : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTINUAR BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(4)}
              className="w-full py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Produtos Recomendados / Upsell (Matches image 6) */}
      {step === 4 && (
        <div className="px-4 py-5 space-y-4 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Deseja levar algo?
            </h2>
            <p className="text-zinc-500 text-xs mt-1">
              Aproveite e reserve os produtos que irá precisar no final do corte.
            </p>
          </div>

          <div className="space-y-3">
            {products.map((product) => {
              const qty = selectedProducts[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-2xl border transition-all bg-white flex items-center justify-between gap-3 shadow-xs ${
                    qty > 0 ? 'border-[#d4a338] bg-amber-50/20' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#d4a338] shrink-0">
                      <ShoppingBag size={22} />
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-900 uppercase">
                        {product.name}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {product.description}
                      </p>
                      <span className="text-sm font-extrabold text-[#d4a338] block mt-0.5">
                        {product.price.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    {qty > 0 ? (
                      <div className="flex items-center bg-zinc-100 rounded-xl p-1 gap-2">
                        <button
                          type="button"
                          onClick={() => handleProductQuantity(product.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-zinc-700 hover:text-zinc-950 font-bold"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-extrabold text-xs text-zinc-900 w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleProductQuantity(product.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#d4a338] text-zinc-950 shadow-xs flex items-center justify-center font-bold"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleProductQuantity(product.id, 1)}
                        className="w-9 h-9 rounded-xl bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 flex items-center justify-center shadow-xs transition-transform active:scale-95"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-3 space-y-2">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="w-full py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all"
            >
              {productsTotal > 0 ? `Continuar (${productsTotal.toFixed(2)} € em produtos)` : 'Pular e Continuar'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Confirmar Agendamento (Matches image 7) */}
      {step === 5 && (
        <div className="px-4 py-5 space-y-4 animate-in fade-in duration-200">
          {/* Summary Card */}
          <div className="p-5 rounded-3xl border border-zinc-200/80 shadow-sm space-y-4 text-zinc-900 bg-white placeholder:text-zinc-400">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">
                  {selectedService?.name}
                </h3>
                <span className="text-sm font-semibold text-zinc-400">
                  {selectedService?.durationMinutes} min de atendimento
                </span>
              </div>
              <span className="text-2xl font-black text-[#d4a338]">
                {selectedService?.price.toFixed(2)} €
              </span>
            </div>

            {/* Professional Selected */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-900 bg-zinc-100 shrink-0">
                {selectedBarber !== 'no-preference' && selectedBarber?.photoUrl ? (
                  <img src={selectedBarber.photoUrl} alt={selectedBarber.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 text-[#d4a338] flex items-center justify-center">
                    <Scissors size={20} />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  PROFISSIONAL
                </span>
                <h4 className="font-extrabold text-sm text-zinc-900 uppercase">
                  {selectedBarber === 'no-preference' ? 'Sem Preferência' : selectedBarber?.name}
                </h4>
              </div>
            </div>

            {/* Date & Time Badges */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 py-2.5 px-3 bg-zinc-100 rounded-xl flex items-center gap-2 text-xs font-bold text-zinc-800">
                <CalendarIcon size={16} className="text-[#d4a338]" />
                <span>{selectedDate}</span>
              </div>
              <div className="flex-1 py-2.5 px-3 bg-zinc-100 rounded-xl flex items-center gap-2 text-xs font-bold text-zinc-800">
                <Clock size={16} className="text-[#d4a338]" />
                <span>{selectedTime}</span>
              </div>
            </div>

            {/* Products Added summary */}
            {selectedProductsItems.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Produtos Reservados:
                </span>
                {selectedProductsItems.map(p => (
                  <div key={p.productId} className="flex justify-between text-xs text-zinc-700">
                    <span>{p.quantity}x {p.name}</span>
                    <span className="font-bold">{(p.price * p.quantity).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="font-bold text-zinc-700 text-sm">Total Estimado:</span>
              <span className="text-2xl font-black text-[#d4a338]">
                {grandTotal.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Quiet Service Toggle Card (Matches image 7) */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3 text-zinc-900 bg-white placeholder:text-zinc-400">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <VolumeX size={18} className="text-zinc-600" />
                <h4 className="font-extrabold text-sm text-zinc-900 uppercase tracking-tight">
                  Quiet Service
                </h4>
              </div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase">
                Não quero conversar durante o atendimento
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={quietService}
              onClick={() => setQuietService(!quietService)}
              className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                quietService ? 'bg-[#d4a338]' : 'bg-zinc-200'
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  quietService ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Observations Textarea (Matches image 7) */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 shadow-xs space-y-2 text-zinc-900 bg-white placeholder:text-zinc-400">
            <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest">
              Alguma Observação?
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cabelo muito grande, prefiro máquina 2 nas laterais..."
              className="w-full text-xs p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#d4a338] focus:border-transparent outline-none resize-none text-zinc-900 bg-white placeholder:text-zinc-400"
            />
          </div>

          {/* Presential Payment note */}
          <div className="bg-zinc-100 p-3 rounded-xl flex items-center gap-2 text-xs text-zinc-600">
            <ShieldCheck size={16} className="text-[#d4a338] shrink-0" />
            <span>O pagamento será realizado no local (Dinheiro, MB WAY ou Multibanco).</span>
          </div>

          {/* Loyalty Banner for guest users */}
          {!user && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#d4a338] text-zinc-950 flex items-center justify-center shrink-0 font-extrabold shadow-xs mt-0.5">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-zinc-900 uppercase tracking-tight flex items-center gap-1">
                  Clube de Pontos & Cashback ⭐
                </h4>
                <p className="text-zinc-600 leading-relaxed">
                  Para acumular pontos neste corte e trocar por descontos futuros, crie sua conta ao confirmar!
                </p>
              </div>
            </div>
          )}

          {/* Submit and Home actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitBooking}
              className="w-full py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 text-zinc-500 hover:text-zinc-800 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}

      {/* AUTH & LOYALTY MODAL FOR GUEST BOOKING */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-amber-200 relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 bg-amber-100 text-[#d4a338] rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-amber-200">
              <Sparkles size={32} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#d4a338] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                ⭐ Clube de Pontos & Cashback
              </span>
              <h3 className="text-xl font-extrabold text-zinc-900 mt-2 leading-tight">
                Crie a sua Conta para Agendar!
              </h3>
              <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                Para confirmar o agendamento de <strong className="text-zinc-800">{selectedService?.name}</strong> e acumular pontos de cashback no nosso Clube de Fidelidade, crie a sua conta ou faça login.
              </p>
            </div>

            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 text-left text-xs text-zinc-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-zinc-900">
                <CheckCircle2 size={16} className="text-[#d4a338] shrink-0" />
                <span>Ganha pontos em cada {activeShop?.country?.toLowerCase().includes('brasil') || activeShop?.country?.toLowerCase().includes('br') ? 'real' : 'euro'} gasto</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-zinc-900">
                <CheckCircle2 size={16} className="text-[#d4a338] shrink-0" />
                <span>Troque pontos por cortes e produtos grátis</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-zinc-900">
                <CheckCircle2 size={16} className="text-[#d4a338] shrink-0" />
                <span>Gestão fácil no App PWA sem complicação</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const pendingData = {
                    shopSlug: slug || activeShop.slug,
                    serviceId: selectedService?.id,
                    barberId: selectedBarber === 'no-preference' || !selectedBarber ? 'no-preference' : selectedBarber.id,
                    date: selectedDate,
                    time: selectedTime,
                    products: selectedProducts,
                    quietService,
                    notes,
                    step: 5
                  };
                  localStorage.setItem('pending_booking', JSON.stringify(pendingData));
                  navigate('/register');
                }}
                className="w-full py-3.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Criar Conta & Ganhar Pontos
              </button>

              <button
                onClick={() => {
                  const pendingData = {
                    shopSlug: slug || activeShop.slug,
                    serviceId: selectedService?.id,
                    barberId: selectedBarber === 'no-preference' || !selectedBarber ? 'no-preference' : selectedBarber.id,
                    date: selectedDate,
                    time: selectedTime,
                    products: selectedProducts,
                    quietService,
                    notes,
                    step: 5
                  };
                  localStorage.setItem('pending_booking', JSON.stringify(pendingData));
                  navigate('/login');
                }}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Já tenho conta (Fazer Login)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
