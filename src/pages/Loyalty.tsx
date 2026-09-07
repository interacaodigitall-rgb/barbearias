import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loyaltyService } from '../services/loyaltyService';
import { saasService } from '../services/saasService';
import { SaaSBarbershop } from '../models';
import { 
  Award, Gift, ChevronRight, Sparkles, CheckCircle2, 
  Copy, Check, Scissors, Info 
} from 'lucide-react';

export default function Loyalty() {
  const { user } = useAuthStore();
  const { slug } = useParams<{ slug?: string }>();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeShop, setActiveShop] = useState<SaaSBarbershop>(
    (slug ? saasService.getBarbershopBySlugSync(slug) : null) || saasService.getActiveBarbershop()
  );

  useEffect(() => {
    async function loadData() {
      if (slug) {
        const found = await saasService.getBarbershopBySlug(slug);
        if (found) setActiveShop(found);
      }
      if (user) {
        const pts = await loyaltyService.getPoints(user.uid);
        setPoints(pts);
      }
      setLoading(false);
    }
    loadData();
  }, [user, slug]);

  const isBrazil = activeShop?.country?.toLowerCase().includes('brasil') || activeShop?.country?.toLowerCase().includes('br');
  const currencySymbol = isBrazil ? 'R$' : '€';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-500">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider">A carregar o Clube de Fidelidade...</p>
      </div>
    );
  }

  // Calculate Tier/Level based on points
  const getLevel = (pts: number) => {
    if (pts >= 150) return { name: 'VIP Diamond', border: 'border-amber-400/50', text: 'text-amber-400', badge: '💎 Diamond' };
    if (pts >= 100) return { name: 'Nível Ouro', border: 'border-yellow-400/50', text: 'text-yellow-400', badge: '🥇 Ouro' };
    if (pts >= 50) return { name: 'Nível Prata', border: 'border-slate-300/50', text: 'text-slate-300', badge: '🥈 Prata' };
    return { name: 'Nível Bronze', border: 'border-amber-700/50', text: 'text-amber-600', badge: '🥉 Bronze' };
  };

  const currentLevel = getLevel(points);

  const rewards = [
    { id: 'r1', points: 50, title: 'Desconto de 10%', description: 'Aplicável em qualquer serviço ou corte', code: 'DESC10' },
    { id: 'r2', points: 100, title: 'Corte Grátis', description: 'Corte de cabelo tradicional à sua escolha', code: 'CORTE100' },
    { id: 'r3', points: 150, title: 'Combo VIP Completo', description: 'Corte + Barba + Sobrancelha com tratamento VIP', code: 'COMBOVIP' },
  ];

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-5 sm:px-6 space-y-5 text-zinc-900">
      
      {/* HEADER TITLE */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#d4a338] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-1">
            ⭐ Clube de Vantagens
          </span>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Programa de Fidelidade
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-[#d4a338] flex items-center justify-center font-bold shadow-md shrink-0 border border-zinc-800">
          <Award size={22} />
        </div>
      </div>

      {/* DIGITAL VIP MEMBERSHIP CARD (RESPONSIVE MOBILE FIRST) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 p-5 sm:p-6 text-white shadow-xl overflow-hidden">
        {/* Background Subtle Watermark Glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-15 pointer-events-none">
          <Award size={180} className="text-amber-400" />
        </div>
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 opacity-10 pointer-events-none">
          <Sparkles size={160} className="text-amber-300" />
        </div>

        <div className="relative z-10 space-y-4">
          {/* Card Top Row: Shop Info & Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src={activeShop?.logoUrl || "/logo-roger.png"} 
                alt={activeShop?.name} 
                className="w-8 h-8 rounded-xl object-contain bg-zinc-900 border border-zinc-700/80 p-0.5 shrink-0" 
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-400 truncate tracking-wide">
                  {activeShop?.name || "Barbearia"}
                </p>
                <p className="text-[10px] text-zinc-400 font-medium truncate">
                  {user?.name || user?.email?.split('@')[0] || "Membro Registado"}
                </p>
              </div>
            </div>

            <span className={`text-[11px] font-black px-3 py-1 rounded-full bg-zinc-900/90 border ${currentLevel.border} ${currentLevel.text} shrink-0 shadow-xs flex items-center gap-1`}>
              {currentLevel.badge}
            </span>
          </div>

          {/* Points Display */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-0.5">
              Saldo Atual de Pontos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {points}
              </span>
              <span className="text-sm font-black text-amber-400 uppercase tracking-widest">
                PTS
              </span>
            </div>
            <p className="text-xs text-amber-300/90 font-medium mt-1 flex items-center gap-1.5">
              <Sparkles size={13} className="shrink-0" />
              Equivale a <strong className="text-white font-extrabold">{currencySymbol} {(points * 0.1).toFixed(2)}</strong> em cashback para usar em serviços!
            </p>
          </div>

          {/* Next Level Progress */}
          <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-semibold text-zinc-400">
              <span>Nível Atual: <strong className="text-white">{currentLevel.name}</strong></span>
              <span>{points < 150 ? `Próximo nível a 150 pts` : 'Nível Máximo Atingido! 🎉'}</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.min(100, (points / 150) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS CHIPS (3-COLUMN GRID) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Pontos
          </span>
          <p className="text-lg sm:text-xl font-extrabold text-zinc-900">
            {points} <span className="text-xs font-bold text-amber-600">pts</span>
          </p>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Cashback
          </span>
          <p className="text-lg sm:text-xl font-extrabold text-amber-600">
            {currencySymbol} {(points * 0.1).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Nível
          </span>
          <p className="text-xs sm:text-sm font-black text-zinc-800 truncate mt-1">
            {currentLevel.name}
          </p>
        </div>
      </div>

      {/* REWARDS SECTION */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-1.5">
            <Gift size={18} className="text-[#d4a338]" />
            Recompensas Disponíveis
          </h2>
          <span className="text-xs text-zinc-500 font-medium">Troque seus pontos</span>
        </div>

        <div className="space-y-2.5">
          {rewards.map((reward) => {
            const isAvailable = points >= reward.points;
            const progress = Math.min((points / reward.points) * 100, 100);

            return (
              <div 
                key={reward.id} 
                className={`bg-white rounded-2xl p-4 sm:p-4.5 border transition-all ${
                  isAvailable 
                    ? 'border-amber-300 shadow-md ring-1 ring-amber-400/20' 
                    : 'border-zinc-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isAvailable ? 'bg-amber-100 text-[#d4a338]' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      <Gift size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-zinc-900 leading-snug">
                          {reward.title}
                        </h3>
                        {isAvailable && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                            Disponível
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                        {reward.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black ${isAvailable ? 'text-amber-600' : 'text-zinc-400'}`}>
                      {reward.points} pts
                    </span>
                  </div>
                </div>

                {!isAvailable ? (
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                      <span>Faltam {reward.points - points} pontos</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedReward(reward)}
                    className="mt-3 w-full py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Sparkles size={15} />
                    <span>Resgatar Recompensa</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* HOW TO EARN POINTS & CTAs */}
      <div className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-5 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Info size={15} />
          Como Acumular Mais Pontos?
        </h3>
        <div className="space-y-2 text-xs text-zinc-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p><strong>10 Pontos</strong> por cada agendamento concluído com sucesso.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p>Cada ponto vale <strong>{currencySymbol} 0,10</strong> em descontos para usufruir na barbearia.</p>
          </div>
        </div>

        <Link
          to={slug ? `/${slug}/booking` : `/${activeShop.slug}/booking`}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md mt-2"
        >
          <Scissors size={16} />
          Agendar Corte & Acumular Pontos
        </Link>
      </div>

      {/* REDEMPTION VOUCHER MODAL */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-amber-200 relative text-zinc-900">
            <div className="w-14 h-14 bg-amber-100 text-[#d4a338] rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-amber-200">
              <Gift size={28} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#d4a338] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                🎉 Recompensa Pronta para Usar
              </span>
              <h3 className="text-xl font-extrabold text-zinc-900 mt-2">
                {selectedReward.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {selectedReward.description}
              </p>
            </div>

            {/* Voucher Box */}
            <div className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 space-y-2 relative">
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Código de Voucher Exclusivo
              </p>
              <div className="text-2xl font-black tracking-widest text-white font-mono bg-zinc-950 py-2 rounded-xl border border-zinc-800 flex items-center justify-center gap-2">
                <span>{selectedReward.code}-{user?.uid?.substring(0, 4).toUpperCase() || 'VIP'}</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Apresente este código na receção ou no momento do pagamento do agendamento.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleCopyVoucher(`${selectedReward.code}-${user?.uid?.substring(0, 4).toUpperCase() || 'VIP'}`)}
                className="w-full py-3 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código do Voucher'}</span>
              </button>

              <button
                onClick={() => setSelectedReward(null)}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
