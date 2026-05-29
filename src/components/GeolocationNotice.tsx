import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, X, Compass, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

interface GeolocationNoticeProps {
  onPermissionGranted?: (coords: [number, number]) => void;
  className?: string;
}

export function GeolocationNotice({ onPermissionGranted, className = "" }: GeolocationNoticeProps) {
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Check initial permission status if the browser API is available
  useEffect(() => {
    const fetchRealPosition = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPermissionState('granted');
            if (onPermissionGranted) {
              onPermissionGranted([pos.coords.latitude, pos.coords.longitude]);
            }
          },
          (err) => {
            console.warn("Could not get location on mount:", err);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      }
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setPermissionState(result.state);
          if (result.state === 'granted') {
            fetchRealPosition();
          }
          result.onchange = () => {
            setPermissionState(result.state);
            if (result.state === 'granted') {
              fetchRealPosition();
            }
          };
        })
        .catch((err) => {
          console.warn("Could not query geolocation permission status:", err);
          fetchRealPosition();
        });
    } else {
      fetchRealPosition();
    }
  }, []);

  const requestPermission = () => {
    setIsChecking(true);
    setErrorDetails(null);

    if (!('geolocation' in navigator)) {
      setErrorDetails("La geolocalización no es soportada en este navegador.");
      setIsChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermissionState('granted');
        setIsChecking(false);
        if (onPermissionGranted) {
          onPermissionGranted([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      (err) => {
        setIsChecking(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
          setErrorDetails("Permiso denegado por el usuario o bloqueado en la configuración.");
        } else {
          setErrorDetails(`Error al obtener ubicación (${err.message})`);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  if (!isVisible) return null;

  return (
    <div id="geolocation-notice" className={`bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-md border border-[#00d4aa]/20 dark:border-zinc-700/60 transition-all ${className}`}>
      <div className="flex items-start gap-4">
        {/* Decorative Compass Icon with Pulse */}
        <div className="w-10 h-10 bg-[#00d4aa]/10 text-[#00d4aa] rounded-full flex items-center justify-center shrink-0">
          <Compass className={`w-5 h-5 ${isChecking ? 'animate-spin' : 'animate-pulse'}`} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00d4aa]" />
              Acceso Seguro a tu Ubicación
            </h3>
            <button 
              type="button"
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-zinc-300 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-705 cursor-pointer transition-all"
              title="Cerrar aviso"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-[12px] text-gray-500 dark:text-zinc-400 leading-relaxed">
            Para tu **seguridad y coordinación en tiempo real**, esta aplicación requiere acceso a tu ubicación. 
            Esto ayuda a los conductores a encontrarte con precisión matemática y a monitorear el viaje de inicio a fin protegiendo tu integridad en la ruta.
          </p>

          {/* Current Status Badge & Error details */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">
              Estado del permiso:
            </span>
            {permissionState === 'granted' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00d4aa]/10 text-[#00d4aa]">
                <CheckCircle2 className="w-3 h-3" /> Permitido
              </span>
            )}
            {permissionState === 'prompt' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 animate-pulse">
                Pendiente de aprobación
              </span>
            )}
            {permissionState === 'denied' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-3 h-3" /> Bloqueado / Denegado
              </span>
            )}
            {permissionState === 'unknown' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-500">
                Determinar estado
              </span>
            )}
          </div>

          {errorDetails && (
            <div className="bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 rounded-lg p-2.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              ⚠️ {errorDetails}
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 text-[11px] text-amber-800 dark:text-amber-400 space-y-1">
              <span className="font-bold block">💡 ¿Cómo solucionar el bloqueo?</span>
              <p className="leading-relaxed">
                Haz clic en el icono del **candado** <Key className="inline w-3 h-3 mx-0.5 text-amber-600" /> en tu barra de direcciones del navegador, cambia el permiso de ubicación a <strong>"Permitir"</strong> y recarga la página.
              </p>
            </div>
          )}

          {/* Action button if not yet permitted */}
          {permissionState !== 'granted' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={requestPermission}
                disabled={isChecking}
                className="w-full sm:w-auto px-4 py-2 bg-[#00d4aa] hover:bg-[#00c09a] text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5" />
                {isChecking ? 'Verificando con el Navegador...' : 'Permitir Ubicación para Seguridad'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
