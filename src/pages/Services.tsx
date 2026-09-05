import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Service } from '../models';
import { Scissors, Clock } from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      const data = await firestoreService.getServices();
      setServices(data);
      setLoading(false);
    }
    loadServices();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mb-6 md:mb-8">Nossos Serviços</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-zinc-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <h3 className="text-lg md:text-xl font-bold text-zinc-900">{service.name}</h3>
                <span className="text-base md:text-lg font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg">€{service.price.toFixed(2)}</span>
              </div>
              <p className="text-sm md:text-base text-zinc-500 mb-4 md:mb-6">{service.description}</p>
            </div>
            <div className="flex items-center text-xs md:text-sm text-zinc-400 font-bold uppercase tracking-tight">
              <Clock size={14} className="mr-1.5 md:w-4 md:h-4" />
              {service.durationMinutes} minutos
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
