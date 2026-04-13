import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation, Phone, MessageCircle, CheckCircle } from 'lucide-react';
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
  const [tripStatus, setTripStatus] = useState<'picking_up' | 'in_transit' | 'completed'>('picking_up');

  // Mock coordinates
  const driverCoords: [number, number] = [21.1390, -86.8350];
  const passengerCoords: [number, number] = [21.1450, -86.8400];
  const destCoords: [number, number] = [21.1619, -86.8515];

  const handleNextStep = () => {
    if (tripStatus === 'picking_up') {
      setTripStatus('in_transit');
    } else if (tripStatus === 'in_transit') {
      setTripStatus('completed');
      alert('¡Viaje completado con éxito!');
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 pb-24 font-sans text-[#2d3748] dark:text-zinc-100 transition-colors duration-200 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-50 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Viaje Activo</h1>
      </header>

      <main className="flex-1 flex flex-col relative">
        
        {/* Mapa */}
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={tripStatus === 'picking_up' ? passengerCoords : destCoords} 
            zoom={14} 
            scrollWheelZoom={true} 
            className="w-full h-full"
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark:brightness-75 dark:contrast-125 dark:hue-rotate-180 dark:invert"
            />
            <Marker position={driverCoords} icon={driverIcon}>
              <Popup>Tu ubicación</Popup>
            </Marker>
            
            {tripStatus === 'picking_up' && (
              <>
                <Marker position={passengerCoords} icon={passengerIcon}>
                  <Popup>Pasajero: María García</Popup>
                </Marker>
                <Polyline positions={[driverCoords, passengerCoords]} color="#3b82f6" weight={5} dashArray="5, 10" />
              </>
            )}

            {tripStatus === 'in_transit' && (
              <>
                <Marker position={destCoords} icon={destIcon}>
                  <Popup>Destino Final</Popup>
                </Marker>
                <Polyline positions={[driverCoords, destCoords]} color="#00d4aa" weight={5} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Panel Inferior Flotante */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 p-5 transition-colors duration-200 max-w-[800px] mx-auto">
            
            {/* Info del Pasajero */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                  MG
                </div>
                <div>
                  <h3 className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px]">María García</h3>
                  <p className="text-[12px] text-[#718096] dark:text-zinc-400 flex items-center gap-1">
                    <CheckCircle size={12} className="text-[#00d4aa]" /> Pasajero verificado
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

            {/* Detalles de la ruta */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-[14px]">
                <MapPin size={18} className={tripStatus === 'picking_up' ? "text-[#3b82f6]" : "text-[#00d4aa]"} />
                <div>
                  <p className="text-[11px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider">
                    {tripStatus === 'picking_up' ? 'Punto de recogida' : 'Destino final'}
                  </p>
                  <p className="font-medium text-[#2d3748] dark:text-zinc-100">
                    {tripStatus === 'picking_up' ? 'Plaza Las Américas' : 'Universidad Tecnológica'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de Acción */}
            <button 
              onClick={handleNextStep}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 text-[15px] ${
                tripStatus === 'picking_up' 
                  ? 'bg-[#3b82f6] hover:bg-blue-600 shadow-blue-500/20' 
                  : 'bg-[#00d4aa] hover:bg-[#00bfa0] shadow-[#00d4aa]/20'
              }`}
            >
              {tripStatus === 'picking_up' ? 'CONFIRMAR RECOGIDA' : 'FINALIZAR VIAJE'}
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}
