import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { appointmentService } from '../services/appointmentService';
import { loyaltyService } from '../services/loyaltyService';
import { firestoreService } from '../services/firestoreService';
import { Appointment, Service } from '../models';
import { Calendar, Award, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
        return;
      }
      if (user.role === 'barber') {
        navigate('/barber-dashboard');
        return;
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    async function loadData() {
      if (user && user.role === 'customer') {
        const [appts, pts, sList] = await Promise.all([
          appointmentService.getCustomerAppointments(user.uid),
          loyaltyService.getPoints(user.uid),
          firestoreService.getServices()
        ]);
        const sMap = sList.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
        setServices(sMap);
        setAppointments(appts.filter(a => a.status === 'pending' || a.status === 'confirmed'));
        setPoints(pts);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Carregando...</div>;
  }

  if (user && user.role !== 'customer') return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="bg-zinc-900 text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Bem-vindo, {user?.name.split(' ')[0]}!</h2>
        <p className="text-zinc-400 text-sm md:text-base mb-6 md:mb-8">Pronto para dar aquele trato no visual?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/booking" className="bg-white text-zinc-900 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-zinc-100 p-2 md:p-3 rounded-xl">
                <Calendar size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base">Novo Agendamento</h3>
                <p className="text-[10px] md:text-sm text-zinc-500">Escolha serviço e horário</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-400 md:w-5 md:h-5" />
          </Link>

          <Link to="/loyalty" className="bg-zinc-800 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-700 transition-colors border border-zinc-700">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-zinc-700 p-2 md:p-3 rounded-xl text-yellow-500">
                <Award size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base">Seus Pontos</h3>
                <p className="text-[10px] md:text-sm text-zinc-400">{points} pontos acumulados</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-500 md:w-5 md:h-5" />
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-zinc-900">Próximos Agendamentos</h3>
          <Link to="/appointments" className="text-xs md:text-sm font-medium text-zinc-500 hover:text-zinc-900">Ver todos</Link>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-zinc-100 shadow-sm">
            <Calendar size={40} className="mx-auto text-zinc-300 mb-4 md:w-12 md:h-12" />
            <h4 className="text-base md:text-lg font-medium text-zinc-900 mb-1 md:mb-2">Nenhum agendamento</h4>
            <p className="text-xs md:text-sm text-zinc-500 mb-6">Você não tem nenhum agendamento futuro.</p>
            <Link to="/booking" className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-xs md:text-sm font-bold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-colors">
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {appointments.map(appt => (
              <div key={appt.id} className="bg-white rounded-2xl p-4 md:p-6 border border-zinc-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-zinc-50 p-3 md:p-4 rounded-xl text-center min-w-[70px] md:min-w-[80px] border border-zinc-100">
                    <span className="block text-[10px] md:text-sm text-zinc-500 font-bold uppercase tracking-tight">
                      {format(new Date(appt.date), 'MMM', { locale: ptBR })}
                    </span>
                    <span className="block text-xl md:text-2xl font-bold text-zinc-900">
                      {format(new Date(appt.date), 'dd')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-bold text-zinc-900">{services[appt.serviceId]?.name || 'Serviço'}</h4>
                    <div className="flex items-center text-zinc-500 mt-1 space-x-3 md:space-x-4">
                      <span className="flex items-center text-xs md:text-sm">
                        <Clock size={14} className="mr-1 md:w-4 md:h-4" />
                        {appt.time}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                        appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
