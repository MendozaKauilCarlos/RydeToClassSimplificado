import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Phone, MessageCircle, CheckCircle, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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

// Custom markers
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

export default function DriverActiveTrips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Coordenadas fijas por defecto para el render del mapa de Leaflet
  const driverCoords: [number, number] = [21.1390, -86.8350];
  const passengerCoords: [number, number] = [21.1450, -86.8400];
  const destCoords: [number, number] = [21.1619, -86.8515];

  useEffect(() => {
    if (!user) return;

    // Escuchar viajes asignados a mí
    const q = query(
      collection(db, 'trips'),
      where('driverId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtrar localmente por estados activos
      const active = trips.find((t: any) => ['in_progress', 'picking_up', 'in_transit'].includes(t.status));
      setActiveTrip(active || null);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching active trip:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
        
        {/* Visual Progress Stepper replacing the Map */}
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
