import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check, Sparkles } from 'lucide-react';
import { isIOS, isStandalone } from '../utils/pwaUtils';

interface PwaInstallBannerProps {
  shopName: string;
  shopLogo?: string;
  shopSlug?: string;
  primaryColor?: string;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  shopName,
  shopLogo,
  shopSlug = 'default',
  primaryColor = '#d4a338'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIosDevice, setIsIosDevice] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    if (isStandalone()) {
      setIsAppInstalled(true);
      return;
    }

    // Check if user dismissed for this shop in current session
    const dismissedKey = `pwa_dismissed_${shopSlug}`;
    if (sessionStorage.getItem(dismissedKey) === 'true') {
      setIsDismissed(true);
    }

    // Detect iOS
    setIsIosDevice(isIOS());

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [shopSlug]);

  if (isAppInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(`pwa_dismissed_${shopSlug}`, 'true');
  };

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowAndroidGuide(true);
    }
  };

  const logoSrc = shopLogo || "https://iili.io/n34KhGf.jpg";

  return (
    <>
      {/* DISCREET MOBILE INSTALL BANNER (BOTTOM FIXED) */}
      <div className="fixed bottom-3 left-3 right-3 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-zinc-950/95 border border-amber-500/30 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <img 
                src={logoSrc} 
                alt={shopName} 
                className="w-11 h-11 rounded-xl object-contain bg-zinc-900 border border-zinc-700/80 p-0.5" 
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#d4a338]">
                <Sparkles size={11} />
                <span>App Oficial PWA</span>
              </div>
              <p className="text-xs font-semibold text-zinc-100 truncate leading-tight mt-0.5">
                Instale o App da <strong className="text-amber-400 font-extrabold">{shopName}</strong> na sua tela inicial para agendamentos rápidos!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              <Download size={14} />
              <span>Instalar App</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* IOS SAFARI INSTALL INSTRUCTIONS MODAL */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-white space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-full bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <img src={logoSrc} alt={shopName} className="w-12 h-12 rounded-2xl object-contain bg-zinc-950 border border-zinc-700 p-1" />
              <div>
                <h3 className="font-extrabold text-base text-white">{shopName}</h3>
                <p className="text-xs text-amber-400 font-medium">Instalar no iOS (iPhone / iPad)</p>
              </div>
            </div>

            <div className="space-y-3.5 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 text-xs">
              <p className="text-zinc-300 font-semibold mb-2">
                Siga os passos abaixo no Safari para adicionar o App à sua Tela de Início:
              </p>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold shrink-0 text-xs border border-amber-500/40">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-100 flex items-center gap-1.5">
                    Toque no botão <Share size={15} className="text-amber-400 inline" /> <strong>Compartilhar</strong>
                  </p>
                  <p className="text-zinc-400 text-[11px]">Localizado na barra inferior do Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold shrink-0 text-xs border border-amber-500/40">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-100 flex items-center gap-1.5">
                    Selecione <PlusSquare size={15} className="text-amber-400 inline" /> <strong>"Adicionar à Tela de Início"</strong>
                  </p>
                  <p className="text-zinc-400 text-[11px]">Role a lista de opções para baixo até encontrar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold shrink-0 text-xs border border-amber-500/40">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-100">
                    Confirme tocando em <strong>"Adicionar"</strong>
                  </p>
                  <p className="text-zinc-400 text-[11px]">No canto superior direito da tela.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosModal(false);
                handleDismiss();
              }}
              className="w-full py-3 bg-[#d4a338] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      )}

      {/* ANDROID MANUAL GUIDE MODAL (IF AUTOMATIC PROMPT NOT FIRED) */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-white space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAndroidGuide(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-full bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <img src={logoSrc} alt={shopName} className="w-12 h-12 rounded-2xl object-contain bg-zinc-950 border border-zinc-700 p-1" />
              <div>
                <h3 className="font-extrabold text-base text-white">{shopName}</h3>
                <p className="text-xs text-amber-400 font-medium">Instalar no Android / Navegador</p>
              </div>
            </div>

            <div className="space-y-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 text-xs">
              <p className="text-zinc-300 font-semibold">
                Para instalar o aplicativo no seu dispositivo:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                <li>Toque no menu do navegador (<strong>3 pontos</strong> no canto superior).</li>
                <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                <li>Siga as instruções na tela para concluir a instalação.</li>
              </ol>
            </div>

            <button
              onClick={() => {
                setShowAndroidGuide(false);
                handleDismiss();
              }}
              className="w-full py-3 bg-[#d4a338] text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
