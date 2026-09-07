import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { appointmentService } from '../services/appointmentService';
import { firestoreService } from '../services/firestoreService';
import { saasService } from '../services/saasService';
import { Appointment, Service, Barber, SaaSBarbershop } from '../models';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Clock3, 
  User as UserIcon, VolumeX, ShoppingBag, Plus, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Appointments() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [barbers, setBarbers] = useState<Record<string, Barber>>({});
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeShop] = useState<SaaSBarbershop>(saasService.getActiveBarbershop());

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
      if (user) {
        const [appts, sList, bList] = await Promise.all([
          appointmentService.getCustomerAppointments(user.uid),
          firestoreService.getServices(),
          firestoreService.getBarbers()
        ]);
        
        const sMap = sList.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
        const bMap = bList.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
        
        setServices(sMap);
        setBarbers(bMap);
        setAppointments(appts);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const today = new Date().toISOString().split('T')[0];

  const upcomingAppointments = appointments.filter(a => 
    (a.status === 'pending' || a.status === 'confirmed') && a.date >= today
  );

  const historyAppointments = appointments.filter(a => 
    a.status === 'completed' || a.status === 'cancelled' || a.date < today
  );

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <div className="w-8 h-8 border-3 border-[#d4a338] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-zinc-400">Carregando agendamentos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-16">
      {/* Top Header matching mobile mockups */}
      <div className="pt-2 pb-4 text-center">
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
          Meus Agendamentos
        </h1>
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
          {activeShop.name} - {activeShop.unit}
        </p>
      </div>

      {/* Tabs matching screenshot 1 (PRÓXIMOS | HISTÓRICO) */}
      <div className="flex border-b border-zinc-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 pb-3 text-xs font-extrabold uppercase tracking-wider transition-all relative ${
            activeTab === 'upcoming' 
              ? 'text-zinc-900' 
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Próximos ({upcomingAppointments.length})
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4a338] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 pb-3 text-xs font-extrabold uppercase tracking-wider transition-all relative ${
            activeTab === 'history' 
              ? 'text-zinc-900' 
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Histórico ({historyAppointments.length})
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4a338] rounded-full" />
          )}
        </button>
      </div>

      {/* Content list or Empty State */}
      {displayedAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-zinc-100 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="w-18 h-18 rounded-full bg-amber-50 border border-amber-200/60 mx-auto flex items-center justify-center text-[#d4a338] shadow-inner">
            <CalendarIcon size={34} />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-zinc-900">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
              {activeTab === 'upcoming' 
                ? 'Você ainda não possui nenhum agendamento marcado.'
                : 'Seu histórico de atendimentos realizados ou cancelados aparecerá aqui.'
              }
            </p>
          </div>

          {activeTab === 'upcoming' && (
            <div className="pt-2">
              <Link
                to="/booking"
                className="inline-flex items-center justify-center w-full py-4 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-98"
              >
                Agendar Agora
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          {displayedAppointments.map((appt) => {
            const service = services[appt.serviceId];
            const barber = barbers[appt.barberId];
            const isUpcoming = appt.status === 'pending' || appt.status === 'confirmed';

            return (
              <div
                key={appt.id}
                className="rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow space-y-4 text-zinc-900 bg-white placeholder:text-zinc-400"
              >
                {/* Header row: Service, Price & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 tracking-tight">
                      {service?.name || 'Corte & Barba'}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400">
                      {service?.durationMinutes ? `${service.durationMinutes} min` : '40 min'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#d4a338] block">
                      {(appt.totalAmount || service?.price || 12).toFixed(2)} €
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${
                      appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      appt.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {appt.status === 'confirmed' ? 'Confirmado' :
                       appt.status === 'completed' ? 'Concluído' :
                       appt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Professional + Date/Time pills */}
                <div className="flex items-center justify-between gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-800 bg-zinc-200 shrink-0">
                      {barber?.photoUrl ? (
                        <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 text-[#d4a338] flex items-center justify-center text-xs font-bold">
                          {barber?.name?.slice(0, 2) || 'MB'}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Profissional
                      </span>
                      <span className="font-extrabold text-xs text-zinc-900 uppercase">
                        {barber?.name || 'Sem Preferência'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs font-bold text-zinc-800">
                    <div className="flex items-center justify-end gap-1 text-zinc-500">
                      <CalendarIcon size={13} className="text-[#d4a338]" />
                      <span>{appt.date}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-zinc-900 mt-0.5">
                      <Clock size={13} className="text-[#d4a338]" />
                      <span>{appt.time}</span>
                    </div>
                  </div>
                </div>

                {/* Quiet service badge & Products preview if any */}
                {(appt.quietService || (appt.selectedProducts && appt.selectedProducts.length > 0)) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {appt.quietService && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                        <VolumeX size={13} />
                        Quiet Service Ativo 🤫
                      </span>
                    )}

                    {appt.selectedProducts && appt.selectedProducts.map(p => (
                      <span key={p.productId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
                        <ShoppingBag size={13} />
                        {p.quantity}x {p.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cancel button if pending or confirmed */}
                {isUpcoming && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => setCancellingId(appt.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      Cancelar Agendamento
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 text-center">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-98"
            >
              <Plus size={16} />
              Novo Agendamento
            </Link>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-1">Cancelar Agendamento</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Por favor informe o motivo do cancelamento para liberarmos o barbeiro.
            </p>

            <textarea
              rows={3}
              required
              placeholder="Ex: Imprevisto no trabalho, remarcarei em breve..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full text-xs p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none mb-4 text-zinc-900 bg-white placeholder:text-zinc-400"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setCancellingId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800"
              >
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
