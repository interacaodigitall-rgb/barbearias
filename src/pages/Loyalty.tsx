import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { loyaltyService } from '../services/loyaltyService';
import { Award, Gift, Star, ChevronRight } from 'lucide-react';

export default function Loyalty() {
  const { user } = useAuthStore();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user) {
        const pts = await loyaltyService.getPoints(user.uid);
        setPoints(pts);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-full">Carregando...</div>;

  const rewards = [
    { points: 50, title: 'Desconto de 10%', description: 'Em qualquer serviço' },
    { points: 100, title: 'Corte Grátis', description: 'Corte de cabelo tradicional' },
    { points: 150, title: 'Combo VIP', description: 'Corte + Barba + Sobrancelha' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Programa de Fidelidade</h2>
      
      <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 text-zinc-800 opacity-50">
          <Award size={200} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-medium text-zinc-400 mb-2">Seus Pontos</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-6xl font-bold tracking-tighter">{points}</span>
            <span className="text-xl text-zinc-500 font-medium">pts</span>
          </div>
          <p className="mt-6 text-zinc-400 max-w-md">
            Ganhe 10 pontos a cada serviço concluído. Troque seus pontos por recompensas exclusivas.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-zinc-900 mb-6">Recompensas Disponíveis</h3>
      <div className="space-y-4">
        {rewards.map((reward, index) => {
          const isAvailable = points >= reward.points;
          const progress = Math.min((points / reward.points) * 100, 100);

          return (
            <div key={index} className={`bg-white rounded-2xl p-6 border transition-all ${
              isAvailable ? 'border-zinc-900 shadow-md' : 'border-zinc-100 shadow-sm opacity-75'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${isAvailable ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                    <Gift size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">{reward.title}</h4>
                    <p className="text-sm text-zinc-500">{reward.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${isAvailable ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {reward.points} pts
                  </span>
                </div>
              </div>

              {!isAvailable && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2">
                    <span>Faltam {reward.points - points} pontos</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-zinc-900 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {isAvailable && (
                <button className="mt-4 w-full py-3 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center">
                  Resgatar Recompensa
                  <ChevronRight size={18} className="ml-2" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
