import React, { useEffect, useState } from 'react';
import { appointmentService } from '../services/appointmentService';
import { firestoreService } from '../services/firestoreService';
import { loyaltyService } from '../services/loyaltyService';
import { productService } from '../services/productService';
import { saasService } from '../services/saasService';
import { Appointment, Service, Barber, User, BlockedTime, Product } from '../models';
import CashFlowDashboard from '../components/CashFlowDashboard';
import { 
  Users, Calendar, TrendingUp, CheckCircle, XCircle, Clock, Scissors, 
  User as UserIcon, Plus, Trash2, Edit2, Save, Award, Phone, Mail, 
  DollarSign, Package, VolumeX, ShoppingBag, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Record<string, User>>({});
  const [loyaltyPoints, setLoyaltyPoints] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cashFlow' | 'appointments' | 'products' | 'services' | 'barbers' | 'loyalty' | 'blockedTimes'>('cashFlow');
  const [newCancellations, setNewCancellations] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);

  // Product form state
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 15,
    category: 'styling',
    stock: 20,
    isActive: true
  });

  // Form states
  const [editingService, setEditingService] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<Omit<Service, 'id'>>({ name: '', description: '', price: 0, durationMinutes: 30, isActive: true });
  
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [barberForm, setBarberForm] = useState<Omit<Barber, 'id'>>({ name: '', bio: '', rating: 5, isActive: true, branch: 'PT', compensationType: 'percentage', compensationValue: 50 });

  const [blockedTimeForm, setBlockedTimeForm] = useState<Omit<BlockedTime, 'id' | 'createdAt'>>({ barberId: 'all', date: '', startTime: '', endTime: '', reason: '' });

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    if (!cancellingId || !cancelReason.trim()) return;
    try {
      await appointmentService.cancelAppointment(cancellingId, cancelReason);
      setAppointments(prev => prev.map(a => a.id === cancellingId ? { ...a, status: 'cancelled', cancellationReason: cancelReason } : a));
      setCancellingId(null);
      setCancelReason('');
    } catch (err) {
      alert('Erro ao cancelar agendamento');
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    // Seed database if empty (only runs if collections are empty)
    await firestoreService.seedDatabase();

    const [appts, sList, bList, lPoints, uList, bTimes, pList] = await Promise.all([
      appointmentService.getAllAppointments(),
      firestoreService.getServices(),
      firestoreService.getBarbers(),
      loyaltyService.getAllLoyaltyPoints(),
      firestoreService.getUsers(),
      firestoreService.getBlockedTimes(),
      productService.getProducts()
    ]);
    
    const uMap = uList.reduce((acc, u) => ({ ...acc, [u.uid]: u }), {});

    setServices(sList);
    setBarbers(bList);
    setProducts(pList);
    setCustomers(uMap);
    setAppointments(appts);
    setLoyaltyPoints(lPoints);
    setBlockedTimes(bTimes);

    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentCancellations = appts.filter(a => a.status === 'cancelled' && a.createdAt > tenMinutesAgo);
    setNewCancellations(recentCancellations);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, status: Appointment['status'], customerId: string) => {
    await appointmentService.updateAppointmentStatus(id, status, customerId);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  // Product CRUD
  const handleAddProduct = async () => {
    await productService.addProduct(productForm);
    setProductForm({ name: '', description: '', price: 15, category: 'styling', stock: 20, isActive: true });
    loadData();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    await productService.updateProduct(editingProduct, productForm);
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: 15, category: 'styling', stock: 20, isActive: true });
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      await productService.deleteProduct(id);
      loadData();
    }
  };

  // Service CRUD
  const handleAddService = async () => {
    await firestoreService.addService(serviceForm);
    setServiceForm({ name: '', description: '', price: 0, durationMinutes: 30, isActive: true });
    loadData();
  };

  const handleUpdateService = async (id: string) => {
    await firestoreService.updateService(id, serviceForm);
    setEditingService(null);
    setServiceForm({ name: '', description: '', price: 0, durationMinutes: 30, isActive: true });
    loadData();
  };

  const handleToggleServiceActive = async (id: string, currentStatus: boolean | undefined) => {
    const newStatus = currentStatus === undefined ? false : !currentStatus;
    await firestoreService.updateService(id, { isActive: newStatus });
    loadData();
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      await firestoreService.deleteService(id);
      loadData();
    }
  };

  // Barber CRUD
  const handleAddBarber = async () => {
    await firestoreService.addBarber(barberForm);
    setBarberForm({ name: '', bio: '', rating: 5, isActive: true, branch: 'PT', compensationType: 'percentage', compensationValue: 50 });
    loadData();
  };

  const handleUpdateBarber = async (id: string) => {
    await firestoreService.updateBarber(id, barberForm);
    setEditingBarber(null);
    loadData();
  };

  const handleDeleteBarber = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este barbeiro?')) {
      await firestoreService.deleteBarber(id);
      loadData();
    }
  };

  // Blocked Times CRUD
  const handleAddBlockedTime = async () => {
    if (!blockedTimeForm.date || !blockedTimeForm.startTime || !blockedTimeForm.endTime || !blockedTimeForm.reason) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    await firestoreService.addBlockedTime({
      ...blockedTimeForm,
      createdAt: Date.now()
    });
    setBlockedTimeForm({ barberId: 'all', date: '', startTime: '', endTime: '', reason: '' });
    loadData();
  };

  const handleDeleteBlockedTime = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este bloqueio?')) {
      await firestoreService.deleteBlockedTime(id);
      loadData();
    }
  };

  const totalEarnings = appointments
    .filter(a => a.status === 'completed')
    .reduce((acc, a) => acc + (services.find(s => s.id === a.serviceId)?.price || 0), 0);

  const serviceCounts = appointments.reduce((acc, a) => {
    acc[a.serviceId] = (acc[a.serviceId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostSoldServiceId = (Object.entries(serviceCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostSoldService = services.find(s => s.id === mostSoldServiceId);

  const stats = [
    { label: 'Ganhos Totais', value: `€${totalEarnings.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Mais Vendido', value: mostSoldService?.name || 'N/A', icon: Scissors, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Agendamentos', value: appointments.length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Concluídos', value: appointments.filter(a => a.status === 'completed').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  if (loading && appointments.length === 0) return <div className="flex justify-center items-center h-full">Carregando Painel...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Cancellation Notifications */}
      {newCancellations.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {newCancellations.map(c => (
            <div key={c.id} className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-300">
              <XCircle size={20} className="shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm">Agendamento Cancelado!</p>
                <p className="text-xs opacity-90">O cliente cancelou o horário de {c.time} em {c.date}.</p>
                {c.cancellationReason && (
                  <p className="text-[10px] mt-1 italic bg-red-600/30 p-1 rounded">Motivo: {c.cancellationReason}</p>
                )}
                <button 
                  onClick={() => setNewCancellations(prev => prev.filter(x => x.id !== c.id))}
                  className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded hover:bg-white/30"
                >
                  Entendido
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Painel de Gestão da Barbearia</h2>
          <p className="text-zinc-500">Fluxo de caixa em tempo real, comissões dos barbeiros e controle de agendamentos.</p>
        </div>
        <div className="flex bg-white border border-zinc-200 p-1 rounded-2xl shadow-sm overflow-x-auto max-w-full gap-1">
          <button 
            onClick={() => setActiveTab('cashFlow')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'cashFlow' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <Wallet size={16} />
            Fluxo de Caixa
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'appointments' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Agendamentos
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'products' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <Package size={16} />
            Produtos (Upsell)
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'services' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Serviços
          </button>
          <button 
            onClick={() => setActiveTab('barbers')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'barbers' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Barbeiros
          </button>
          <button 
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'loyalty' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Fidelidade
          </button>
          <button 
            onClick={() => setActiveTab('blockedTimes')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'blockedTimes' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Bloqueios
          </button>
        </div>
      </div>

      {activeTab === 'cashFlow' && (
        <CashFlowDashboard barbers={barbers} barbershopName="MISTER NAVALHA" />
      )}

      {activeTab === 'appointments' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className={`p-2 md:p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                      <Icon size={20} className="md:w-6 md:h-6" />
                    </div>
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-sm md:text-3xl font-bold text-zinc-900 mt-1 truncate" title={stat.value.toString()}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">Todos os Agendamentos</h3>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Cliente / Serviço</th>
                    <th className="px-6 py-4">Profissional</th>
                    <th className="px-6 py-4">Unidade</th>
                    <th className="px-6 py-4">Data & Hora</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {appointments.map((appt) => {
                    const service = services.find(s => s.id === appt.serviceId);
                    const barber = barbers.find(b => b.id === appt.barberId);
                    const customer = customers[appt.customerId];
                    
                    return (
                      <tr key={appt.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                              <Scissors size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 text-sm">{service?.name || 'Serviço'}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {appt.quietService && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    🤫 Quiet Service
                                  </span>
                                )}
                                {appt.selectedProducts && appt.selectedProducts.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                    🛍️ {appt.selectedProducts.length} produto(s)
                                  </span>
                                )}
                              </div>
                              {customer ? (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-xs font-medium text-zinc-700">{customer.name}</p>
                                  <p className="text-[10px] text-zinc-500 flex items-center"><Phone size={10} className="mr-1" /> {customer.phone}</p>
                                  <p className="text-[10px] text-zinc-500 flex items-center"><Mail size={10} className="mr-1" /> {customer.email}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400">ID: {appt.customerId.slice(0, 8)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden">
                              {barber?.photoUrl ? <img src={barber.photoUrl} className="w-full h-full object-cover" /> : <UserIcon size={12} className="text-zinc-400" />}
                            </div>
                            <p className="text-sm font-medium text-zinc-700">{barber?.name || 'Profissional'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                            {appt.branch === 'PT' ? '🇵🇹 PT' : appt.branch === 'ES' ? '🇪🇸 ES' : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-zinc-900 font-bold">{format(new Date(appt.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          <p className="text-xs text-zinc-500 flex items-center"><Clock size={10} className="mr-1" /> {appt.time}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                            appt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                            appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                            appt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                          }`}>
                            {appt.status}
                          </span>
                          {appt.status === 'cancelled' && appt.cancellationReason && (
                            <p className="text-[10px] text-red-400 mt-1 italic max-w-[150px] truncate" title={appt.cancellationReason}>
                              Motivo: {appt.cancellationReason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-zinc-900">€{service?.price?.toFixed(2) || '0.00'}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {appt.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusUpdate(appt.id, 'confirmed', appt.customerId)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {(appt.status === 'pending' || appt.status === 'confirmed') && (
                              <button 
                                onClick={() => handleStatusUpdate(appt.id, 'completed', appt.customerId)}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                              <button 
                                onClick={() => setCancellingId(appt.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Desmarcar"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Appointments View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {appointments.map((appt) => {
                const service = services.find(s => s.id === appt.serviceId);
                const barber = barbers.find(b => b.id === appt.barberId);
                return (
                  <div key={appt.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-zinc-900">{service?.name || 'Serviço'}</p>
                        <p className="text-xs text-zinc-400">Cliente: {appt.customerId.slice(0, 8)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        appt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                        appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                        appt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden">
                          {barber?.photoUrl ? <img src={barber.photoUrl} className="w-full h-full object-cover" /> : <UserIcon size={10} className="text-zinc-400" />}
                        </div>
                        <span className="text-zinc-600">{barber?.name || 'Profissional'}</span>
                      </div>
                      <p className="font-bold text-zinc-900">€{service?.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-zinc-500 flex items-center">
                        <Calendar size={12} className="mr-1" /> {format(new Date(appt.date), 'dd/MM/yy')}
                        <Clock size={12} className="ml-2 mr-1" /> {appt.time}
                      </div>
                      <div className="flex space-x-2">
                        {appt.status === 'pending' && (
                          <button onClick={() => handleStatusUpdate(appt.id, 'confirmed', appt.customerId)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <button onClick={() => handleStatusUpdate(appt.id, 'completed', appt.customerId)} className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button onClick={() => setCancellingId(appt.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Cancellation Modal */}
      {cancellingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Cancelar Agendamento</h3>
            <p className="text-zinc-500 mb-6">Por favor, informe o motivo do cancelamento.</p>
            
            <textarea
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none resize-none mb-6"
              placeholder="Motivo do cancelamento..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            
            <div className="flex gap-4">
              <button
                onClick={() => setCancellingId(null)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                placeholder="Nome do serviço" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={serviceForm.name}
                onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Descrição" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={serviceForm.description}
                onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
              <input 
                type="number" 
                placeholder="Preço (€)" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Duração (min)" 
                  className="flex-1 p-3 rounded-xl border border-zinc-200 text-sm"
                  value={serviceForm.durationMinutes}
                  onChange={e => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                />
                {editingService ? (
                  <button onClick={() => handleUpdateService(editingService)} className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800">
                    <Save size={20} />
                  </button>
                ) : (
                  <button onClick={handleAddService} className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div key={service.id} className={`bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between transition-opacity ${service.isActive === false ? 'opacity-60' : ''}`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-900">{service.name}</h4>
                      {service.isActive === false && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Inativo</span>
                      )}
                    </div>
                    <span className="text-zinc-900 font-bold">€{service.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-4">{service.description}</p>
                  <div className="flex items-center text-xs text-zinc-400 font-medium">
                    <Clock size={14} className="mr-1" />
                    {service.durationMinutes} min
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-50">
                  <button
                    onClick={() => handleToggleServiceActive(service.id, service.isActive)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      service.isActive === false 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {service.isActive === false ? 'Ativar' : 'Inativar'}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingService(service.id);
                        setServiceForm({ name: service.name, description: service.description, price: service.price, durationMinutes: service.durationMinutes, isActive: service.isActive !== false });
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDeleteService(service.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'barbers' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">{editingBarber ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Nome do barbeiro" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={barberForm.name}
                onChange={e => setBarberForm({ ...barberForm, name: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Bio / Especialidade" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={barberForm.bio}
                onChange={e => setBarberForm({ ...barberForm, bio: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="URL da Foto (opcional)" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={barberForm.photoUrl || ''}
                onChange={e => setBarberForm({ ...barberForm, photoUrl: e.target.value })}
              />
              <select 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={barberForm.branch}
                onChange={e => setBarberForm({ ...barberForm, branch: e.target.value as 'PT' | 'ES' | 'BOTH' })}
              >
                <option value="PT">Portugal</option>
                <option value="ES">Espanha</option>
                <option value="BOTH">Ambas (PT e ES)</option>
              </select>
              <select 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={barberForm.compensationType}
                onChange={e => setBarberForm({ ...barberForm, compensationType: e.target.value as 'salary' | 'percentage' })}
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="salary">Salário Fixo (€)</option>
              </select>
              <input 
                type="number" 
                placeholder={barberForm.compensationType === 'percentage' ? 'Porcentagem (%)' : 'Salário (€)'} 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={barberForm.compensationValue || ''}
                onChange={e => setBarberForm({ ...barberForm, compensationValue: Number(e.target.value) })}
              />
              <div className="flex gap-2">
                <select 
                  className="flex-1 p-3 rounded-xl border border-zinc-200 text-sm"
                  value={barberForm.isActive ? 'true' : 'false'}
                  onChange={e => setBarberForm({ ...barberForm, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
                {editingBarber ? (
                  <button onClick={() => handleUpdateBarber(editingBarber)} className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800">
                    <Save size={20} />
                  </button>
                ) : (
                  <button onClick={handleAddBarber} className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map(barber => (
              <div key={barber.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    {barber.photoUrl ? <img src={barber.photoUrl} className="w-full h-full object-cover" /> : <UserIcon size={32} className="text-zinc-300" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{barber.name}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${barber.isActive ? 'text-green-500' : 'text-red-500'}`}>
                      {barber.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 mb-4 space-y-1">
                  <p><strong>Unidade:</strong> {barber.branch === 'PT' ? 'Portugal' : barber.branch === 'ES' ? 'Espanha' : 'Ambas'}</p>
                  <p><strong>Comissão:</strong> {barber.compensationType === 'percentage' ? `${barber.compensationValue}%` : `€${barber.compensationValue}`}</p>
                </div>
                <p className="text-sm text-zinc-500 mb-6">{barber.bio}</p>
                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-50">
                  <button 
                    onClick={() => {
                      setEditingBarber(barber.id);
                      setBarberForm({ 
                        name: barber.name, 
                        bio: barber.bio, 
                        rating: barber.rating, 
                        isActive: barber.isActive,
                        branch: barber.branch || 'PT',
                        compensationType: barber.compensationType || 'percentage',
                        compensationValue: barber.compensationValue || 50,
                        photoUrl: barber.photoUrl || ''
                      });
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteBarber(barber.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">Acompanhamento de Fidelidade</h3>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Cliente (ID)</th>
                    <th className="px-6 py-4">Pontos Atuais</th>
                    <th className="px-6 py-4">Próxima Recompensa</th>
                    <th className="px-6 py-4">Progresso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(Object.entries(loyaltyPoints) as [string, number][]).map(([customerId, points]) => {
                    const rewards = [
                      { points: 50, title: 'Desconto 10%' },
                      { points: 100, title: 'Corte Grátis' },
                      { points: 150, title: 'Combo VIP' },
                    ];
                    
                    const nextReward = rewards.find(r => r.points > points) || rewards[rewards.length - 1];
                    const isMaxed = points >= rewards[rewards.length - 1].points;
                    const progress = Math.min((points / nextReward.points) * 100, 100);
                    
                    return (
                      <tr key={customerId} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                              <UserIcon size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 text-sm">{customerId.slice(0, 12)}...</p>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">ID Único</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Award size={16} className="text-yellow-500" />
                            <span className="text-lg font-bold text-zinc-900">{points}</span>
                            <span className="text-xs text-zinc-400 font-medium">pts</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isMaxed ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Todas liberadas!</span>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{nextReward.title}</p>
                              <p className="text-[10px] text-zinc-500">Faltam {nextReward.points - points} pts</p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1">
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${isMaxed ? 'bg-emerald-500' : 'bg-zinc-900'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {Object.keys(loyaltyPoints).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">
                        Nenhum cliente com pontos de fidelidade ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Loyalty View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {(Object.entries(loyaltyPoints) as [string, number][]).map(([customerId, points]) => {
                const rewards = [
                  { points: 50, title: 'Desconto 10%' },
                  { points: 100, title: 'Corte Grátis' },
                  { points: 150, title: 'Combo VIP' },
                ];
                const nextReward = rewards.find(r => r.points > points) || rewards[rewards.length - 1];
                const isMaxed = points >= rewards[rewards.length - 1].points;
                const progress = Math.min((points / nextReward.points) * 100, 100);

                return (
                  <div key={customerId} className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <UserIcon size={14} className="text-zinc-400" />
                        <span className="text-sm font-bold text-zinc-900">{customerId.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award size={14} className="text-yellow-500" />
                        <span className="text-sm font-bold">{points} pts</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Próxima: {nextReward.title}</span>
                      <span className="text-zinc-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${isMaxed ? 'bg-emerald-500' : 'bg-zinc-900'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'blockedTimes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Adicionar Bloqueio de Horário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <select 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={blockedTimeForm.barberId}
                onChange={e => setBlockedTimeForm({ ...blockedTimeForm, barberId: e.target.value })}
              >
                <option value="all">Todos os Barbeiros (Barbearia Fechada)</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input 
                type="date" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={blockedTimeForm.date}
                onChange={e => setBlockedTimeForm({ ...blockedTimeForm, date: e.target.value })}
              />
              <input 
                type="time" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={blockedTimeForm.startTime}
                onChange={e => setBlockedTimeForm({ ...blockedTimeForm, startTime: e.target.value })}
              />
              <input 
                type="time" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={blockedTimeForm.endTime}
                onChange={e => setBlockedTimeForm({ ...blockedTimeForm, endTime: e.target.value })}
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Motivo (ex: Almoço)" 
                  className="flex-1 p-3 rounded-xl border border-zinc-200 text-sm"
                  value={blockedTimeForm.reason}
                  onChange={e => setBlockedTimeForm({ ...blockedTimeForm, reason: e.target.value })}
                />
                <button onClick={handleAddBlockedTime} className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">Horários Bloqueados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Barbeiro</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Horário</th>
                    <th className="px-6 py-4">Motivo</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {blockedTimes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(bt => {
                    const barber = barbers.find(b => b.id === bt.barberId);
                    return (
                      <tr key={bt.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          {bt.barberId === 'all' ? 'Todos (Barbearia)' : barber?.name || 'Desconhecido'}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          {format(new Date(bt.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          {bt.startTime} - {bt.endTime}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          {bt.reason}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteBlockedTime(bt.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {blockedTimes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                        Nenhum bloqueio cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS (UPSELL) TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Produto para Upsell'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Estes produtos serão recomendados ao cliente na tela de agendamento (Passo 4).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Nome do produto (ex: Pomada Efeito Matte)" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Descrição rápida (ex: Fixação forte e sem brilho)" 
                className="p-3 rounded-xl border border-zinc-200 text-sm"
                value={productForm.description}
                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  placeholder="Preço (€)" 
                  className="p-3 rounded-xl border border-zinc-200 text-sm"
                  value={productForm.price || ''}
                  onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                />
                <input 
                  type="number" 
                  placeholder="Estoque" 
                  className="p-3 rounded-xl border border-zinc-200 text-sm"
                  value={productForm.stock || ''}
                  onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {editingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', description: '', price: 15, category: 'styling', stock: 20, isActive: true });
                  }}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                disabled={!productForm.name || !productForm.price}
                className="px-6 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {editingProduct ? 'Salvar Alterações' : '+ Adicionar ao Catálogo'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">Catálogo de Produtos em Linha</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Preço</th>
                    <th className="px-6 py-4">Estoque</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-[#d4a338] flex items-center justify-center font-bold">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-sm">{p.name}</p>
                            <p className="text-xs text-zinc-400">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">
                        {p.price.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {p.stock} unid.
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          p.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {p.isActive !== false ? 'Ativo na Loja' : 'Pausado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingProduct(p.id);
                              setProductForm({
                                name: p.name,
                                description: p.description,
                                price: p.price,
                                category: p.category,
                                stock: p.stock,
                                isActive: p.isActive
                              });
                            }}
                            className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                        Nenhum produto cadastrado no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
