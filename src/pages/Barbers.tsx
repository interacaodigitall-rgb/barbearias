import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Barber } from '../models';
import { Star, Users } from 'lucide-react';

export default function Barbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBarbers() {
      const data = await firestoreService.getBarbers();
      setBarbers(data);
      setLoading(false);
    }
    loadBarbers();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mb-6 md:mb-8">Nossos Barbeiros</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {barbers.map(barber => (
          <div key={barber.id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-zinc-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-zinc-200 mb-4 overflow-hidden flex items-center justify-center border-2 border-zinc-50">
              {barber.photoUrl ? (
                <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
              ) : (
                <Users size={32} className="text-zinc-400 md:w-10 md:h-10" />
              )}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-1 md:mb-2">{barber.name}</h3>
            <div className="flex items-center text-yellow-500 mb-3 md:mb-4">
              <Star size={14} className="fill-current mr-1 md:w-4 md:h-4" />
              <span className="text-sm md:text-base font-bold text-zinc-700">{barber.rating.toFixed(1)}</span>
            </div>
            <p className="text-zinc-500 text-xs md:text-sm mb-4 md:mb-6 line-clamp-3">{barber.bio}</p>
            <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${
              barber.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {barber.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
