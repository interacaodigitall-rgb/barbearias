import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { appointmentService } from '../services/appointmentService';
import { firestoreService } from '../services/firestoreService';
import { saasService } from '../services/saasService';
import { Appointment, Service, Barber, User } from '../models';
import { Calendar, Clock, Scissors, CheckCircle, XCircle, DollarSign, Phone, Mail, User as UserIcon, Shield, TrendingUp, Edit2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BarberDashboard() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [customers, setCustomers] = useState<Record<string, User>>({});
  const [barberProfile, setBarberProfile] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCancellations, setNewCancellations] = useState<Appointment[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Profile Edit State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    photoUrl: '',
    bio: '',
    phone: ''
  });

  const handleOpenEditProfile = () => {
    setProfileForm({
      name: barberProfile?.name || user?.name || '',
      photoUrl: barberProfile?.photoUrl || '',
      bio: barberProfile?.bio || '',
      phone: user?.phone || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberProfile) return;
    try {
      await firestoreService.updateBarber(barberProfile.id, {
        name: profileForm.name,
        photoUrl: profileForm.photoUrl,
        bio: profileForm.bio
      });

      if (user?.uid) {
        await saasService.updateTenantAccount(user.uid, {
          name: profileForm.name,
          phone: profileForm.phone
        });
      }

      setBarberProfile(prev => prev ? {
        ...prev,
        name: profileForm.name,
        photoUrl: profileForm.photoUrl,
        bio: profileForm.bio
      } : null);

      setIsEditProfileOpen(false);
      alert('Seu perfil foi atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar seu perfil.');
    }
  };

  const activeShop = saasService.getActiveBarbershop();

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

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const [appts, sList, bList, uList] = await Promise.all([
        appointmentService.getAllAppointments(),
        firestoreService.getServices(),
        firestoreService.getBarbers(),
        firestoreService.getUsers()
      ]);
      
      const sMap = sList.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
      const uMap = uList.reduce((acc, u) => ({ ...acc, [u.uid]: u }), {});
      
      // Match barber profile strictly to this authenticated barber user
      const profile = bList.find(b => 
        (user.barberId && b.id === user.barberId) ||
        b.id === user.uid ||
        (user.name && b.name.toLowerCase() === user.name.toLowerCase()) ||
        (user.email && b.name && user.email.toLowerCase().includes(b.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) ||
        (user.uid === 'demo-barber' && (b.id === 'b1' || b.id === 'b-rogerx-roger'))
      ) || bList[0];

      setBarberProfile(profile || null);

      // Target barber ID for strict individual isolation
      const targetBarberId = profile?.id || user.barberId || user.uid;

      // Filter appointments ESTRITAMENTE for this barber
      const barberAppts = appts.filter(a => 
        a.barberId === targetBarberId || 
        (user.barberId && a.barberId === user.barberId) ||
        (user.uid === 'demo-barber' && (a.barberId === 'b1' || a.barberId === 'b-rogerx-roger'))
      );
      
      // Check for recent cancellations
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recentCancellations = barberAppts.filter(a => a.status === 'cancelled' && a.createdAt > tenMinutesAgo);
      setNewCancellations(recentCancellations);

      setServices(sMap);
      setCustomers(uMap);
      setAppointments(barberAppts);
      setLoading(false);
    }
    loadData();
  }, [user]);

  const handleStatusUpdate = async (id: string, status: Appointment['status'], customerId: string) => {
    await appointmentService.updateAppointmentStatus(id, status, customerId);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const commissionPercent = barberProfile?.compensationValue || (user as any)?.commissionPercent || 50;

  const completedAppts = appointments.filter(a => a.status === 'completed');
  const completedRevenue = completedAppts.reduce((sum, appt) => {
    const service = services[appt.serviceId];
    return sum + (service?.price || 0);
  }, 0);

  const calculateEarnings = () => {
    if (barberProfile?.compensationType === 'salary') {
      return barberProfile.compensationValue;
    }
    return (completedRevenue * commissionPercent) / 100;
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-zinc-500 font-medium">
        Carregando sua agenda individual...
      </div>
    );
  }

  const barberDisplayName = barberProfile?.name || user?.name || 'Barbeiro Profissional';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Cancellation Notifications */}
      {newCancellations.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {newCancellations.map(c => (
            <div key={c.id} className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-300">
              <XCircle size={20} className="shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm">Agendamento Cancelado!</p>
                <p className="text-xs opacity-90">Um cliente cancelou o horário de {c.time} em {c.date}.</p>
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

      {/* Individual Barber Header Card */}
      <div className="bg-zinc-950 text-white p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#d4a338]/20 border border-[#d4a338]/30 flex items-center justify-center overflow-hidden shrink-0">
            {barberProfile?.photoUrl ? (
              <img src={barberProfile.photoUrl} alt={barberDisplayName} className="w-full h-full object-cover" />
            ) : (
              <Scissors size={28} className="text-[#d4a338]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4a338] text-zinc-950">
                Barbeiro Oficial
              </span>
              <span className="text-xs text-zinc-400">@{activeShop.name}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{barberDisplayName}</h2>
            <p className="text-xs text-zinc-400">
              Painel Individual • Acesso restrito e exclusivo à sua agenda de atendimentos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenEditProfile}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Edit2 size={15} />
            Editar Meu Perfil
          </button>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400">Taxa de Comissão</p>
              <p className="text-lg font-bold text-[#d4a338]">{commissionPercent}% <span className="text-xs font-normal text-zinc-400">por corte</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ganhos em Comissões</span>
            <h3 className="text-3xl font-black text-zinc-950 mt-1">€{calculateEarnings().toFixed(2)}</h3>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center gap-1">
            <CheckCircle size={13} />
            {barberProfile?.compensationType === 'salary' 
              ? 'Salário fixo acordado' 
              : `${commissionPercent}% sobre cortes concluídos`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cortes Concluídos</span>
            <h3 className="text-3xl font-black text-zinc-950 mt-1">{completedAppts.length}</h3>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Faturamento bruto gerado: <strong>€{completedRevenue.toFixed(2)}</strong>
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Agendamentos na Agenda</span>
            <h3 className="text-3xl font-black text-zinc-950 mt-1">{appointments.length}</h3>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Pendentes / Confirmados: <strong>{appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length}</strong>
          </p>
        </div>
      </div>

      {/* Appointments List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900">Sua Agenda de Atendimentos</h3>
            <p className="text-xs text-zinc-500">Exibindo exclusivamente clientes agendados com você.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-zinc-200 text-zinc-900 bg-white placeholder:text-zinc-400">
            {appointments.length} {appointments.length === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                <Calendar size={32} />
              </div>
              <h4 className="text-base font-bold text-zinc-900">Nenhum agendamento marcado</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Você ainda não possui atendimentos na sua agenda. Assim que um cliente selecionar seu perfil na barbearia, ele aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            appointments.map((appt) => {
              const service = services[appt.serviceId];
              const customer = customers[appt.customerId];
              const servicePrice = service?.price || 0;
              const cutCommission = (servicePrice * commissionPercent) / 100;

              return (
                <div key={appt.id} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-200 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="bg-zinc-950 text-white p-3 md:p-4 rounded-2xl text-center min-w-[70px] md:min-w-[80px] shadow-sm">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#d4a338]">
                        {format(new Date(appt.date), 'EEE', { locale: ptBR })}
                      </span>
                      <span className="block text-lg md:text-xl font-bold">
                        {appt.time}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-900 text-sm md:text-base">{service?.name || 'Corte'}</h4>
                        <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                          €{servicePrice.toFixed(2)}
                        </span>
                      </div>
                      {customer ? (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs font-semibold text-zinc-800">{customer.name}</p>
                          <p className="text-[11px] text-zinc-500 flex items-center"><Phone size={11} className="mr-1" /> {customer.phone || 'Sem telefone'}</p>
                          <p className="text-[11px] text-zinc-500 flex items-center"><Mail size={11} className="mr-1" /> {customer.email}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-1">Cliente ID: {appt.customerId.slice(0, 8)}</p>
                      )}
                      
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <span>Sua comissão:</span>
                        <strong className="text-amber-950">€{cutCommission.toFixed(2)}</strong>
                        <span className="text-amber-700 font-normal">({commissionPercent}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                    <div className="text-left md:text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        appt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {appt.status === 'completed' ? 'Concluído' :
                         appt.status === 'cancelled' ? 'Cancelado' :
                         appt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </span>
                      {appt.status === 'cancelled' && appt.cancellationReason && (
                        <p className="text-[10px] text-red-500 mt-1 italic max-w-[140px] truncate" title={appt.cancellationReason}>
                          Motivo: {appt.cancellationReason}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {appt.status === 'confirmed' && (
                        <button 
                          onClick={() => handleStatusUpdate(appt.id, 'completed', appt.customerId)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="Concluir Atendimento"
                        >
                          <CheckCircle size={15} />
                          Concluir
                        </button>
                      )}
                      {appt.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(appt.id, 'confirmed', appt.customerId)}
                          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="Confirmar"
                        >
                          <CheckCircle size={15} />
                          Confirmar
                        </button>
                      )}
                      {(appt.status === 'pending' || appt.status === 'confirmed') && (
                        <button 
                          onClick={() => setCancellingId(appt.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                          title="Cancelar Atendimento"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancellingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Cancelar Atendimento</h3>
            <p className="text-xs text-zinc-500 mb-4">Por favor, informe o motivo do cancelamento para o cliente.</p>
            
            <textarea
              className="w-full h-28 p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 outline-none resize-none mb-4 text-zinc-900 bg-white placeholder:text-zinc-400"
              placeholder="Ex: Imprevisto com horário, cliente remarcou..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-zinc-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Editar Meu Perfil de Barbeiro</h3>
                <p className="text-xs text-zinc-500">Atualize suas informações visíveis para os clientes no agendamento.</p>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="w-16 h-16 rounded-2xl bg-zinc-200 border border-zinc-300 overflow-hidden shrink-0 flex items-center justify-center font-bold text-zinc-500 text-sm">
                  {profileForm.photoUrl ? (
                    <img src={profileForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    profileForm.name.slice(0, 2).toUpperCase() || 'Foto'
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">URL da Foto de Perfil</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    value={profileForm.photoUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Nome Profissional</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Especialidade / Biografia Curta</label>
                <input
                  type="text"
                  placeholder="Ex: Especialista em Degradê Navalhado e Barba Terapia"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Telefone de Contato</label>
                <input
                  type="text"
                  placeholder="+351 912 345 678"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
