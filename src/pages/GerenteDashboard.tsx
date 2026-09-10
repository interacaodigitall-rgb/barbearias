import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { appointmentService } from '../services/appointmentService';
import { cashFlowService } from '../services/cashFlowService';
import { productService } from '../services/productService';
import { saasService } from '../services/saasService';
import { Appointment, Barber, Service, Product, AppointmentProductItem, CashFlowTransaction } from '../models';
import { calculateBarberCommission, isBarberOwner } from '../utils/commissionUtils';
import {
  ShoppingBag, Calendar, CreditCard, DollarSign, Wallet, Scissors,
  Plus, Check, CheckCircle2, Clock, AlertTriangle, ArrowRight, Printer,
  RefreshCw, Users, Sparkles, Filter, Search, ChevronRight, X, User,
  Building2, LogOut, ArrowDownCircle, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GerenteDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'appointments' | 'walkin' | 'products' | 'cashRegister'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  // Checkout Modal State
  const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<Appointment['paymentMethod']>('mbway');
  const [checkoutBarberId, setCheckoutBarberId] = useState<string>('');
  const [checkoutSelectedProducts, setCheckoutSelectedProducts] = useState<AppointmentProductItem[]>([]);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [receiptSuccessAppt, setReceiptSuccessAppt] = useState<Appointment | null>(null);

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: '',
    barberId: '',
    paymentMethod: 'mbway' as Appointment['paymentMethod'],
    notes: '',
    selectedProducts: [] as AppointmentProductItem[]
  });
  const [isProcessingWalkIn, setIsProcessingWalkIn] = useState(false);

  // New Product modal state
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'styling' as Product['category']
  });

  // Cash Register Sangria / Withdrawal Modal
  const [isSangriaModalOpen, setIsSangriaModalOpen] = useState(false);
  const [sangriaForm, setSangriaForm] = useState({
    amount: '',
    description: '',
    paymentMethod: 'cash' as 'cash' | 'mbway' | 'card' | 'transfer'
  });

  const activeShop = saasService.getActiveBarbershop();

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [appts, srvs, barbs, prods, txs] = await Promise.all([
        appointmentService.getAllAppointments(activeShop.id),
        firestoreService.getServices(),
        firestoreService.getBarbers(),
        productService.getProducts(),
        cashFlowService.getTransactions(activeShop.id)
      ]);
      setAppointments(appts);
      setServices(srvs);
      setBarbers(barbs);
      setProducts(prods);
      setTransactions(txs);

      // Default walkin form selection
      if (srvs.length > 0 && !walkInForm.serviceId) {
        setWalkInForm(prev => ({ ...prev, serviceId: srvs[0].id }));
      }
      if (barbs.length > 0 && !walkInForm.barberId) {
        setWalkInForm(prev => ({ ...prev, barberId: barbs[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar dados do PDV:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeShop.id]);

  // Handle Quick Demo Login as Gerente if unauthenticated
  const handleQuickLoginGerente = async () => {
    try {
      await authService.loginDemo('gerente');
      await loadAllData();
    } catch (err) {
      alert('Erro ao entrar como gerente demo.');
    }
  };

  // Turno / Caixa do Dia Real-time Calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayCashMetrics = useMemo(() => {
    const todayTxs = transactions.filter(t => t.date === todayStr);

    const cashTotal = todayTxs
      .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const mbwayTotal = todayTxs
      .filter(t => t.type === 'income' && t.paymentMethod === 'mbway')
      .reduce((sum, t) => sum + t.amount, 0);

    const cardTotal = todayTxs
      .filter(t => t.type === 'income' && (t.paymentMethod === 'card' || t.paymentMethod === 'multibanco' || t.paymentMethod === 'debit'))
      .reduce((sum, t) => sum + t.amount, 0);

    const loyaltyTotal = todayTxs
      .filter(t => t.type === 'income' && t.paymentMethod === 'loyalty')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = todayTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawalsTotal = todayTxs
      .filter(t => t.type === 'expense' && (t.category === 'withdrawal' || t.category === 'supplies'))
      .reduce((sum, t) => sum + t.amount, 0);

    const commissionsTotal = todayTxs
      .filter(t => t.type === 'expense' && t.category === 'commission')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      cashTotal: parseFloat(cashTotal.toFixed(2)),
      mbwayTotal: parseFloat(mbwayTotal.toFixed(2)),
      cardTotal: parseFloat(cardTotal.toFixed(2)),
      loyaltyTotal: parseFloat(loyaltyTotal.toFixed(2)),
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      withdrawalsTotal: parseFloat(withdrawalsTotal.toFixed(2)),
      commissionsTotal: parseFloat(commissionsTotal.toFixed(2)),
      txCount: todayTxs.length
    };
  }, [transactions, todayStr]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchDate = selectedDateFilter ? a.date === selectedDateFilter : true;
      const matchBarber = selectedBarberFilter === 'all' ? true : a.barberId === selectedBarberFilter;
      return matchDate && matchBarber;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDateFilter, selectedBarberFilter]);

  // Open Checkout Modal
  const handleOpenCheckout = (appt: Appointment) => {
    setCheckoutAppt(appt);
    setCheckoutPaymentMethod(appt.paymentMethod || 'mbway');
    setCheckoutBarberId(appt.barberId);
    setCheckoutSelectedProducts(appt.selectedProducts || []);
  };

  // Add Product to Checkout
  const handleAddProductToCheckout = (product: Product) => {
    setCheckoutSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === product.id);
      if (existing) {
        return prev.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const handleRemoveProductFromCheckout = (productId: string) => {
    setCheckoutSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  // Perform Checkout (Dar Baixa)
  const handleConfirmCheckout = async () => {
    if (!checkoutAppt) return;
    setIsProcessingCheckout(true);
    try {
      const completed = await appointmentService.checkoutAppointment(checkoutAppt.id, {
        paymentMethod: checkoutPaymentMethod,
        barberId: checkoutBarberId,
        selectedProducts: checkoutSelectedProducts,
        closedBy: user?.name || 'Gerente'
      });

      // Update product stock if products were sold
      for (const prod of checkoutSelectedProducts) {
        await productService.decrementStock(prod.productId, prod.quantity);
      }

      setReceiptSuccessAppt(completed);
      setCheckoutAppt(null);
      await loadAllData();
    } catch (err: any) {
      alert('Erro ao concluir cobrança: ' + err.message);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Perform Walk-in Sale (Venda Avulsa de Balcão)
  const handleConfirmWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.serviceId || !walkInForm.barberId) {
      alert('Selecione o serviço e o barbeiro responsável.');
      return;
    }

    setIsProcessingWalkIn(true);
    try {
      const completed = await appointmentService.createWalkInSale({
        serviceId: walkInForm.serviceId,
        barberId: walkInForm.barberId,
        paymentMethod: walkInForm.paymentMethod,
        customerName: walkInForm.customerName.trim() || 'Cliente Balcão (Walk-in)',
        customerPhone: walkInForm.customerPhone.trim(),
        selectedProducts: walkInForm.selectedProducts,
        notes: walkInForm.notes,
        closedBy: user?.name || 'Gerente',
        barbershopId: activeShop.id
      });

      // Update product stock if products were sold
      for (const prod of walkInForm.selectedProducts) {
        await productService.decrementStock(prod.productId, prod.quantity);
      }

      setReceiptSuccessAppt(completed);
      setWalkInForm({
        customerName: '',
        customerPhone: '',
        serviceId: services[0]?.id || '',
        barberId: barbers[0]?.id || '',
        paymentMethod: 'mbway',
        notes: '',
        selectedProducts: []
      });
      await loadAllData();
    } catch (err: any) {
      alert('Erro ao registrar venda avulsa: ' + err.message);
    } finally {
      setIsProcessingWalkIn(false);
    }
  };

  // Stock adjustments
  const handleUpdateStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    await productService.updateProduct(product.id, { stock: newStock });
    await loadAllData();
  };

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price) return;

    await productService.addProduct({
      name: newProductForm.name,
      description: newProductForm.description,
      price: parseFloat(newProductForm.price),
      stock: parseInt(newProductForm.stock) || 10,
      category: newProductForm.category,
      isActive: true
    });

    setIsNewProductModalOpen(false);
    setNewProductForm({ name: '', description: '', price: '', stock: '', category: 'styling' });
    await loadAllData();
  };

  // Register Sangria / Retirada de Caixa
  const handleRegisterSangria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sangriaForm.amount || !sangriaForm.description) return;

    await cashFlowService.addTransaction({
      barbershopId: activeShop.id,
      type: 'expense',
      category: 'withdrawal',
      description: `Retirada / Sangria de Caixa: ${sangriaForm.description} (${user?.name || 'Gerente'})`,
      amount: parseFloat(sangriaForm.amount),
      date: todayStr,
      paymentMethod: sangriaForm.paymentMethod
    });

    setIsSangriaModalOpen(false);
    setSangriaForm({ amount: '', description: '', paymentMethod: 'cash' });
    await loadAllData();
    alert('Retirada de caixa registrada com sucesso!');
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Unauthenticated Banner
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="w-16 h-16 bg-[#d4a338] text-zinc-950 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-2xl font-black">PDV & Frente de Caixa</h2>
          <p className="text-zinc-400 text-sm mt-2">
            Acesso exclusivo para gerentes, administradores e proprietários da Roger'X BarberShop.
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleQuickLoginGerente}
              className="w-full py-3 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              Entrar como Gerente (Modo PDV Roger'X)
            </button>
            <Link
              to="/login"
              className="block w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm transition-all"
            >
              Entrar com Email & Senha
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-16">
      {/* Top Bar / POS Header */}
      <div className="bg-zinc-950 text-white border-b border-zinc-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4a338] text-zinc-950 flex items-center justify-center font-black shadow-md">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#d4a338]">Frente de Caixa (PDV)</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Caixa Operando
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                {activeShop.name}
                <span className="text-xs font-normal text-zinc-400">| Operador: <strong className="text-white">{user.name}</strong> ({user.role})</span>
              </h1>
            </div>
          </div>

          {/* Quick links & Caixa summary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSangriaModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownCircle size={14} className="text-amber-400" />
              Sangria / Retirada
            </button>
            <Link
              to="/admin"
              className="px-3 py-1.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Building2 size={14} />
              Painel Admin
            </Link>
          </div>
        </div>

        {/* Turno Cash KPIs Bar */}
        <div className="bg-zinc-900/90 border-t border-zinc-800/80 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 text-xs">
            <div className="flex items-center gap-5 whitespace-nowrap">
              <div>
                <span className="text-zinc-500 uppercase text-[10px] font-bold block">💵 Dinheiro Gaveta</span>
                <span className="text-sm font-black text-white">€ {todayCashMetrics.cashTotal.toFixed(2)}</span>
              </div>
              <div className="h-6 w-px bg-zinc-800"></div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px] font-bold block">📱 MB WAY</span>
                <span className="text-sm font-black text-white">€ {todayCashMetrics.mbwayTotal.toFixed(2)}</span>
              </div>
              <div className="h-6 w-px bg-zinc-800"></div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px] font-bold block">💳 Multibanco / Cartão</span>
                <span className="text-sm font-black text-white">€ {todayCashMetrics.cardTotal.toFixed(2)}</span>
              </div>
              <div className="h-6 w-px bg-zinc-800"></div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px] font-bold block">✂️ Comissões Geradas Hoje</span>
                <span className="text-sm font-black text-amber-400">€ {todayCashMetrics.commissionsTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="whitespace-nowrap pl-4 border-l border-zinc-800">
              <span className="text-zinc-400 uppercase text-[10px] font-bold block">Total do Turno (Entradas)</span>
              <span className="text-base font-black text-emerald-400">€ {todayCashMetrics.totalIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'appointments' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Calendar size={16} />
              Atendimentos & Agenda
              <span className="text-[10px] bg-[#d4a338] text-zinc-950 px-1.5 py-0.2 rounded-full font-black">
                {filteredAppointments.filter(a => a.status !== 'completed').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('walkin')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'walkin' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Plus size={16} />
              Venda Balcão (Walk-in)
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'products' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <ShoppingBag size={16} />
              Estoque de Produtos
            </button>

            <button
              onClick={() => setActiveTab('cashRegister')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'cashRegister' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Wallet size={16} />
              Fechamento do Caixa
            </button>
          </div>

          <button
            onClick={loadAllData}
            title="Sincronizar em tempo real"
            className="p-2 text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* TAB 1: ATENDIMENTOS & AGENDA */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#d4a338]" />
                  <input
                    type="date"
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
                  />
                  <button
                    onClick={() => setSelectedDateFilter(todayStr)}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Hoje
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Scissors size={16} className="text-[#d4a338]" />
                  <select
                    value={selectedBarberFilter}
                    onChange={(e) => setSelectedBarberFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
                  >
                    <option value="all">Todos os Barbeiros</option>
                    {barbers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {isBarberOwner(b) ? '(Proprietário)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-zinc-500 font-medium">
                Exibindo <strong className="text-zinc-900">{filteredAppointments.length}</strong> agendamentos
              </div>
            </div>

            {/* Appointments Grid/List */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center space-y-3">
                <Calendar size={36} className="mx-auto text-zinc-300" />
                <h3 className="font-bold text-zinc-700">Nenhum agendamento encontrado</h3>
                <p className="text-xs text-zinc-400">Nenhum cliente agendado com os filtros selecionados.</p>
                <button
                  onClick={() => setActiveTab('walkin')}
                  className="px-4 py-2 bg-[#d4a338] text-zinc-950 text-xs font-bold rounded-xl"
                >
                  + Lançar Atendimento Balcão
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAppointments.map(appt => {
                  const service = services.find(s => s.id === appt.serviceId) || { name: 'Serviço Personalizado', price: appt.totalAmount || 15 };
                  const barber = barbers.find(b => b.id === appt.barberId);
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled';
                  const isOwner = isBarberOwner(barber);
                  const comm = calculateBarberCommission(service.price, appt.date, barber);

                  return (
                    <div
                      key={appt.id}
                      className={`bg-white p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                        isCompleted ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' :
                        isCancelled ? 'border-red-200 opacity-60 bg-red-50/10' :
                        'border-zinc-200 shadow-sm hover:border-[#d4a338]'
                      }`}
                    >
                      <div>
                        {/* Status & Time */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-black text-zinc-900 flex items-center gap-1.5">
                            <Clock size={16} className="text-[#d4a338]" />
                            {appt.time}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' :
                            isCancelled ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {isCompleted ? 'Concluído & Pago' : isCancelled ? 'Cancelado' : 'Aguardando Atendimento'}
                          </span>
                        </div>

                        {/* Customer & Service */}
                        <div className="space-y-1.5 mb-4">
                          <h4 className="font-bold text-base text-zinc-900">
                            {appt.customerName || `Cliente #${appt.customerId.slice(-4)}`}
                          </h4>
                          <p className="text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
                            <Scissors size={14} className="text-[#d4a338]" />
                            {service.name}
                          </p>
                          <div className="text-xs text-zinc-500 flex items-center justify-between">
                            <span>Barbeiro: <strong>{barber?.name || 'Não atribuído'}</strong></span>
                            {isOwner && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-200 text-zinc-800 rounded">
                                Dono
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Products if included */}
                        {appt.selectedProducts && appt.selectedProducts.length > 0 && (
                          <div className="bg-zinc-50 p-2.5 rounded-xl text-xs space-y-1 mb-4 border border-zinc-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Produtos Adicionados:</span>
                            {appt.selectedProducts.map((p, i) => (
                              <div key={i} className="flex justify-between text-zinc-600">
                                <span>{p.quantity}x {p.name}</span>
                                <span className="font-bold">€ {(p.price * p.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Commission preview badge */}
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50 text-xs mb-4">
                          <div className="flex justify-between items-center text-amber-900 font-semibold">
                            <span>Comissão Calculada:</span>
                            {isOwner ? (
                              <span className="text-zinc-600 font-bold">0% (Dono / Casa 100%)</span>
                            ) : (
                              <span className="font-black text-amber-700">
                                {comm.commission_rate}% (€ {comm.commission_amount.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer & Action Button */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total a Cobrar</span>
                          <span className="text-xl font-black text-zinc-900">
                            € {(appt.totalAmount || service.price).toFixed(2)}
                          </span>
                        </div>

                        {!isCompleted && !isCancelled && (
                          <button
                            onClick={() => handleOpenCheckout(appt)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                          >
                            <CreditCard size={15} />
                            Cobrar / Dar Baixa
                          </button>
                        )}

                        {isCompleted && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={16} />
                            Baixa Efetuada
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VENDA BALCÃO (WALK-IN) */}
        {activeTab === 'walkin' && (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#d4a338] block mb-1">
                Atendimento Rápido Sem Agendamento
              </span>
              <h2 className="text-2xl font-black text-zinc-900">Lançar Venda Avulsa de Balcão</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Atenda clientes que chegam direto na barbearia. O cálculo da comissão (55% Seg-Sáb ou 70% Dom) é gerado na hora!
              </p>
            </div>

            <form onSubmit={handleConfirmWalkIn} className="space-y-5">
              {/* Customer Info (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Nome do Cliente (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Mendes"
                    value={walkInForm.customerName}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Telefone / Telemóvel
                  </label>
                  <input
                    type="text"
                    placeholder="+351 9XX XXX XXX"
                    value={walkInForm.customerPhone}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
                  />
                </div>
              </div>

              {/* Service & Barber Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Serviço Realizado *
                  </label>
                  <select
                    required
                    value={walkInForm.serviceId}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — € {s.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Barbeiro que Atendeu *
                  </label>
                  <select
                    required
                    value={walkInForm.barberId}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, barberId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
                  >
                    {barbers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {isBarberOwner(b) ? '(Proprietário - Sem comissão)' : '(Barbeiro Contratado)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Commission Preview for selected service and barber */}
              {(() => {
                const selService = services.find(s => s.id === walkInForm.serviceId) || services[0];
                const selBarber = barbers.find(b => b.id === walkInForm.barberId) || barbers[0];
                if (!selService || !selBarber) return null;

                const isOwner = isBarberOwner(selBarber);
                const comm = calculateBarberCommission(selService.price, todayStr, selBarber);

                return (
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-zinc-900 block">
                        Cálculo de Comissão Automática ({comm.day_name})
                      </span>
                      <span className="text-zinc-500">
                        {isOwner ? 'Proprietário Roger: 100% da receita fica retida na casa.' : `Barbeiro contratado: ${comm.commission_rate}% sobre o serviço.`}
                      </span>
                    </div>
                    <div className="text-right font-black text-sm">
                      {isOwner ? (
                        <span className="text-emerald-700">€ 0.00 (Casa 100%)</span>
                      ) : (
                        <span className="text-amber-600">€ {comm.commission_amount.toFixed(2)} ({comm.commission_rate}%)</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Upsell Products Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Adicionar Produtos da Loja (Pomadas, Óleos, Ceras)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {products.slice(0, 4).map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setWalkInForm(prev => {
                          const existing = prev.selectedProducts.find(p => p.productId === prod.id);
                          if (existing) {
                            return {
                              ...prev,
                              selectedProducts: prev.selectedProducts.map(p => p.productId === prod.id ? { ...p, quantity: p.quantity + 1 } : p)
                            };
                          }
                          return {
                            ...prev,
                            selectedProducts: [...prev.selectedProducts, { productId: prod.id, name: prod.name, price: prod.price, quantity: 1 }]
                          };
                        });
                      }}
                      className="p-2.5 rounded-xl border border-zinc-200 hover:border-[#d4a338] bg-zinc-50 text-left transition-all"
                    >
                      <div className="font-bold text-xs text-zinc-900 truncate">{prod.name}</div>
                      <div className="text-[11px] font-black text-[#d4a338] mt-0.5">€ {prod.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>

                {walkInForm.selectedProducts.length > 0 && (
                  <div className="mt-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 space-y-1.5 text-xs">
                    <span className="font-bold text-zinc-900 block">Itens Adicionados:</span>
                    {walkInForm.selectedProducts.map(p => (
                      <div key={p.productId} className="flex justify-between items-center text-zinc-700">
                        <span>{p.quantity}x {p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">€ {(p.price * p.quantity).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => setWalkInForm(prev => ({
                              ...prev,
                              selectedProducts: prev.selectedProducts.filter(x => x.productId !== p.productId)
                            }))}
                            className="text-red-500 font-bold hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: '💵 Dinheiro' },
                    { id: 'multibanco', label: '💳 Multibanco' },
                    { id: 'mbway', label: '📱 MB WAY' },
                    { id: 'loyalty', label: '⭐ Fidelidade' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setWalkInForm(prev => ({ ...prev, paymentMethod: m.id as any }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        walkInForm.paymentMethod === m.id
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculation & Submit */}
              {(() => {
                const srv = services.find(s => s.id === walkInForm.serviceId);
                const srvPrice = srv ? srv.price : 15;
                const prodsPrice = walkInForm.selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
                const total = srvPrice + prodsPrice;

                return (
                  <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-zinc-400 block">Total a Pagar</span>
                      <span className="text-3xl font-black text-zinc-950">€ {total.toFixed(2)}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessingWalkIn}
                      className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      {isProcessingWalkIn ? 'Registrando...' : `Finalizar Venda Avulsa (€ ${total.toFixed(2)})`}
                    </button>
                  </div>
                );
              })()}
            </form>
          </div>
        )}

        {/* TAB 3: ESTOQUE DE PRODUTOS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Estoque & Produtos para Venda</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Gerencie pomadas, óleos e tônicos. O estoque é debitado automaticamente ao dar baixa na comanda.
                </p>
              </div>

              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="px-4 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus size={16} />
                + Cadastrar Novo Produto
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => {
                const isLowStock = prod.stock < 5;
                return (
                  <div
                    key={prod.id}
                    className={`bg-white p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      isLowStock ? 'border-amber-300 bg-amber-50/20' : 'border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-base text-zinc-900">{prod.name}</h4>
                        <span className="text-lg font-black text-[#d4a338]">€ {prod.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{prod.description}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">Estoque</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-base font-black ${isLowStock ? 'text-amber-600' : 'text-zinc-900'}`}>
                            {prod.stock} un.
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                              Baixo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick stock adjustment +/- */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateStock(prod, -1)}
                          className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 font-black text-sm flex items-center justify-center transition-colors"
                          title="Dar saída em 1 unidade"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleUpdateStock(prod, 1)}
                          className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm flex items-center justify-center transition-colors"
                          title="Dar entrada de 1 unidade"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: FECHAMENTO DE CAIXA DO TURNO */}
        {activeTab === 'cashRegister' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#d4a338] block mb-1">
                    Conferência do Turno
                  </span>
                  <h2 className="text-2xl font-black text-zinc-900">Fechamento do Caixa</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Data: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} | Operador: {user.name}
                  </p>
                </div>

                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer size={15} />
                  Imprimir Fechamento
                </button>
              </div>

              {/* Totalizador por Forma de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <span className="text-xs font-bold uppercase text-zinc-500 block">💵 Dinheiro Físico</span>
                  <div className="text-2xl font-black text-zinc-900 mt-1">
                    € {todayCashMetrics.cashTotal.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Conferir na gaveta</span>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <span className="text-xs font-bold uppercase text-zinc-500 block">📱 MB WAY</span>
                  <div className="text-2xl font-black text-zinc-900 mt-1">
                    € {todayCashMetrics.mbwayTotal.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Conta digital da loja</span>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <span className="text-xs font-bold uppercase text-zinc-500 block">💳 Multibanco (TPA)</span>
                  <div className="text-2xl font-black text-zinc-900 mt-1">
                    € {todayCashMetrics.cardTotal.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Comprovante de terminal</span>
                </div>
              </div>

              {/* Summary Balances */}
              <div className="bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-sm text-zinc-300">
                  <span>Total Bruto Entrado no Turno:</span>
                  <span className="font-bold text-white">€ {todayCashMetrics.totalIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-zinc-300">
                  <span>Total de Retiradas / Sangrias:</span>
                  <span className="font-bold text-red-400">- € {todayCashMetrics.withdrawalsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-zinc-300">
                  <span>Comissões Provisórias da Equipe (55% / 70%):</span>
                  <span className="font-bold text-amber-400">€ {todayCashMetrics.commissionsTotal.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-base">
                  <span className="font-black text-emerald-400">Saldo Líquido Retido em Caixa:</span>
                  <span className="text-2xl font-black text-emerald-400">
                    € {(todayCashMetrics.totalIncome - todayCashMetrics.withdrawalsTotal).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botão de Sangria Rápida */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsSangriaModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <ArrowDownCircle size={16} />
                  + Realizar Sangria de Caixa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHECKOUT / DAR BAIXA MODAL */}
      {checkoutAppt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Fechamento de Conta</span>
                <h3 className="text-xl font-black text-zinc-900">Cobrar & Dar Baixa no Atendimento</h3>
              </div>
              <button
                onClick={() => setCheckoutAppt(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Appointment Details */}
            {(() => {
              const srv = services.find(s => s.id === checkoutAppt.serviceId) || { name: 'Serviço', price: checkoutAppt.totalAmount || 15 };
              const barb = barbers.find(b => b.id === checkoutBarberId) || barbers.find(b => b.id === checkoutAppt.barberId);
              const isOwner = isBarberOwner(barb);
              const comm = calculateBarberCommission(srv.price, checkoutAppt.date, barb);
              const prodsTotal = checkoutSelectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
              const grandTotal = srv.price + prodsTotal;

              return (
                <div className="space-y-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Cliente:</span>
                      <strong className="text-zinc-900">{checkoutAppt.customerName || `Cliente #${checkoutAppt.customerId.slice(-4)}`}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Serviço:</span>
                      <strong className="text-zinc-900">{srv.name} (€ {srv.price.toFixed(2)})</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Barbeiro Executor:</span>
                      <select
                        value={checkoutBarberId}
                        onChange={(e) => setCheckoutBarberId(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900"
                      >
                        {barbers.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} {isBarberOwner(b) ? '(Dono)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Commission info */}
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs flex items-center justify-between text-amber-900">
                    <div>
                      <strong>Regra de Comissão:</strong> {comm.day_name}
                      <p className="text-[11px] text-amber-700">
                        {isOwner ? 'Proprietário Roger: 100% retido pela casa.' : `Barbeiro contratado recebe ${comm.commission_rate}%.`}
                      </p>
                    </div>
                    <div className="text-right font-black text-sm text-amber-900">
                      {isOwner ? '€ 0.00' : `€ ${comm.commission_amount.toFixed(2)}`}
                    </div>
                  </div>

                  {/* Upsell Products Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Adicionar Produto no Fechamento:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {products.slice(0, 4).map(prod => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleAddProductToCheckout(prod)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-[#d4a338] hover:text-zinc-950 text-xs font-bold rounded-xl transition-all"
                        >
                          + {prod.name} (€ {prod.price.toFixed(2)})
                        </button>
                      ))}
                    </div>

                    {checkoutSelectedProducts.length > 0 && (
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1 text-xs">
                        <span className="font-bold text-zinc-800 block">Produtos na Comanda:</span>
                        {checkoutSelectedProducts.map(p => (
                          <div key={p.productId} className="flex justify-between items-center text-zinc-700">
                            <span>{p.quantity}x {p.name} (€ {(p.price * p.quantity).toFixed(2)})</span>
                            <button
                              onClick={() => handleRemoveProductFromCheckout(p.productId)}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                      Forma de Pagamento:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'mbway', label: '📱 MB WAY' },
                        { id: 'multibanco', label: '💳 Multibanco' },
                        { id: 'cash', label: '💵 Dinheiro' },
                        { id: 'loyalty', label: '⭐ Fidelidade' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setCheckoutPaymentMethod(m.id as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            checkoutPaymentMethod === m.id
                              ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total & Action Button */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-bold text-zinc-400 block">Total a Cobrar</span>
                      <span className="text-2xl font-black text-zinc-950">€ {grandTotal.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={handleConfirmCheckout}
                      disabled={isProcessingCheckout}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      {isProcessingCheckout ? 'Processando...' : `Confirmar Recebimento (€ ${grandTotal.toFixed(2)})`}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* RECEIPT SUCCESS MODAL */}
      {receiptSuccessAppt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-zinc-900">Atendimento Concluído!</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Pagamento registrado e comissão calculada com sucesso no caixa.
              </p>
            </div>

            {/* Printable Receipt Box */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-left text-xs space-y-2">
              <div className="flex justify-between font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                <span>{activeShop.name}</span>
                <span>#{receiptSuccessAppt.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Data & Hora:</span>
                <span>{receiptSuccessAppt.date} às {receiptSuccessAppt.time}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Forma de Pagamento:</span>
                <span className="uppercase font-bold">{receiptSuccessAppt.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Comissão Profissional ({receiptSuccessAppt.commission_rate}%):</span>
                <span className="font-bold text-amber-700">€ {(receiptSuccessAppt.commission_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-zinc-900 border-t border-zinc-200 pt-2">
                <span>TOTAL PAGO:</span>
                <span className="text-emerald-600">€ {(receiptSuccessAppt.totalAmount || 15).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer size={15} />
                Imprimir Recibo
              </button>
              <button
                onClick={() => setReceiptSuccessAppt(null)}
                className="flex-1 py-3 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 text-xs font-black rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PRODUCT MODAL */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-black text-zinc-900">Cadastrar Novo Produto</h3>
              <button onClick={() => setIsNewProductModalOpen(false)}>
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Nome do Produto</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Pomada Efeito Seco"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Fixação forte com acabamento fosco natural"
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Preço (€)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Qtd. Estoque</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-bold rounded-xl text-sm transition-colors mt-2"
              >
                Salvar Produto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SANGRIA / WITHDRAWAL MODAL */}
      {isSangriaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-black text-zinc-900">Lançar Sangria de Caixa</h3>
              <button onClick={() => setIsSangriaModalOpen(false)}>
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleRegisterSangria} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Valor da Retirada (€) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={sangriaForm.amount}
                  onChange={(e) => setSangriaForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-black"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Motivo / Descrição *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Compra de insumos urgentes / Depósito em banco"
                  value={sangriaForm.description}
                  onChange={(e) => setSangriaForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-colors mt-2"
              >
                Confirmar Sangria
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
