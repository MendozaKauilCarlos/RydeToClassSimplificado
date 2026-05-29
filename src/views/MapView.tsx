import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  MapPin, 
  Route as RouteIcon, 
  Target, 
  Play, 
  CarFront, 
  Key, 
  HelpCircle, 
  ExternalLink, 
  ArrowRight, 
  Zap, 
  Users, 
  Star, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { APIProvider, Map as GoogleMap, AdvancedMarker as GoogleMarker, useMap as useGoogleMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { useAuth } from '../context/AuthContext';
import { MapErrorBoundary } from '../components/MapErrorBoundary';
import { GeolocationNotice } from '../components/GeolocationNotice';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { createTrip, updateTripStatus } from '../services/db';

// Safe check for Google Maps API Key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

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

// Custom red marker for destination
const customRedIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #e74c3c; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

// Markers for Active Drivers and Active Passengers on Map
const customRouteOriginIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 10px; font-weight: bold; line-height: 1;">🚗</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12]
});

const customPassengerRequestIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #8b5cf6; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 10px; font-weight: bold; line-height: 1;">👤</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12]
});

// Cancun Geocoding Locations helper
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

const mapStatusLabel = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'PENDING' || s === 'REQUESTED' || s === 'SOLICITADO') return 'SOLICITADO / PENDIENTE';
  if (s === 'IN_PROGRESS' || s === 'EN_PROGRESO' || s === 'PICKING_UP' || s === 'IN_TRANSIT') return 'EN MARCHA';
  if (s === 'COMPLETED' || s === 'COMPLETADO') return 'COMPLETADO';
  if (s === 'CANCELLED' || s === 'CANCELADO' || s === 'RECHAZADO') return 'CANCELADO';
  return s;
};

