import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Key, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackToLeaflet?: () => void;
  showLeafletOption?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MapErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center p-6 bg-red-50/50 dark:bg-rose-950/10 text-center rounded-xl border border-red-100 dark:border-rose-900/30">
          <div className="max-w-[420px] mx-auto my-auto space-y-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-rose-950/50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert size={20} />
            </div>
            
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Error en Componente de Google Maps
            </h3>
            
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
              Google Maps no pudo inicializar sus componentes gráficos. Esto normalmente ocurre si la API Key tiene restricciones de "Referencia HTTP" (Referer) en Google Cloud Console.
            </p>

            <div className="bg-white dark:bg-zinc-900 text-left p-3 rounded-lg border border-gray-150 dark:border-zinc-800 text-[10px] space-y-1 font-mono text-gray-500 dark:text-zinc-400 max-w-full overflow-x-auto max-h-[100px]">
              <div><strong className="text-red-500">Error:</strong> {this.state.error?.message || "Google Maps Script Error"}</div>
              <div className="mt-2 text-gray-400 dark:text-zinc-500">
                💡 URL que debes autorizar: <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[#00d4aa] font-semibold break-all">{window.location.origin}</code>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-3 py-1.5 bg-[#00d4aa] hover:bg-[#00c09a] text-white font-extrabold uppercase text-[9px] rounded-lg cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1"
              >
                <RefreshCw size={10} /> Reintentar
              </button>

              {this.props.showLeafletOption && this.props.fallbackToLeaflet && (
                <button
                  type="button"
                  onClick={this.props.fallbackToLeaflet}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-gray-700 dark:text-zinc-200 font-extrabold uppercase text-[9px] rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Cambiar a Leaflet
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/50">
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#00d4aa] hover:underline font-extrabold inline-flex items-center gap-1 justify-center"
              >
                Configurar Restricciones de tu API Key <ExternalLink size={10} />
              </a>
              <p className="text-[9px] text-gray-400 mt-1">
                Para corregir esto, añade la URL anterior a tus restricciones en la consola de Google Cloud, o deshabilita temporalmente las restricciones de sitio web para pruebas.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
