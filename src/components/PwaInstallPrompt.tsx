'use client';

import { useState, useEffect } from 'react';

export default function PwaInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Evitar ejecución si ya está instalada (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. Detectar si es un dispositivo Apple (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Capturar el evento nativo de instalación (Solo Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que Chrome muestre su mini-barra por defecto
      e.preventDefault();
      // Guardar el evento para dispararlo luego con el botón
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. El cronómetro de negocio: 30 Segundos (30000 ms)
    const timer = setTimeout(() => {
      // Revisamos si el usuario ya lo cerró en el pasado
      const dismissed = localStorage.getItem('datacar_pwa_dismissed');
      
      // Mostramos nuestro Banner si es iOS (siempre) o si Android detectó que es instalable
      if (!dismissed && (isIosDevice || isInstallable)) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isInstallable]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Disparamos el cartel nativo del sistema operativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Guardamos en memoria para no spamear al usuario en el futuro
    localStorage.setItem('datacar_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#0A1F33] text-white p-4 shadow-2xl z-[9999] border-l-4 border-[#00BFFF] rounded-sm animate-in slide-in-from-bottom-10 print:hidden font-inter">
      <button onClick={handleDismiss} className="absolute top-2 right-2 text-slate-400 hover:text-white text-xs font-bold p-2">✕</button>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded flex items-center justify-center font-montserrat font-black text-[#0A1F33] text-sm shadow-inner shrink-0">
          DC
        </div>
        <div>
          <h4 className="font-montserrat font-black text-sm uppercase tracking-tight leading-none mb-1">Instala Datacar</h4>
          <p className="text-[10px] text-slate-300 font-medium leading-tight">Acceso VIP y sin conexión a tus dossieres.</p>
        </div>
      </div>

      {isIOS ? (
        <div className="mt-4 text-[10px] bg-white/5 p-3 rounded border border-white/10 text-slate-200 leading-relaxed font-medium">
          Toca el ícono <span className="font-black text-white">Compartir</span> en la barra inferior de tu navegador y luego selecciona <span className="font-black text-[#00BFFF]">"Agregar a inicio"</span>.
        </div>
      ) : (
        <button onClick={handleInstallClick} className="w-full mt-4 py-3 bg-[#00BFFF] text-[#0A1F33] font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors">
          Instalar Aplicación
        </button>
      )}
    </div>
  );
}
