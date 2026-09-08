import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isLoading: boolean;
  shopName?: string;
}

export const OFFICIAL_PWA_LOGO = 'https://iili.io/n34KhGf.jpg';

export function SplashScreen({ isLoading, shopName }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Inicia a transição suave de desaparecimento
      setFadingOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 450); // 450ms de fade-out suave
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
      setFadingOut(false);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      id="pwa-splash-screen"
      role="status"
      aria-label="Carregando aplicativo"
      className={`fixed inset-0 z-[9999] w-screen h-screen bg-black flex flex-col items-center justify-center select-none transition-opacity duration-500 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center">
        {/* Container da Logo com brilho e bordas arredondadas */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Halo âmbar pulsante suave ao fundo */}
          <div className="absolute -inset-3 rounded-3xl bg-[#d4a338]/15 blur-xl animate-pulse" />

          {/* Imagem Oficial da Barbearia com Bordas Arredondadas */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-800 shadow-2xl shadow-black animate-pulse">
            <img
              src={OFFICIAL_PWA_LOGO}
              alt={shopName ? `${shopName} Logo` : 'Barbearia'}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>

        {/* Nome da Barbearia e Indicador Discreto */}
        <div className="flex flex-col items-center gap-3">
          {shopName && (
            <h1 className="text-white text-base sm:text-lg font-black uppercase tracking-widest text-center">
              {shopName}
            </h1>
          )}

          {/* Indicador pulsante dourado nativo */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#d4a338] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-[#d4a338] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-[#d4a338] animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