// Component to handle routing (Leaflet fallback)
function Routing({ origin, destination, fallbackActive }: { origin: [number, number] | null, destination: [number, number] | null, fallbackActive: (active: boolean) => void }) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !origin || !destination) return;

    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.warn("Error removing control:", e);
      }
    }

    // Check if Routing exists on L
    const hasRouting = !!(L as any).Routing;
    if (!hasRouting) {
      fallbackActive(true);
      return;
    }

    try {
      const waypoints = [
        L.latLng(origin[0], origin[1]),
        L.latLng(destination[0], destination[1])
      ];

      const routingControl = (L as any).Routing.control({
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
      fallbackActive(false);
    } catch (err) {
      console.error("Routing control creation error:", err);
      fallbackActive(true);
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [map, origin, destination, fallbackActive]);

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

// Google Maps Helper Components
interface LatLngLiteral {
  lat: number;
  lng: number;
}

function RecenterGoogleMap({ lat, lng }: { lat: number, lng: number }) {
  const map = useGoogleMap();
  useEffect(() => {
    if (map) {
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);
  return null;
}

function GoogleMapPolyline({ positions, color = '#00d4aa', weight = 5 }: { positions: LatLngLiteral[], color?: string, weight?: number }) {
  const map = useGoogleMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    polylineRef.current = new google.maps.Polyline({
      path: positions,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: weight,
    });
    polylineRef.current.setMap(map);
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, positions, color, weight]);

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
  const { user, userData } = useAuth();
  
  // Default coordinates from the screenshot (Cancun)
  const [position, setPosition] = useState<[number, number]>([21.1390, -86.8350]);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [useFallbackLine, setUseFallbackLine] = useState(true);
  const [showGoogleMaps, setShowGoogleMaps] = useState(false);

  // States for real-time live exploration
  const [activeRoutes, setActiveRoutes] = useState<any[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<any[]>([]);
  const [explorationTab, setExplorationTab] = useState<'routes' | 'trips'>('routes');
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'route' | 'trip', data: any } | null>(null);
  const [activeUserTrip, setActiveUserTrip] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time listener: Active driver routes
  useEffect(() => {
    const qRoutes = query(
      collection(db, 'routes'),
      where('active', '==', true)
    );
    const unsubscribe = onSnapshot(qRoutes, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveRoutes(list);
    }, (err) => {
      console.error("Error subscribing to active routes:", err);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener: Passenger customized requested trips (pending approval)
  useEffect(() => {
    const qTrips = query(
      collection(db, 'trips'),
      where('status', 'in', ['pending', 'requested', 'SOLICITADO'])
    );
    const unsubscribe = onSnapshot(qTrips, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPassengerRequests(list);
    }, (err) => {
      console.error("Error subscribing to passenger requests:", err);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener: Active user trip (in progress / marching)
  useEffect(() => {
    if (!user?.uid) return;
    const isDriver = userData?.role === 'driver';
    const q = query(
      collection(db, 'trips'),
      where(isDriver ? 'driverId' : 'passengerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdTime = 0;
        if (data.createdAt?.toMillis) {
          createdTime = data.createdAt.toMillis();
        } else if (data.createdAt?.seconds) {
          createdTime = data.createdAt.seconds * 1000;
        } else if (data.createdAt) {
          createdTime = new Date(data.createdAt).getTime();
        }
        return { id: doc.id, ...data, _createdTime: createdTime };
      });
      
      // Sort in descending order of creation so we track the newest trip!
      list.sort((a, b) => b._createdTime - a._createdTime);
      
      // Find the first journey that is pending, requested, or in progress
      const tracking = list.find((t: any) => 
        ['in_progress', 'picking_up', 'in_transit', 'pending', 'requested'].includes(t.status?.toLowerCase())
      );
      setActiveUserTrip(tracking || null);
    }, (err) => {
      console.error("Error subscribing to active user journeys:", err);
    });
    return () => unsubscribe();
  }, [user, userData]);

  // Handle passenger booking a selected route
  const handleSelectQuickRoute = async (routeData: any) => {
    setIsSubmitting(true);
    try {
      await createTrip({
        type: 'rapido',
        origin: routeData.origin,
        destination: routeData.destination,
        passengers: 1,
        driverId: routeData.driverId,
        driverName: routeData.driverName || 'Conductor',
        price: routeData.price || 15,
        time: routeData.time || '12:00',
        routeId: routeData.id,
        passengerName: userData?.displayName || userData?.name || 'Pasajero',
        status: 'in_progress' // Set status to in_progress immediately for instant active trip realism!
      });
      alert('¡Tu viaje ha sido reservado e iniciado con éxito! Puedes monitorearlo en directo en el mapa.');
      setSelectedEntity(null);
    } catch (err) {
      console.error("Error booking selected route from map:", err);
      alert("No se pudo reservar el asiento. Por favor reintente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle driver accepting a requested student trip
  const handleAcceptPassengerRequest = async (tripData: any) => {
    setIsSubmitting(true);
    try {
      await updateTripStatus(tripData.id, 'in_progress', {
        driverId: user?.uid || 'Conductor',
        driverName: userData?.displayName || userData?.name || 'Conductor',
        driverPhotoURL: userData?.photoURL || null,
        driverRating: userData?.rating || 5.0,
        vehicle: userData?.vehicle || 'Vehículo',
        car: userData?.vehicle || 'Vehículo'
      });
      alert('¡Has aceptado este viaje con éxito! Se ha marcado en marcha en el mapa.');
      setSelectedEntity(null);
    } catch (err) {
      console.error("Error accepting student request from map:", err);
      alert("Hubo un error al aceptar esta solicitud de viaje.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    // Simulated school route to the Cancun Tech Campus
    setDestination([21.1326, -86.9225]);
    setIsRouting(true);
  };

  // Dynamically choose route endpoints to display on the map
  let mapOrigin: [number, number] | null = null;
  let mapDest: [number, number] | null = null;
  let routeLabel = "Sin ruta seleccionada";

  if (activeUserTrip) {
    mapOrigin = getCoordinatesForAddress(activeUserTrip.origin);
    mapDest = getCoordinatesForAddress(activeUserTrip.destination);
    routeLabel = `Viajando: ${activeUserTrip.origin?.split(',')[0]} → ${activeUserTrip.destination?.split(',')[0]}`;
  } else if (selectedEntity) {
    mapOrigin = getCoordinatesForAddress(selectedEntity.data.origin);
    mapDest = getCoordinatesForAddress(selectedEntity.data.destination);
    routeLabel = `Ruta de: ${selectedEntity.data.driverName || selectedEntity.data.passengerName}`;
  } else if (destination) {
    mapOrigin = position;
    mapDest = destination;
    routeLabel = "Camino al Instituto Tecnológico de Cancún";
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans flex flex-col transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm animate-fade-in">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Header Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#718096] dark:text-zinc-400 font-medium">¡Buenas tardes!</span>
            <span className="text-[13px] font-bold text-[#2d3748] dark:text-zinc-100 uppercase tracking-wide">{userData?.displayName || 'USUARIO'}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        
        <h1 className="text-[28px] font-bold text-[#2d3748] dark:text-zinc-100 mb-6">Mapa de Viajes</h1>

        {/* Aviso de Seguridad de Geolocalización */}
        <GeolocationNotice 
          onPermissionGranted={(coords) => setPosition(coords)} 
          className="mb-6"
        />

        {/* Contenedor del Mapa */}
        <div className="relative w-full h-[50vh] min-h-[400px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex-1 transition-colors duration-200">
          
          {/* Overlays (Cajas flotantes) */}
          <div className="absolute top-4 left-4 right-4 z-[400] space-y-3 pointer-events-none">
            
            {/* Caja de Coordenadas */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 shadow-md flex items-center gap-3 pointer-events-auto border border-gray-100 dark:border-zinc-700 transition-colors duration-200 w-fit">
              <MapPin className="text-[#00d4aa] shrink-0" size={18} />
              <span className="text-[14px] text-[#2d3748] dark:text-zinc-100 font-medium truncate">
                Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
              </span>
            </div>

            {/* Caja de Ruta Activa */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 shadow-md flex items-center gap-3 pointer-events-auto border border-gray-100 dark:border-zinc-700 transition-colors duration-200 w-fit">
              <RouteIcon className="text-[#00d4aa] shrink-0" size={18} />
              <span className="text-[14px] text-[#2d3748] dark:text-zinc-100 font-medium truncate max-w-[280px]">
                {routeLabel}
              </span>
            </div>

          </div>

          {/* Selector de Mapa flotante */}
          <div className="absolute top-4 right-4 z-[400] flex gap-1 pointer-events-auto bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-100 dark:border-zinc-700 transition-all">
            <button 
              type="button"
              onClick={() => setShowGoogleMaps(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showGoogleMaps 
                  ? 'bg-[#00d4aa] text-white shadow-sm' 
                  : 'text-[#4a5568] dark:text-zinc-400 hover:text-[#00d4aa]'
              }`}
            >
              Google Maps
            </button>
            <button 
              type="button"
              onClick={() => setShowGoogleMaps(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !showGoogleMaps 
                  ? 'bg-[#00d4aa] text-white shadow-sm' 
                  : 'text-[#4a5568] dark:text-zinc-400 hover:text-[#00d4aa]'
              }`}
            >
              Leaflet (Libre)
            </button>
          </div>

          {/* Botón Flotante de Ubicación */}
          <button 
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="absolute bottom-6 right-4 z-[400] bg-white dark:bg-zinc-800 p-3.5 rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 text-[#4a5568] dark:text-zinc-300 hover:text-[#00d4aa] dark:hover:text-[#00d4aa] transition-colors disabled:opacity-50 cursor-pointer animate-fade-in"
          >
            <Target size={24} className={isLocating ? "animate-spin" : ""} />
          </button>

          {/* Render del mapa condicional */}
          {showGoogleMaps ? (
            hasValidKey ? (
              <MapErrorBoundary fallbackToLeaflet={() => setShowGoogleMaps(false)} showLeafletOption={true}>
                <APIProvider apiKey={API_KEY} version="weekly">
                  <GoogleMap
                    defaultCenter={{ lat: position[0], lng: position[1] }}
                    defaultZoom={13}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                    disableDefaultUI={true}
                  >
                    {/* User Marker */}
                    <GoogleMarker position={{ lat: position[0], lng: position[1] }}>
                      <div style={{
                        backgroundColor: '#00d4aa',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        transform: 'translate(-50%, -50%)',
                      }} />
                    </GoogleMarker>

                    {/* Active Driver Route origins for Google Maps */}
                    {activeRoutes.map((route) => {
                      const coord = getCoordinatesForAddress(route.origin);
                      const isSelected = selectedEntity?.type === 'route' && selectedEntity.data.id === route.id;
                      return (
                        <GoogleMarker 
                          key={`google-route-${route.id}`} 
                          position={{ lat: coord[0], lng: coord[1] }}
                          onClick={() => setSelectedEntity({ type: 'route', data: route })}
                        >
                          <div style={{
                            backgroundColor: isSelected ? '#00d4aa' : '#3b82f6',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px',
                            transform: 'translate(-50%, -50%)',
                            cursor: 'pointer'
                          }}>
                            🚗
                          </div>
                        </GoogleMarker>
                      );
                    })}

                    {/* Active Passenger Request origins for Google Maps */}
                    {userData?.role === 'driver' && passengerRequests.map((trip) => {
                      const coord = getCoordinatesForAddress(trip.origin);
                      const isSelected = selectedEntity?.type === 'trip' && selectedEntity.data.id === trip.id;
                      return (
                        <GoogleMarker 
                          key={`google-trip-${trip.id}`} 
                          position={{ lat: coord[0], lng: coord[1] }}
                          onClick={() => setSelectedEntity({ type: 'trip', data: trip })}
                        >
                          <div style={{
                            backgroundColor: isSelected ? '#00d4aa' : '#8b5cf6',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px',
                            transform: 'translate(-50%, -50%)',
                            cursor: 'pointer'
                          }}>
                            👤
                          </div>
                        </GoogleMarker>
                      );
                    })}

                    {/* Primary Route trace on Google Maps */}
                    {mapOrigin && mapDest && (
                      <>
                        <GoogleMarker position={{ lat: mapOrigin[0], lng: mapOrigin[1] }}>
                          <div style={{
                            backgroundColor: '#00d4aa',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '3px solid white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            transform: 'translate(-50%, -50%)',
                          }} />
                        </GoogleMarker>
                        <GoogleMarker position={{ lat: mapDest[0], lng: mapDest[1] }}>
                          <div style={{
                            backgroundColor: '#e74c3c',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '3px solid white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            transform: 'translate(-50%, -50%)',
                          }} />
                        </GoogleMarker>
                        <GoogleMapPolyline 
                          positions={[
                            { lat: mapOrigin[0], lng: mapOrigin[1] },
                            { lat: mapDest[0], lng: mapDest[1] }
                          ]}
                        />
                        <RecenterGoogleMap lat={mapOrigin[0]} lng={mapOrigin[1]} />
                      </>
                    )}
                  </GoogleMap>
                </APIProvider>
              </MapErrorBoundary>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-800 text-[#2d3748] dark:text-zinc-100 text-center animate-fade-in transition-colors overflow-y-auto">
                <div className="max-w-[480px] my-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[#00d4aa] flex items-center justify-center mx-auto mb-3">
                    <Key size={24} />
                  </div>
                  <h3 className="text-[18px] font-black tracking-tight text-[#2d3748] dark:text-zinc-100 mb-1">Clave API de Google Maps Requerida</h3>
                  <p className="text-[11px] text-[#718096] dark:text-zinc-400 font-medium leading-relaxed mb-4">
                    Para visualizar el mapa interactivo de forma segura en la vista previa, necesitas ingresar una Clave API de Google Maps.
                  </p>
                  
                  <div className="text-left space-y-2 text-[11px] bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-xl p-3 mb-4">
                    <div className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-[#00d4aa]/10 text-[#00d4aa] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="font-bold">Obtén tu API Key:</p>
                        <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-[#00d4aa] underline font-medium hover:text-[#00bfa0] inline-flex items-center gap-0.5">
                          Consola Google Cloud <ExternalLink size={8} />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-[#00d4aa]/10 text-[#00d4aa] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="font-bold">Agrégala a tus Secretos de AI Studio:</p>
                        <p className="text-gray-500 dark:text-zinc-400 leading-normal">
                          Presiona el icono del engrane ⚙️ <strong>Settings</strong> arriba a la derecha → ve a <strong>Secrets</strong> → agrega <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[#00d4aa] font-semibold">GOOGLE_MAPS_PLATFORM_KEY</code> y pega tu value allí.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowGoogleMaps(false)}
                      className="text-[12px] bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-[#4a5568] dark:text-zinc-300 font-bold px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      Ver con Leaflet alternativo
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <MapContainer 
              center={position} 
              zoom={13} 
              scrollWheelZoom={true} 
              className="w-full h-full z-0"
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="dark:brightness-75 dark:contrast-125 dark:hue-rotate-180 dark:invert"
              />
              
              {/* Center Current Location Pin */}
              <Marker position={position} icon={customGreenIcon}>
                <Popup className="custom-popup">
                  <div className="font-bold text-[#2d3748] text-center px-1 py-0.5 text-xs">Tu ubicación</div>
                </Popup>
              </Marker>

              {/* Live Active Driver Route Pins */}
              {activeRoutes.map((route) => {
                const routeOrigin = getCoordinatesForAddress(route.origin);
                const isSelected = selectedEntity?.type === 'route' && selectedEntity.data.id === route.id;
                return (
                  <Marker 
                    key={`route-${route.id}`} 
                    position={routeOrigin} 
                    icon={isSelected ? customGreenIcon : customRouteOriginIcon}
                    eventHandlers={{
                      click: () => setSelectedEntity({ type: 'route', data: route })
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="font-bold text-[#2d3748] text-xs">🚗 Conductor: {route.driverName}</div>
                      <div className="text-[10px] text-gray-500 mt-1">Origen: {route.origin}</div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Live Active Student Trip Request Pins (Only for drivers) */}
              {userData?.role === 'driver' && passengerRequests.map((trip) => {
                const tripOrigin = getCoordinatesForAddress(trip.origin);
                const isSelected = selectedEntity?.type === 'trip' && selectedEntity.data.id === trip.id;
                return (
                  <Marker 
                    key={`request-${trip.id}`} 
                    position={tripOrigin} 
                    icon={isSelected ? customGreenIcon : customPassengerRequestIcon}
                    eventHandlers={{
                      click: () => setSelectedEntity({ type: 'trip', data: trip })
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="font-bold text-[#2d3748] text-xs">👤 Solicitud: {trip.passengerName}</div>
                      <div className="text-[10px] text-gray-500 mt-1">Busca transporte a: {trip.destination}</div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Tracing Chosen Origin & Destination */}
              {mapOrigin && mapDest && (
                <>
                  <Marker position={mapOrigin} icon={customGreenIcon} />
                  <Marker position={mapDest} icon={customRedIcon} />
                  {useFallbackLine && (
                    <Polyline
                      positions={[mapOrigin, mapDest]}
                      color="#00d4aa"
                      weight={5}
                      opacity={0.8}
                      dashArray="10, 10"
                    />
                  )}
                  <Routing origin={mapOrigin} destination={mapDest} fallbackActive={setUseFallbackLine} />
                  <RecenterAutomatically lat={mapOrigin[0]} lng={mapOrigin[1]} />
                </>
              )}

              <InvalidateMapSize />
            </MapContainer>
          )}

        </div>

        {/* Dynamic Details Panel OUTSIDE of the Map - Beautiful Bento layout below Map */}
        <div className="mt-4 transition-all duration-300">
          {activeUserTrip ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-5 border border-emerald-500/10 dark:border-zinc-700 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-gray-100 dark:border-zinc-805 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${activeUserTrip.status === 'pending' || activeUserTrip.status === 'requested' ? 'bg-amber-100 text-amber-600 dark:bg-amber-95/20 dark:text-amber-400' : 'bg-emerald-50 text-[#00d4aa] dark:bg-[#00d4aa]/10 dark:text-[#00d4aa]'} rounded-full flex items-center justify-center shrink-0`}>
                    <CarFront size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Tu Viaje Escolar</span>
                    <h3 className="font-extrabold text-[#2d3748] dark:text-zinc-100 text-sm flex items-center gap-1.5 leading-none mt-0.5">
                      {activeUserTrip.status === 'pending' || activeUserTrip.status === 'requested' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          Solicitud Pendiente
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse"></span>
                          Viaje en Marcha
                        </>
                      )}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[18px] font-black text-[#00d4aa] block">${activeUserTrip.price || 15}</span>
                  <span className="text-[10px] text-gray-500 font-bold block">Horario: {activeUserTrip.time || 'Ahora'}</span>
                </div>
              </div>

              {/* Origen / Destino Details */}
              <div className="bg-[#f8fafc] dark:bg-zinc-950 p-3 rounded-xl mb-4 text-xs font-medium space-y-1.5 text-gray-600 dark:text-zinc-400 leading-normal border border-gray-100 dark:border-zinc-850">
                <div className="truncate">📍 <strong>De:</strong> {activeUserTrip.origin}</div>
                <div className="truncate">🏁 <strong>A:</strong> {activeUserTrip.destination}</div>
              </div>

              {/* Conductor Details Section */}
              {activeUserTrip.status === 'pending' || activeUserTrip.status === 'requested' ? (
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/25 p-3.5 rounded-xl mb-4 text-xs">
                  <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                    🔍 Esperando Conductor
                  </p>
                  <p className="text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Se ha publicado tu solicitud para este trayecto. Te avisaremos en cuanto el conductor del transporte escolar la acepte e inicie el viaje.
                  </p>
                </div>
              ) : (
                <div className="bg-sky-50/40 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-900/25 p-3.5 rounded-xl mb-4 text-xs flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 text-sky-600 dark:bg-sky-950/30 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    👨‍✈️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sky-700 dark:text-sky-450 leading-none mb-1">
                      Conductor Asignado: {activeUserTrip.driverName || 'Conductor Escolar'}
                    </p>
                    <p className="text-gray-500 dark:text-zinc-400 font-medium">
                      Vehículo: {activeUserTrip.vehicle || 'Vehículo de Transporte Escolar'} • Activo
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel Button */}
              <button 
                type="button"
                onClick={async () => {
                  if (window.confirm("¿Seguro que deseas cancelar este viaje?")) {
                    try {
                      await updateTripStatus(activeUserTrip.id, 'CANCELADO');
                      alert('El viaje ha sido cancelado exitosamente.');
                    } catch (e) {
                      console.error("Error cancelling active trip:", e);
                    }
                  }
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 font-bold py-3.5 rounded-xl transition-colors text-xs cursor-pointer text-center"
              >
                Cancelar Viaje
              </button>
            </div>
          ) : selectedEntity ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-5 border border-purple-500/20 dark:border-zinc-700 animate-slide-up">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-[#00d4aa] bg-[#00d4aa]/10 px-2.5 py-1 rounded-md">
                  {selectedEntity.type === 'route' ? 'Ruta de Conductor Registrado' : 'Solicitud Abierta de Alumno'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-xs font-bold bg-gray-50 dark:bg-zinc-800 cursor-pointer px-2.5 py-1 rounded-md"
                >
                  Cerrar Detalles [X]
                </button>
              </div>

              {selectedEntity.type === 'route' ? (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 rounded-full flex items-center justify-center shrink-0">
                      <CarFront size={24} className="text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[#2d3748] dark:text-zinc-100 text-[15px] truncate uppercase tracking-tight font-sans">
                        {selectedEntity.data.driverName}
                      </h3>
                      <p className="text-[11px] text-[#718096] dark:text-zinc-400 font-bold flex items-center gap-1 mt-0.5">
                        ⭐ {selectedEntity.data.driverRating || 5.0} • {selectedEntity.data.vehicle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#00d4aa] text-[22px] leading-none">${selectedEntity.data.price}</p>
                      <p className="text-[11px] text-[#718096] dark:text-zinc-400 font-bold mt-1">Salida: {selectedEntity.data.time}</p>
                    </div>
                  </div>

                  <div className="text-[12px] space-y-2 bg-[#f8fafc] dark:bg-zinc-950 p-3 rounded-xl mb-4 text-gray-600 dark:text-zinc-400 font-medium border border-gray-100 dark:border-zinc-850 leading-normal">
                    <div className="truncate">📍 <strong className="text-gray-700 dark:text-zinc-200">Origen:</strong> {selectedEntity.data.origin}</div>
                    <div className="truncate">🏁 <strong className="text-gray-700 dark:text-zinc-200">Destino:</strong> {selectedEntity.data.destination}</div>
                  </div>

                  {user?.uid === selectedEntity.data.driverId ? (
                    <div className="text-center py-3 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-xs font-bold rounded-xl border border-gray-250/10">
                      Esta es tu propia ruta creada
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSelectQuickRoute(selectedEntity.data)}
                      className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Zap size={16} className="fill-white" />
                      {isSubmitting ? 'RESERVANDO...' : 'RESERVAR ASIENTO EN ESTA RUTA'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center shrink-0">
                      <User size={24} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[#2d3748] dark:text-zinc-100 text-[15px] truncate uppercase tracking-tight font-sans">
                        {selectedEntity.data.passengerName}
                      </h3>
                      <p className="text-[11px] text-[#718096] dark:text-zinc-400 font-bold flex items-center gap-1.5 mt-0.5 animate-pulse font-sans">
                        👥 {selectedEntity.data.passengers || 1} Personas buscando viaje
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#00d4aa] text-[22px] leading-none">${selectedEntity.data.price || 40}</p>
                      <p className="text-[11px] text-[#718096] dark:text-zinc-400 font-bold mt-1">{selectedEntity.data.time || 'Ahora'}</p>
                    </div>
                  </div>

                  <div className="text-[12px] space-y-2 bg-[#f8fafc] dark:bg-zinc-950 p-3 rounded-xl mb-4 text-gray-600 dark:text-zinc-400 font-medium border border-gray-100 dark:border-zinc-850 leading-normal">
                    <div className="truncate">📍 <strong className="text-gray-700 dark:text-zinc-200">Origen:</strong> {selectedEntity.data.origin}</div>
                    <div className="truncate">🏁 <strong className="text-gray-700 dark:text-zinc-200">Destino:</strong> {selectedEntity.data.destination}</div>
                  </div>

                  {userData?.role !== 'driver' ? (
                    <div className="text-center py-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-900/30 leading-snug">
                      ⚠️ Necesitas el rol de Conductor para aceptar esta solicitud de alumno
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleAcceptPassengerRequest(selectedEntity.data)}
                      className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle size={16} />
                      {isSubmitting ? 'ACEPTANDO...' : 'ACEPTAR SOLICITUD Y EMPEZAR VIAJE'}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : isRouting ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-zinc-700 animate-slide-up">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-zinc-805 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-teal-50 dark:bg-teal-500/10 rounded-full flex items-center justify-center shrink-0">
                    <CarFront size={22} className="text-[#00d4aa]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#2d3748] dark:text-zinc-100 text-sm">Ruta Activa Demostrativa</h3>
                    <p className="text-xs text-[#718096] dark:text-zinc-400 font-medium font-sans">Navegación simulada hacia el campus ITC • 4.9 ★</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#00d4aa] text-lg leading-none">12 min</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">Distancia: 4.2 km</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setDestination(null); setIsRouting(false); }}
                className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-[#e11d48]/10 dark:hover:bg-[#e11d48]/20 text-rose-600 dark:text-rose-400 font-bold py-3.5 rounded-xl transition-colors text-xs cursor-pointer text-center"
              >
                Cancelar Simulación Demo
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={handleStartTrip}
              className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all cursor-pointer animate-fade-in"
            >
              <Play size={18} className="fill-white" />
              Simular Ruta Escolar Demo (ITC)
            </button>
          )}

        </div>

        {/* Panel bento de Exploración Interactiva */}
        <div className="mt-6 bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-zinc-700 pb-4 mb-4 gap-2">
            <h2 className="text-[18px] font-extrabold text-[#2d3748] dark:text-zinc-100 flex items-center gap-2">
              <RouteIcon size={20} className="text-[#00d4aa]" />
              Explorar Rutas y Solicitudes en Vivo
            </h2>
            <div className="text-[10px] text-gray-500 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-755/10 rounded-lg px-2.5 py-1 font-bold flex items-center gap-1.5 shrink-0 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse"></span>
              SINCRO EN TIEMPO REAL
            </div>
          </div>

          <div className="flex gap-3 mb-5">
            <button
              onClick={() => {
                setExplorationTab('routes');
                setSelectedEntity(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                explorationTab === 'routes'
                  ? 'bg-sky-50 dark:bg-sky-950/15 text-sky-600 dark:text-sky-450 border-sky-300 dark:border-sky-900'
                  : 'bg-gray-50 dark:bg-zinc-900 text-[#718096] dark:text-zinc-500 hover:text-[#2d3748] dark:hover:text-zinc-300 border-transparent'
              }`}
            >
              <CarFront size={16} />
              Rutas de Conductores ({activeRoutes.length})
            </button>
            {userData?.role === 'driver' && (
              <button
                type="button"
                onClick={() => {
                  setExplorationTab('trips');
                  setSelectedEntity(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                  explorationTab === 'trips'
                    ? 'bg-purple-50 dark:bg-purple-950/15 text-purple-600 dark:text-purple-450 border-purple-300 dark:border-purple-900'
                    : 'bg-gray-50 dark:bg-zinc-900 text-[#718096] dark:text-zinc-500 hover:text-[#2d3748] dark:hover:text-zinc-300 border-transparent'
                }`}
              >
                <Users size={16} />
                Solicitudes de Alumnos ({passengerRequests.length})
              </button>
            )}
          </div>

          {/* Listado de elementos condicional */}
          {explorationTab === 'routes' || userData?.role !== 'driver' ? (
            activeRoutes.length === 0 ? (
              <div className="text-center py-8 text-[#718096] dark:text-zinc-500 bg-gray-50 dark:bg-zinc-850 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
                <p className="font-bold text-sm">No hay rutas publicadas activas en este momento</p>
                <p className="text-[11px] mt-1 max-w-[320px] mx-auto">Los conductores registrados aparecerán aquí tan pronto como publiquen y activen sus recorridos escolares.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeRoutes.map((route) => {
                  const isSelected = selectedEntity?.type === 'route' && selectedEntity.data.id === route.id;
                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedEntity({ type: 'route', data: route })}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-sky-50/50 dark:bg-sky-950/10 border-sky-400 dark:border-sky-850 shadow-sm'
                          : 'bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800/60 border-gray-150 dark:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className="font-extrabold text-[14px] text-[#2d3748] dark:text-zinc-100 truncate">
                            {route.name || 'Ruta Escolar'}
                          </span>
                          <span className="text-[#00d4aa] font-black text-[16px] shrink-0">
                            ${route.price || 15}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-[#00d4aa] rounded-full overflow-hidden shrink-0 border border-white">
                            {route.driverPhotoURL ? (
                              <img src={route.driverPhotoURL} alt={route.driverName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-[9px] font-bold">C</div>
                            )}
                          </div>
                          <span className="text-[11px] text-[#4a5568] dark:text-zinc-300 font-bold truncate">
                            {route.driverName || 'Conductor'} • {route.vehicle || 'Vehículo'}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-[#718096] dark:text-zinc-400 mb-3 font-semibold leading-normal">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-sky-500 shrink-0" />
                            <span className="truncate">De: {route.origin}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ArrowRight size={10} className="text-red-500 shrink-0" />
                            <span className="truncate">A: {route.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-150 dark:border-zinc-800 pt-2.5 mt-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500">
                        <span className="flex items-center gap-1">🕒 {route.time || '12:00'}</span>
                        <span className="text-[#00d4aa] bg-[#00d4aa]/10 px-2 py-0.5 rounded-md text-[9px]">
                          💺 {route.seats || 4} asientos
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            passengerRequests.length === 0 ? (
              <div className="text-center py-8 text-[#718096] dark:text-zinc-500 bg-gray-50 dark:bg-zinc-850 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
                <p className="font-bold text-sm">No hay solicitudes de viaje abiertas</p>
                <p className="text-[11px] mt-1 max-w-[320px] mx-auto">Las solicitudes aparecerán en tiempo real cuando los alumnos busquen viajes personalizados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {passengerRequests.map((trip) => {
                  const isSelected = selectedEntity?.type === 'trip' && selectedEntity.data.id === trip.id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedEntity({ type: 'trip', data: trip })}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-400 dark:border-purple-850 shadow-sm'
                          : 'bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800/60 border-gray-150 dark:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className="font-extrabold text-[14px] text-[#2d3748] dark:text-zinc-100 truncate">
                            Alumno: {trip.passengerName || 'Pasajero'}
                          </span>
                          <span className="text-[#00d4aa] font-black text-[16px] shrink-0">
                            ${trip.price || 40}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-[#718096] dark:text-zinc-400 mb-3 font-semibold leading-normal">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-purple-500 shrink-0" />
                            <span className="truncate">De: {trip.origin}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ArrowRight size={10} className="text-red-500 shrink-0" />
                            <span className="truncate">A: {trip.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-150 dark:border-zinc-800 pt-2.5 mt-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500">
                        <span className="flex items-center gap-1">🕒 {trip.time || 'Ahora'}</span>
                        <span className="text-purple-500 bg-[#8b5cf6]/10 px-2 py-0.5 rounded-md text-[9px]">
                          👥 {trip.passengers || 1} Persona(s)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

      </main>
    </div>
  );
}
