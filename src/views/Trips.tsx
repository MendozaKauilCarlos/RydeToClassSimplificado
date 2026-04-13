import React, { useState, useEffect } from 'react';
import { Search, User, MapPin, Flag, Clock, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserTrips, getDriverTrips } from '../services/db';

// Tipos de estado de viaje
type TripStatus = 'COMPLETADO' | 'CANCELADO' | 'SOLICITADO' | 'EN_PROGRESO' | string;

// Interfaz para los datos del viaje
interface Trip {
  id: string;
  status: TripStatus;
  driverId?: string;
  passengerName?: string;
  origin?: string;
  destination?: string;
  time?: string;
  price?: string | number;
  createdAt?: any;
}

export default function Trips() {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['Todos', 'Solicitados', 'En Progreso', 'Completados', 'Cancelados'];

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        // Si es el usuario de demostración, mostrar datos falsos
        if (user?.uid === 'demo-user-123') {
          const mockTrips: Trip[] = [
            {
              id: '1',
              status: 'COMPLETADO',
              driverId: 'Conductor Prueba',
              passengerName: 'Usuario Demo',
              origin: 'Instituto Tecnológico Superior',
              destination: 'Centro',
              time: '19:26',
              price: '$42'
            },
            {
              id: '2',
              status: 'EN_PROGRESO',
              driverId: 'Conductor Prueba',
              passengerName: 'Usuario Demo',
              origin: 'Plaza Las Américas',
              destination: 'Universidad Tecnológica',
              time: '14:30',
              price: '$80'
            },
            {
              id: '3',
              status: 'CANCELADO',
              driverId: 'Buscando...',
              passengerName: 'Usuario Demo',
              origin: 'Terminal ADO',
              destination: 'Zona Hotelera Km 9',
              time: '10:22',
              price: '$159'
            }
          ];
          setTrips(mockTrips);
          setLoading(false);
          return;
        }

        let fetchedTrips = [];
        if (userData?.role === 'driver') {
          fetchedTrips = await getDriverTrips();
        } else {
          fetchedTrips = await getUserTrips();
        }
        
        // Mapear los datos de Firebase a nuestra interfaz
        const formattedTrips = fetchedTrips.map((t: any) => ({
          id: t.id,
          status: t.status ? t.status.toUpperCase() : 'SOLICITADO',
          driverId: t.driverId || 'Buscando...',
          passengerName: t.passengerName || 'Pasajero',
          origin: t.origin || 'Origen no especificado',
          destination: t.destination || 'Destino no especificado',
          time: t.time || (t.createdAt ? new Date(t.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'),
          price: t.price ? `$${t.price}` : 'Pendiente'
        }));
        
        setTrips(formattedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user, userData]);

  // Filtrar viajes según el tab activo y la búsqueda
  const filteredTrips = trips.filter(trip => {
    const matchesTab = 
      activeTab === 'Todos' ? true :
      activeTab === 'Solicitados' ? trip.status === 'SOLICITADO' || trip.status === 'REQUESTED' :
      activeTab === 'En Progreso' ? trip.status === 'EN_PROGRESO' || trip.status === 'IN_PROGRESS' :
      activeTab === 'Completados' ? trip.status === 'COMPLETADO' || trip.status === 'COMPLETED' :
      activeTab === 'Cancelados' ? trip.status === 'CANCELADO' || trip.status === 'CANCELLED' : true;
      
    const matchesSearch = 
      (trip.origin?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (trip.destination?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (trip.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
    return matchesTab && matchesSearch;
  });

  // Calcular estadísticas
  const totalTrips = trips.length;
  const activeTripsCount = trips.filter(t => ['EN_PROGRESO', 'IN_PROGRESS', 'SOLICITADO', 'REQUESTED'].includes(t.status)).length;
  const completedTripsCount = trips.filter(t => ['COMPLETADO', 'COMPLETED'].includes(t.status)).length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans transition-colors duration-200">
      
      {/* Header (Mismo que Home para consistencia) */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center transition-colors duration-200">
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

      <main className="p-4 md:p-8 max-w-[1200px] mx-auto mt-4">
        
        <h1 className="text-[28px] font-bold text-[#2d3748] dark:text-zinc-100 mb-6">Mis Viajes como Conductor</h1>

        {/* Tabs de Filtro */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-[#00d4aa] text-white' 
                  : 'bg-transparent text-[#4a5568] dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-[#a0aec0] dark:text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar mis viajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
          />
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col items-center justify-center transition-colors duration-200">
            <span className="text-[32px] font-bold text-[#00d4aa] leading-none mb-2">{totalTrips}</span>
            <span className="text-[10px] text-[#718096] dark:text-zinc-400 uppercase font-bold tracking-wider">TOTAL</span>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col items-center justify-center transition-colors duration-200">
            <span className="text-[32px] font-bold text-[#00d4aa] leading-none mb-2">{activeTripsCount}</span>
            <span className="text-[10px] text-[#718096] dark:text-zinc-400 uppercase font-bold tracking-wider">ACTIVOS</span>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col items-center justify-center transition-colors duration-200">
            <span className="text-[32px] font-bold text-[#00d4aa] leading-none mb-2">{completedTripsCount}</span>
            <span className="text-[10px] text-[#718096] dark:text-zinc-400 uppercase font-bold tracking-wider">COMPLETADOS</span>
          </div>
        </div>

        {/* Lista de Viajes */}
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white dark:bg-zinc-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
              
              {/* Sección Izquierda: Botón undefined y Estado */}
              <div className="flex items-center gap-4 md:w-1/3">
                <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-white text-[12px] font-bold ${
                  trip.status === 'CANCELADO' ? 'bg-[#f59e0b]' : 'bg-[#00d4aa]'
                }`}>
                  <User size={14} />
                  {trip.driverId}
                </div>
                
                <div className={`px-4 py-1.5 rounded-full text-white text-[11px] font-bold tracking-wider ${
                  trip.status === 'CANCELADO' ? 'bg-[#f59e0b]' : 'bg-[#00d4aa]'
                }`}>
                  {trip.status}
                </div>
              </div>

              {/* Sección Centro: Pasajero */}
              <div className="flex items-center gap-2 md:w-1/4">
                <User size={18} className="text-[#2d3748] dark:text-zinc-100 fill-[#2d3748] dark:fill-zinc-100" />
                <span className="font-bold text-[#2d3748] dark:text-zinc-100 text-[15px]">{trip.passengerName}</span>
              </div>

              {/* Sección Derecha: Detalles del viaje */}
              <div className="flex flex-col gap-1.5 md:w-5/12 text-[12px] text-[#718096] dark:text-zinc-400">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-[#00d4aa] mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{trip.origin}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Flag size={14} className="text-[#00d4aa] mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{trip.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#00d4aa] shrink-0" />
                  <span>{trip.time}</span>
                </div>
                <div className="font-bold text-[#00d4aa] text-[14px] mt-1">
                  {trip.price}
                </div>
              </div>

            </div>
          ))}
          
          {filteredTrips.length === 0 && (
            <div className="text-center py-10 text-[#718096] dark:text-zinc-400">
              No se encontraron viajes en esta categoría.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
