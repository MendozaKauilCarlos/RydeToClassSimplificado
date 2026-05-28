import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Clock, Users, DollarSign, Map as MapIcon, Plus, Target, Loader2, Power, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { createRoute, getDriverRoutes, deleteRoute, toggleRouteActive } from '../services/db';

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
const originIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #00d4aa; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

const destIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #e74c3c; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  time: string;
  days: string[];
  seats: number;
  price: number;
  active?: boolean;
}

export default function DriverCreateRoute() {
  const navigate = useNavigate();
  const { userData, user } = useAuth();
  
  // Form State
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [time, setTime] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [seats, setSeats] = useState<number>(4);
  const [price, setPrice] = useState<number | ''>('');
  
  // Routes State
  const [myRoutes, setMyRoutes] = useState<RouteData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivatingRouteId, setDeactivatingRouteId] = useState<string | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  // Load driver routes from Firestore
  useEffect(() => {
    const fetchRoutes = async () => {
      if (!user) return;
      setLoadingRoutes(true);
      try {
        const fetched = await getDriverRoutes(user.uid);
        const mapped = (fetched || []).map((r: any) => ({
          id: r.id,
          name: r.name || '',
          origin: r.origin || '',
          destination: r.destination || '',
          time: r.time || '',
          days: r.days || [],
          seats: r.seats || 4,
          price: r.price ? Number(r.price) : 0,
          active: r.active !== false
        }));
        setMyRoutes(mapped);
      } catch (error) {
        console.error('Error loading driver routes:', error);
      } finally {
        setLoadingRoutes(false);
      }
    };
    fetchRoutes();
  }, [user]);

  // Map state (Mock coordinates for Cancun)
  const originCoords: [number, number] = [21.1390, -86.8350];
  const destCoords: [number, number] = [21.1619, -86.8515];

  const toggleDay = (day: string) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !origin || !destination || !time || days.length === 0 || !price) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const routePayload = {
        name,
        origin,
        destination,
        time,
        days,
        seats: Number(seats),
        price: Number(price),
        driverId: user?.uid,
        driverName: userData?.displayName || userData?.name || 'Conductor',
        driverRating: userData?.rating || 5.0,
        vehicle: userData?.vehicle || 'Vehículo',
        plates: userData?.plates || '',
        color: userData?.color || '',
        capacity: userData?.capacity || '4',
        driverPhotoURL: userData?.photoURL || null
      };

      const newRouteId = await createRoute(routePayload);

      const newRoute: RouteData = {
        id: newRouteId,
        name,
        origin,
        destination,
        time,
        days,
        seats,
        price: Number(price),
        active: true
      };

      setMyRoutes([newRoute, ...myRoutes]);
      alert('¡Ruta creada y publicada con éxito en la base de datos!');

      // Reset form
      setName('');
      setOrigin('');
      setDestination('');
      setTime('');
      setDays([]);
      setSeats(4);
      setPrice('');
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Hubo un error al crear la ruta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (routeId: string, currentActive: boolean) => {
    const nextState = !currentActive;
    try {
      await toggleRouteActive(routeId, nextState);
      setMyRoutes(prev => prev.map(r => r.id === routeId ? { ...r, active: nextState } : r));
      setDeactivatingRouteId(null);
    } catch (error) {
      console.error('Error al cambiar estado de la ruta:', error);
      alert('Hubo un error al cambiar el estado de la ruta.');
    }
  };

  const handleDelete = async (routeId: string) => {
    try {
      await deleteRoute(routeId);
      setMyRoutes(prev => prev.filter(r => r.id !== routeId));
      setDeletingRouteId(null);
    } catch (error) {
      console.error('Error al eliminar la ruta:', error);
      alert('Hubo un error al eliminar la ruta.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 pb-24 font-sans text-[#2d3748] dark:text-zinc-100 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Crear Ruta</h1>
      </header>

      <main className="p-4 md:p-8 max-w-[800px] mx-auto">
        
        {/* Formulario */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-5 md:p-8 mb-8 transition-colors duration-200">
          <form onSubmit={handleCreateRoute} className="space-y-6">
            
            {/* Mapa de previsualización - Oculto temporalmente */}
            <div className="w-full bg-gradient-to-r from-[#00d4aa]/5 to-emerald-500/5 dark:from-zinc-800 dark:to-zinc-800/80 rounded-xl p-6 border border-dashed border-gray-300 dark:border-zinc-700 flex flex-col justify-center items-center text-center">
              <MapIcon size={32} className="text-[#00d4aa] mb-2 shrink-0" />
              <p className="text-xs font-black text-[#2d3748] dark:text-zinc-100 uppercase tracking-widest">Trayecto Escolar Estimado</p>
              <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-1.5 max-w-[400px]">
                {origin || destination ? (
                  <span className="font-medium">
                    <span className="text-[#00d4aa] font-bold">{origin || 'Origen no especificado'}</span>
                    <span className="mx-2">➔</span>
                    <span className="text-rose-500 font-bold">{destination || 'Destino no especificado'}</span>
                  </span>
                ) : (
                  'Ingresa el punto de origen y llegada para trazar la ruta del campus.'
                )}
              </p>
            </div>

            {/* Nombre de la ruta */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <MapPin size={14} /> Nombre de la ruta
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ruta Universidad - Centro"
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
              />
            </div>

            {/* Origen */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <MapPin size={14} /> Origen
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Punto de partida"
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 pl-4 pr-12 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#00d4aa] rounded-lg flex items-center justify-center text-white hover:bg-[#00bfa0] transition-colors">
                  <Target size={18} />
                </button>
              </div>
            </div>

            {/* Destino */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <Navigation size={14} /> Destino
              </label>
              <input 
                type="text" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Punto de llegada"
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
              />
            </div>

            {/* Horario */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <Clock size={14} /> Horario de salida
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px] appearance-none"
                />
                <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Días de la semana */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <Clock size={14} /> Días de la semana
              </label>
              <div className="flex justify-between gap-2">
                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-colors ${
                      days.includes(day) 
                        ? 'bg-[#00d4aa] text-white shadow-sm shadow-[#00d4aa]/30' 
                        : 'bg-[#f4f6f9] dark:bg-zinc-900 text-[#718096] dark:text-zinc-400 hover:bg-[#e2e8f0] dark:hover:bg-zinc-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Asientos */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <Users size={14} /> Asientos disponibles
              </label>
              <input 
                type="number" 
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                min={1}
                max={8}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
              />
            </div>

            {/* Precio */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                <DollarSign size={14} /> Precio por pasajero
              </label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej: 25"
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6 shadow-md shadow-[#00d4aa]/20 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  CREANDO RUTA...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  CREAR RUTA
                </>
              )}
            </button>

          </form>
        </div>

        {/* Mis Rutas */}
        <div>
          <h2 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100 mb-4 px-1">Mis Rutas</h2>
          
          {loadingRoutes ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Loader2 size={36} className="text-[#00d4aa] animate-spin mb-4" />
              <p className="text-[#718096] dark:text-zinc-400 font-medium text-[14px]">Cargando tus rutas...</p>
            </div>
          ) : myRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center opacity-60 py-10">
              <MapIcon size={56} className="text-[#a0aec0] dark:text-zinc-500 mb-4" />
              <p className="text-[#718096] dark:text-zinc-400 font-medium text-[14px]">No has creado ninguna ruta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRoutes.map((route) => (
                <div key={route.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px]">{route.name}</h3>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                        route.active !== false 
                          ? 'bg-[#00d4aa]/10 text-[#00d4aa]' 
                          : 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
                      }`}>
                        {route.active !== false ? 'Activa' : 'Completada / Inactiva'}
                      </span>
                    </div>
                    <span className="text-[#00d4aa] font-bold text-[18px]">${route.price}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[14px] text-[#4a5568] dark:text-zinc-300">
                      <MapPin size={16} className="text-[#00d4aa]" />
                      <span className="truncate">{route.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] text-[#4a5568] dark:text-zinc-300">
                      <Navigation size={16} className="text-[#e74c3c]" />
                      <span className="truncate">{route.destination}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-700 pt-3">
                    <div className="flex items-center gap-3 text-[12px] text-[#718096] dark:text-zinc-400 font-medium">
                      <span className="flex items-center gap-1"><Clock size={14}/> {route.time}</span>
                      <span className="flex items-center gap-1"><Users size={14}/> {route.seats} lugares</span>
                    </div>
                    <div className="flex gap-1">
                      {route.days.map(d => (
                        <span key={d} className="text-[9px] font-bold bg-[#f0f2f5] dark:bg-zinc-900 text-[#718096] dark:text-zinc-400 px-1.5 py-0.5 rounded">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700">
                    {deactivatingRouteId === route.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mr-1">
                          ¿{route.active !== false ? 'Desactivar' : 'Activar'} de inmediato?
                        </span>
                        <button
                          onClick={() => handleToggleActive(route.id, route.active !== false)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Sí, cambiar
                        </button>
                        <button
                          onClick={() => setDeactivatingRouteId(null)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-[#4a5568] dark:text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-200/50 dark:border-zinc-600"
                        >
                          No
                        </button>
                      </div>
                    ) : deletingRouteId === route.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-rose-500 font-bold mr-1">¿Eliminar permanentemente?</span>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setDeletingRouteId(null)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-[#4a5568] dark:text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-200/50 dark:border-zinc-600"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setDeactivatingRouteId(route.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            route.active !== false
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-[#00d4aa]/10 hover:bg-[#00d4aa]/20 text-[#00d4aa]'
                          }`}
                        >
                          <Power size={14} className="shrink-0" />
                          {route.active !== false ? 'Desactivar / Cancelar' : 'Activar Ruta'}
                        </button>
                        <button
                          onClick={() => setDeletingRouteId(route.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 size={14} className="shrink-0" />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
