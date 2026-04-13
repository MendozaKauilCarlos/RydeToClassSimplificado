import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation, Clock, Users, DollarSign, Map as MapIcon, Plus, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

export default function DriverCreateRoute() {
  const navigate = useNavigate();
  
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

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !origin || !destination || !time || days.length === 0 || !price) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const newRoute: RouteData = {
      id: Date.now().toString(),
      name,
      origin,
      destination,
      time,
      days,
      seats,
      price: Number(price)
    };

    setMyRoutes([newRoute, ...myRoutes]);
    
    // Reset form
    setName('');
    setOrigin('');
    setDestination('');
    setTime('');
    setDays([]);
    setSeats(4);
    setPrice('');
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
            
            {/* Mapa de previsualización */}
            <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 relative z-0">
              <MapContainer 
                center={[21.1500, -86.8430]} 
                zoom={13} 
                scrollWheelZoom={false} 
                className="w-full h-full"
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="dark:brightness-75 dark:contrast-125 dark:hue-rotate-180 dark:invert"
                />
                <Marker position={originCoords} icon={originIcon}>
                  <Popup>Origen</Popup>
                </Marker>
                <Marker position={destCoords} icon={destIcon}>
                  <Popup>Destino</Popup>
                </Marker>
                <Polyline positions={[originCoords, destCoords]} color="#00d4aa" weight={4} dashArray="5, 10" />
              </MapContainer>
              <div className="absolute top-2 left-2 z-[400] bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-[11px] font-bold text-[#2d3748] dark:text-zinc-100 border border-gray-100 dark:border-zinc-700">
                Previsualización de Ruta
              </div>
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

            <button type="submit" className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6 shadow-md shadow-[#00d4aa]/20 text-[15px]">
              <Plus size={20} />
              CREAR RUTA
            </button>

          </form>
        </div>

        {/* Mis Rutas */}
        <div>
          <h2 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100 mb-4 px-1">Mis Rutas</h2>
          
          {myRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center opacity-60 py-10">
              <MapIcon size={56} className="text-[#a0aec0] dark:text-zinc-500 mb-4" />
              <p className="text-[#718096] dark:text-zinc-400 font-medium text-[14px]">No has creado ninguna ruta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRoutes.map((route) => (
                <div key={route.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px]">{route.name}</h3>
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
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
