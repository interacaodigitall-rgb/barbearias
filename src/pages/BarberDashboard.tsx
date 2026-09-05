import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { appointmentService } from '../services/appointmentService';
import { firestoreService } from '../services/firestoreService';
import { Appointment, Service, Barber, User } from '../models';
import { Calendar, Clock, Scissors, CheckCircle, XCircle, DollarSign, Phone, Mail } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine');
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
      
      // Find barber profile
      const profile = bList.find(b => b.id === user.uid || (user.uid === 'demo-barber' && b.id === 'b1'));
      setBarberProfile(profile || null);

      // Filter appointments for this barber
      const barberAppts = appts.filter(a => a.barberId === user.uid || (user.uid === 'demo-barber' && a.barberId === 'b1'));
      
      // Check for recent cancellations
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recentCancellations = (viewMode === 'all' ? appts : barberAppts).filter(a => a.status === 'cancelled' && a.createdAt > tenMinutesAgo);
      setNewCancellations(recentCancellations);

      setServices(sMap);
      setCustomers(uMap);
      setAppointments(viewMode === 'all' ? appts : barberAppts);
      setLoading(false);
    }
    loadData();
  }, [user, viewMode]);

  const handleStatusUpdate = async (id: string, status: Appointment['status'], customerId: string) => {
    await appointmentService.updateAppointmentStatus(id, status, customerId);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const calculateEarnings = () => {
    if (!barberProfile) return 0;
    
    if (barberProfile.compensationType === 'salary') {
      return barberProfile.compensationValue;
    }

    // Calculate percentage based on completed appointments
    const completedAppts = appointments.filter(a => a.status === 'completed' && (a.barberId === user?.uid || (user?.uid === 'demo-barber' && a.barberId === 'b1')));
    const totalRevenue = completedAppts.reduce((sum, appt) => {
      const service = services[appt.serviceId];
      return sum + (service?.price || 0);
    }, 0);

    return (totalRevenue * barberProfile.compensationValue) / 100;
  };

  if (loading && appointments.length === 0) return <div className="flex justify-center items-center h-full">Carregando Agenda...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

      {/* Earnings Summary */}
      {barberProfile && (
        <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">
              {barberProfile.compensationType === 'salary' ? 'Salário Fixo' : 'Ganhos (Comissão)'}
            </p>
            <h3 className="text-3xl font-bold tracking-tight">€{calculateEarnings().toFixed(2)}</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {barberProfile.compensationType === 'percentage' 
                ? `${barberProfile.compensationValue}% sobre serviços concluídos` 
                : 'Valor fixo mensal'}
            </p>
          </div>
          <div className="p-4 bg-zinc-800 rounded-2xl">
            <DollarSign size={32} className="text-zinc-300" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Minha Agenda</h2>
          <p className="text-zinc-500 text-sm md:text-base">Visualize e gerencie seus atendimentos.</p>
        </div>
        <div className="flex bg-white border border-zinc-200 p-1 rounded-2xl shadow-sm self-start md:self-center">
          <button 
            onClick={() => setViewMode('mine')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'mine' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Meus
          </button>
          <button 
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm">
            <Calendar size={48} className="mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900">Nenhum agendamento</h3>
            <p className="text-zinc-500">Você não tem atendimentos marcados para hoje.</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const service = services[appt.serviceId];
            const customer = customers[appt.customerId];
            return (
              <div key={appt.id} className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                   <div className="bg-zinc-900 text-white p-3 md:p-4 rounded-2xl text-center min-w-[70px] md:min-w-[80px]">
                    <span className="block text-[10px] font-bold uppercase opacity-60">
                      {format(new Date(appt.date), 'EEE', { locale: ptBR })}
                    </span>
                    <span className="block text-lg md:text-xl font-bold">
                      {appt.time}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm md:text-base">{service?.name || 'Serviço'}</h4>
                    {customer ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs font-medium text-zinc-700">{customer.name}</p>
                        <p className="text-[10px] text-zinc-500 flex items-center"><Phone size={10} className="mr-1" /> {customer.phone}</p>
                        <p className="text-[10px] text-zinc-500 flex items-center"><Mail size={10} className="mr-1" /> {customer.email}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 mt-1">Cliente: {appt.customerId.slice(0, 8)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-50">
                  <div className="text-left md:text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      appt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                      appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                      appt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {appt.status}
                    </span>
                    {appt.status === 'cancelled' && appt.cancellationReason && (
                      <p className="text-[10px] text-red-400 mt-1 italic max-w-[120px] truncate" title={appt.cancellationReason}>
                        Motivo: {appt.cancellationReason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {appt.status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusUpdate(appt.id, 'completed', appt.customerId)}
                        className="p-2 bg-green-900 text-white rounded-xl hover:bg-green-800 transition-colors"
                        title="Concluir Atendimento"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {appt.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(appt.id, 'confirmed', appt.customerId)}
                        className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
                        title="Confirmar"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                      <button 
                        onClick={() => setCancellingId(appt.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="Desmarcar"
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
    </div>
  );
}
