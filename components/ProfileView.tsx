
import React, { useState, useEffect } from 'react';
import { Zap, X, Shield, Star, Bell, Settings, LogOut, ChevronRight, Download } from 'lucide-react';

const ProfileView: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [browserType, setBrowserType] = useState<'ios' | 'samsung' | 'other'>('other');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSamsung = /SamsungBrowser/i.test(ua);
    
    if (isIOS) {
      setBrowserType('ios');
    } else if (isSamsung) {
      setBrowserType('samsung');
    } else {
      setBrowserType('other');
    }

    // Detecta se já está instalado (modo standalone ou via localStorage)
    const checkInstallation = () => {
      try {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true ||
                            localStorage.getItem('sprint_app_installed') === 'true';
        
        if (isStandalone) {
          setIsInstalled(true);
        }
      } catch (e) {
        console.warn('Erro ao verificar instalação:', e);
      }
    };

    checkInstallation();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('sprint_app_installed', 'true');
      } catch (e) {
        console.warn('Erro ao salvar estado de instalação:', e);
      }
    };

    const handlePromptAvailable = () => {
      const prompt = (window as any).__pwaDeferredPrompt || (window as any).__deferredInstallPrompt;
      if (prompt) setDeferredPrompt(prompt);
    };

    // Verifica se já existe um prompt capturado globalmente
    const existing = (window as any).__pwaDeferredPrompt || (window as any).__deferredInstallPrompt;
    if (existing) setDeferredPrompt(existing);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-install-available', handlePromptAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-install-available', handlePromptAvailable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('O Sprint já está instalado e pronto para uso!');
      return;
    }

    // Fluxo para Samsung e Chrome (e outros baseados em Chromium)
    if (deferredPrompt) {
      try {
        setIsProcessing(true);
        // Pequeno atraso para simular o "redirecionamento" solicitado pelo usuário
        if (browserType === 'samsung') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Mostra o prompt nativo do navegador
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('Usuário aceitou a instalação');
          setDeferredPrompt(null);
          setIsInstalled(true);
          localStorage.setItem('sprint_app_installed', 'true');
        }
      } catch (err) {
        console.error('Erro ao processar instalação:', err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Se não houver prompt nativo (iOS ou outros sem suporte imediato), mostramos o guia visual
      setShowGuide(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Modal de Guia de Instalação Universal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Zap className="w-7 h-7 text-white fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Instalar Sprint</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adicione à sua tela de início</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              {browserType === 'ios' ? (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    Para instalar o Sprint no seu iPhone e usá-lo como um app nativo, siga estes passos:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">1</div>
                      <p>Toque no ícone de <span className="font-bold text-indigo-600 text-base">Compartilhar</span> (quadrado com seta para cima) na barra inferior.</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">2</div>
                      <p>Role a lista para baixo e toque em <span className="font-bold text-indigo-600 text-base">Adicionar à Tela de Início</span>.</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">3</div>
                      <p>Toque em <span className="font-bold text-indigo-600 text-base">Adicionar</span> no canto superior direito.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    {browserType === 'samsung' 
                      ? "O navegador Samsung Internet permite instalar o app rapidamente seguindo estes passos:"
                      : "Seu navegador não disparou a instalação automática. Você pode instalar manualmente:"}
                  </p>
                  <div className="space-y-3">
                    {browserType === 'samsung' ? (
                      <>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">1</div>
                          <p>Toque no <span className="font-bold text-indigo-600 text-base">Menu</span> (três linhas no canto inferior direito).</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">2</div>
                          <p>Toque em <span className="font-bold text-indigo-600 text-base">Adicionar página a</span>.</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">3</div>
                          <p>Selecione <span className="font-bold text-indigo-600 text-base">Tela inicial</span>.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">1</div>
                          <p>Toque nos <span className="font-bold text-indigo-600 text-base">três pontos</span> (menu) do seu navegador.</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">2</div>
                          <p>Selecione <span className="font-bold text-indigo-600 text-base">Instalar Aplicativo</span> ou <span className="font-bold text-indigo-600 text-base">Adicionar à tela inicial</span>.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
      {/* Área do Ícone de Perfil */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5D5FEF] to-[#A559FF] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-xl relative z-10">
            <i className="fas fa-user text-5xl text-gray-300 dark:text-gray-700"></i>
          </div>
          <button className="absolute bottom-1 right-1 w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 active:scale-90 transition-transform z-20">
            <i className="fas fa-camera text-xs"></i>
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Perfil</h2>
        </div>
      </div>

      {/* Botão de Instalação */}
      <div className="w-full max-w-xs space-y-4">
        {!isInstalled ? (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2 text-indigo-500">
              <i className="fas fa-mobile-screen-button text-xl"></i>
              <span className="font-black text-[10px] uppercase tracking-widest">Experiência PWA</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {deferredPrompt 
                ? "Instale o Sprint na sua tela de início para acesso rápido e foco total."
                : "Adicione o Sprint à sua tela de início para usar como um aplicativo nativo."}
            </p>
            <button 
              onClick={handleInstallClick}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                isProcessing 
                  ? 'bg-gray-400 dark:bg-gray-700 text-white cursor-not-allowed' 
                  : 'bg-indigo-600 dark:bg-white text-white dark:text-gray-950'
              }`}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  Iniciando...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  Instalar App
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
      
      {/* Link de Ajuda / Configurações Simples */}
      <div className="pt-4">
        <button className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.3em] hover:text-indigo-500 transition-colors">
          Configurações da Conta
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
