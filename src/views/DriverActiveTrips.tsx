import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Phone, MessageCircle, CheckCircle, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { updateTripStatus } from '../services/db';
import { useAuth } from '../context/AuthContext';

// Fix for default marker icons in React-Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom markers for Active Trip Map
const driverIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #00d4aa; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10]
});

const passengerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10]
});

const destIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #e74c3c; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10]
});

// Coordenadas fijas de Cancún para geocodificación local de lugares clave
const CANCUN_LOCATIONS: { [key: string]: [number, number] } = {
  'instituto tecnologico de cancun': [21.1326, -86.9225],
  'tecnologico de cancun': [21.1326, -86.9225],
  'itc': [21.1326, -86.9225],
  'universidad del caribe': [21.2014, -86.8242],
  'unicaribe': [21.2014, -86.8242],
  'crucero': [21.1738, -86.8247],
  'coppel crucero': [21.1738, -86.8247],
  'plaza las americas': [21.1472, -86.8286],
  'las americas': [21.1472, -86.8286],
  'centro': [21.1619, -86.8515],
  'huayacan': [21.1098, -86.8778],
  'la luna': [21.1352, -86.8550],
  'kabah': [21.1485, -86.8580],
  'zofra': [21.1850, -86.8120]
};

function getCoordinatesForAddress(address: string): [number, number] {
  if (!address) return [21.1390, -86.8350];
  const clean = address.toLowerCase().trim();
  if (CANCUN_LOCATIONS[clean]) return CANCUN_LOCATIONS[clean];
  for (const [key, coords] of Object.entries(CANCUN_LOCATIONS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }
  const offsetLat = (address.length % 5) * 0.003;
  const offsetLng = (address.length % 7) * 0.003;
  return [21.1390 + offsetLat - 0.006, -86.8350 + offsetLng - 0.006];
}

// Helper para recentrar el mapa y encajar todos los elementos
function RecenterToFitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const validCoords = coords.filter(c => c && c[0] && c[1]);
      if (validCoords.length > 0) {
        try {
          const bounds = L.latLngBounds(validCoords);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        } catch (e) {
          console.error("Error setting bounds:", e);
        }
      }
    }
  }, [coords, map]);
  return null;
}

