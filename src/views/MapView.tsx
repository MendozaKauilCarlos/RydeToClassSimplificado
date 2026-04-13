import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Menu, MapPin, Route as RouteIcon, Target, Play } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

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

// Custom green marker to match the screenshot
const customGreenIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #00d4aa; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

// Component to handle routing
function Routing({ origin, destination }: { origin: [number, number] | null, destination: [number, number] | null }) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map || !origin || !destination) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const waypoints = [
      L.latLng(origin[0], origin[1]),
      L.latLng(destination[0], destination[1])
    ];

    const routingControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      show: false, // Hide the text instructions panel
      lineOptions: {
        styles: [{ color: '#00d4aa', opacity: 0.8, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      createMarker: () => null // We'll use our own markers if needed
    }).addTo(map);

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, origin, destination]);

  return null;
}

// Component to recenter map when location changes
function RecenterAutomatically({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function MapView() {
  // Default coordinates from the screenshot (Cancun)
  const [position, setPosition] = useState<[number, number]>([21.1390, -86.8350]);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  // Function to get real user location
  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setIsLocating(false);
        },
        (err) => {
          console.error("Error getting location:", err);
          alert("No se pudo obtener tu ubicación. Usando ubicación por defecto.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocalización no soportada en este navegador.");
      setIsLocating(false);
    }
  };

  const handleStartTrip = () => {
    // Ejemplo de destino simulado (Tecnológico de Cancún)
    setDestination([21.1326, -86.9225]);
    setIsRouting(true);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans flex flex-col transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-full flex items-center justify-center text-white">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#718096] dark:text-zinc-400 font-medium">¡Buenas tardes!</span>
            <span className="text-[13px] font-bold text-[#2d3748] dark:text-zinc-100 uppercase tracking-wide">PAKO</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative cursor-pointer">
            <Bell size={24} className="text-[#4a5568] dark:text-zinc-300 fill-[#4a5568] dark:fill-zinc-300" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#e74c3c] text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800">3</span>
          </div>
          <Menu size={28} className="text-[#4a5568] dark:text-zinc-300 cursor-pointer" />
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        
        <h1 className="text-[28px] font-bold text-[#2d3748] dark:text-zinc-100 mb-6">Mapa de Viajes</h1>

        {/* Contenedor del Mapa */}
        <div className="relative w-full h-[50vh] min-h-[400px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex-1 transition-colors duration-200">
          
          {/* Overlays (Cajas flotantes) */}
          <div className="absolute top-4 left-4 right-4 z-[400] space-y-3 pointer-events-none">
            
            {/* Caja de Coordenadas */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 shadow-md flex items-center gap-3 pointer-events-auto border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
              <MapPin className="text-[#00d4aa] shrink-0" size={18} />
              <span className="text-[14px] text-[#2d3748] dark:text-zinc-100 font-medium truncate">
                Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
              </span>
            </div>

            {/* Caja de Ruta Activa */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 shadow-md flex items-center gap-3 pointer-events-auto border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
              <RouteIcon className="text-[#00d4aa] shrink-0" size={18} />
              <span className="text-[14px] text-[#2d3748] dark:text-zinc-100 font-medium">
                {isRouting ? "En ruta hacia el destino" : "Sin ruta activa"}
              </span>
            </div>

          </div>

          {/* Botón Flotante de Ubicación */}
          <button 
            onClick={handleLocateMe}
            disabled={isLocating}
            className="absolute bottom-6 right-4 z-[400] bg-white dark:bg-zinc-800 p-3.5 rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 text-[#4a5568] dark:text-zinc-300 hover:text-[#00d4aa] dark:hover:text-[#00d4aa] transition-colors disabled:opacity-50"
          >
            <Target size={24} className={isLocating ? "animate-spin" : ""} />
          </button>

          {/* Mapa de Leaflet */}
          <MapContainer 
            center={position} 
            zoom={15} 
            scrollWheelZoom={true} 
            className="w-full h-full z-0"
            style={{ height: '100%', width: '100%' }}
            zoomControl={false} // Ocultamos el control de zoom por defecto para que se vea más limpio como en la captura
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark:brightness-75 dark:contrast-125 dark:hue-rotate-180 dark:invert"
            />
            <Marker position={position} icon={customGreenIcon}>
              <Popup className="custom-popup">
                <div className="font-bold text-[#2d3748] text-center px-2 py-1">Tu ubicación</div>
              </Popup>
            </Marker>
            {destination && (
              <Marker position={destination} icon={customGreenIcon}>
                <Popup className="custom-popup">
                  <div className="font-bold text-[#2d3748] text-center px-2 py-1">Destino</div>
                </Popup>
              </Marker>
            )}
            <Routing origin={position} destination={destination} />
            <RecenterAutomatically lat={position[0]} lng={position[1]} />
          </MapContainer>
        </div>

        {/* Botón Iniciar Viaje */}
        <button 
          onClick={handleStartTrip}
          className="w-full mt-6 bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-[16px] shadow-md shadow-[#00d4aa]/20 transition-colors"
        >
          <Play size={20} className="fill-white" />
          {isRouting ? "Actualizar Ruta" : "Iniciar Viaje de Prueba"}
        </button>

      </main>
    </div>
  );
}
