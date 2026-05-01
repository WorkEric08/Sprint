
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página ou limpar o cache do navegador.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-600 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Recarregar Aplicativo
              </button>
              <button
                onClick={async () => {
                  if (confirm('Isso irá limpar os dados temporários e recarregar. Continuar?')) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                    if ('serviceWorker' in navigator) {
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      for (const reg of registrations) await reg.unregister();
                    }
                    window.location.reload();
                  }
                }}
                className="w-full py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Limpar Cache e Resetar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