// Force Leaflet map layout calculation after rendering inside an iframe
function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function DriverActiveTrips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Posición actual simulada del conductor para mostrar movimiento live en el mapa
  const [driverPos, setDriverPos] = useState<[number, number]>([21.1390, -86.8350]);

  useEffect(() => {
    if (!user) return;

    // Escuchar viajes asignados a mí
    const q = query(
      collection(db, 'trips'),
      where('driverId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Filtrar localmente por estados activos
      const active = trips.find((t: any) => ['in_progress', 'picking_up', 'in_transit'].includes(t.status));
      setActiveTrip(active || null);
      
      // Inicializar conductor ligeramente alejado del destino actual para la simulación
      if (active) {
        const originCoords = getCoordinatesForAddress((active as any).origin);
        setDriverPos([originCoords[0] - 0.003, originCoords[1] - 0.003]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching active trip:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Simulación de movimiento GPS interactivo
  useEffect(() => {
    if (!activeTrip) return;
    
    const target = activeTrip.status === 'in_transit'
      ? getCoordinatesForAddress(activeTrip.destination)
      : getCoordinatesForAddress(activeTrip.origin);

    const interval = setInterval(() => {
      setDriverPos(prev => {
        const latDiff = target[0] - prev[0];
        const lngDiff = target[1] - prev[1];
        const step = 0.04; // Factor de velocidad suave por segundo en simulación
        
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          return target;
        }
        return [prev[0] + latDiff * step, prev[1] + lngDiff * step];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrip?.status, activeTrip?.origin, activeTrip?.destination]);

  const handleNextStep = async () => {
    if (!activeTrip) return;

    try {
      if (activeTrip.status === 'in_progress' || activeTrip.status === 'picking_up') {
        await updateTripStatus(activeTrip.id, 'in_transit');
      } else if (activeTrip.status === 'in_transit') {
        await updateTripStatus(activeTrip.id, 'completed');
        alert('¡Viaje completado con éxito!');
        navigate('/');
      }
    } catch (error) {
      console.error('Error actualizando viaje:', error);
      alert('Hubo un error al actualizar el estado del viaje.');
    }
  };

  const isPickingUp = !activeTrip || activeTrip.status === 'in_progress' || activeTrip.status === 'picking_up';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 flex flex-col items-center justify-center text-[#2d3748] dark:text-zinc-100">
        <div className="w-10 h-10 border-4 border-[#00d4aa] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold">Cargando información del viaje...</p>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 pb-24 font-sans text-[#2d3748] dark:text-zinc-100 transition-colors duration-200 flex flex-col">
        <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-50 shadow-sm flex items-center gap-4 transition-colors duration-200">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
          </button>
          <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Viaje Activo</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 max-w-md w-full">
            <Navigation2 size={52} className="mx-auto text-gray-300 dark:text-zinc-600 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold">Sin viajes activos</h3>
            <p className="text-[13px] text-[#718096] dark:text-zinc-400 mt-2 mb-6">
              Actualmente no tienes ningún viaje en curso. Dirígete a la sección de solicitudes de viaje para aceptar un servicio.
            </p>
            <button 
              onClick={() => navigate('/driver/requests')}
              className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white py-3 rounded-xl font-bold transition-colors shadow-sm"
            >
              VER SOLICITUDES
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Puntos geocodificados del viaje actual
  const rawOrigin = getCoordinatesForAddress(activeTrip.origin);
  const rawDest = getCoordinatesForAddress(activeTrip.destination);

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 pb-24 font-sans text-[#2d3748] dark:text-zinc-100 transition-colors duration-200 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-50 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Viaje Activo</h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 flex flex-col justify-center">
        
        {/* Mapa Interactivo con Leaflet */}
        <div className="w-full h-[280px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-700 mb-4 relative bg-gray-100 dark:bg-zinc-800">
          <MapContainer
            center={driverPos}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark:brightness-75 dark:contrast-125 dark:hue-rotate-180 dark:invert"
            />
            
            {/* Marcador del Conductor (Moviéndose en vivo) */}
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>
                <div className="font-bold text-xs p-1">Tu Ubicación (Conductor)</div>
              </Popup>
            </Marker>

            {/* Marcador del Pasajero/Alumno en el Origen */}
            <Marker position={rawOrigin} icon={passengerIcon}>
              <Popup>
                <div className="font-bold text-xs p-1 flex flex-col gap-0.5">
                  <span>Alumno: {activeTrip.passengerName}</span>
                  <span className="text-[10px] text-gray-500">Punto de encuentro</span>
                </div>
              </Popup>
            </Marker>

            {/* Marcador del Destino Final */}
            <Marker position={rawDest} icon={destIcon}>
              <Popup>
                <div className="font-bold text-xs p-1">Destino: {activeTrip.destination}</div>
              </Popup>
            </Marker>

            {/* Trazado del trayecto */}
            <Polyline 
              positions={[driverPos, rawOrigin, rawDest]} 
              color="#00d4aa" 
              weight={4} 
              opacity={0.8}
              dashArray="8, 8" 
            />

            <RecenterToFitBounds coords={[driverPos, rawOrigin, rawDest]} />
            <InvalidateMapSize />
          </MapContainer>

          {/* Estado de red / indicador de viaje */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-[10px] font-black uppercase tracking-wider text-[#00d4aa] flex items-center gap-1.5 border border-emerald-500/10">
            <span className="w-2 h-2 bg-[#00d4aa] rounded-full animate-ping"></span>
            GPS Activo • Simulación LTE
          </div>
        </div>

        {/* Visual Progress Stepper */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6 mb-4 transition-colors duration-200">
          <p className="text-[11px] font-extrabold text-[#00d4aa] uppercase tracking-wider mb-4">Progreso de la Ruta</p>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-zinc-700">
            {/* Step 1: Recogida */}
            <div className="relative">
              <span className={`absolute left-[-22px] top-1 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                isPickingUp 
                  ? 'bg-blue-500 border-white text-white shadow-sm' 
                  : 'bg-[#00d4aa] border-white text-white'
              }`}>
                1
              </span>
              <p className={`text-xs font-bold ${isPickingUp ? 'text-blue-500' : 'text-gray-400'}`}>Punto de Recogida</p>
              <p className="text-[14px] font-medium text-[#2d3748] dark:text-zinc-100">{activeTrip.origin}</p>
            </div>
            
            {/* Step 2: Destino */}
            <div className="relative">
              <span className={`absolute left-[-22px] top-1 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                !isPickingUp 
                  ? 'bg-[#00d4aa] border-white text-white shadow-sm' 
                  : 'bg-gray-100 dark:bg-zinc-800 border-gray-300 text-gray-400'
              }`}>
                2
              </span>
              <p className={`text-xs font-bold ${!isPickingUp ? 'text-[#00d4aa]' : 'text-gray-400'}`}>Destino Final</p>
              <p className="text-[14px] font-medium text-[#2d3748] dark:text-zinc-100">{activeTrip.destination}</p>
            </div>
          </div>
        </div>

        {/* Detalles del Pasajero */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6 transition-colors duration-200">
          
          {/* Info del Pasajero */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                {(activeTrip.passengerName || 'P')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px]">{activeTrip.passengerName || 'Pasajero'}</h3>
                <p className="text-[12px] text-[#718096] dark:text-zinc-400 flex items-center gap-1">
                  <CheckCircle size={12} className="text-[#00d4aa]" /> Pasajero de la Institución
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-[#4a5568] dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
                <MessageCircle size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                <Phone size={20} />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Estado de la Ruta</p>
            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${
              isPickingUp 
                ? 'bg-blue-500/10 text-blue-500' 
                : 'bg-[#00d4aa]/10 text-[#00d4aa]'
            }`}>
              {isPickingUp ? 'YENDO POR EL PASAJERO' : 'DE CAMINO AL DESTINO'}
            </span>
          </div>

          {/* Botón de Acción */}
          <button 
            onClick={handleNextStep}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 text-[15px] ${
              isPickingUp 
                ? 'bg-[#3b82f6] hover:bg-blue-600 shadow-blue-500/20' 
                : 'bg-[#00d4aa] hover:bg-[#00bfa0] shadow-[#00d4aa]/20'
            }`}
          >
            {isPickingUp ? 'CONFIRMAR RECOGIDA' : 'FINALIZAR VIAJE'}
          </button>

        </div>
      </main>
    </div>
  );
}
