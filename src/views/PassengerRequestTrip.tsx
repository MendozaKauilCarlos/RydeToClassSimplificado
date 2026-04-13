import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation, Calendar, Clock, Users, Zap, CalendarDays, User, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTrip } from '../services/db';
import { useAuth } from '../context/AuthContext';

export default function PassengerRequestTrip() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personalizado' | 'rapido' | 'programado'>('personalizado');
  
  // Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock drivers for "Rápido" tab
  const mockDrivers = [
    { id: 1, name: 'Carlos Mendoza', rating: 4.9, car: 'Honda Civic', price: 25, origin: 'Universidad Nacional', destination: 'Centro Comercial', time: '08:00', seats: 2 },
    { id: 2, name: 'Ana García', rating: 4.8, car: 'Toyota Corolla', price: 30, origin: 'Estación Metro', destination: 'Campus Norte', time: '07:30', seats: 1 }
  ];

  const handleRequestTrip = async () => {
    if (!origin || !destination) {
      alert('Por favor ingresa origen y destino');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrip({
        type: activeTab,
        origin,
        destination,
        passengers,
        date: activeTab === 'programado' ? date : null,
        time: activeTab === 'programado' ? time : null,
        passengerName: user?.displayName || 'Pasajero',
        price: 45 // Precio simulado por ahora
      });
      alert('¡Viaje solicitado con éxito!');
      navigate('/trips');
    } catch (error) {
      console.error('Error al solicitar viaje:', error);
      alert('Hubo un error al solicitar el viaje.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Solicitar Viaje</h1>
      </header>

      <main className="p-4 md:p-8 max-w-[600px] mx-auto mt-4">
        
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-zinc-700 mb-6">
            <button 
              onClick={() => setActiveTab('personalizado')}
              className={`flex-1 pb-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'personalizado' ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'}`}
            >
              <MapPin size={20} />
              <span className="text-[12px] font-bold uppercase tracking-wider">Personalizado</span>
            </button>
            <button 
              onClick={() => setActiveTab('rapido')}
              className={`flex-1 pb-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'rapido' ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'}`}
            >
              <Zap size={20} />
              <span className="text-[12px] font-bold uppercase tracking-wider">Rápido</span>
            </button>
            <button 
              onClick={() => setActiveTab('programado')}
              className={`flex-1 pb-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'programado' ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'}`}
            >
              <CalendarDays size={20} />
              <span className="text-[12px] font-bold uppercase tracking-wider">Programado</span>
            </button>
          </div>

          {/* Tab Content: Personalizado & Programado */}
          {(activeTab === 'personalizado' || activeTab === 'programado') && (
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                  <MapPin size={14} /> Origen
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Selecciona el origen"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 pl-4 pr-12 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#00d4aa] rounded-lg flex items-center justify-center text-white hover:bg-[#00bfa0] transition-colors">
                    <MapPin size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                  <Navigation size={14} /> Destino
                </label>
                <input 
                  type="text" 
                  placeholder="Selecciona el destino"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
                />
              </div>

              {activeTab === 'programado' && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                      <Calendar size={14} /> Fecha
                    </label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                      <Clock size={14} /> Hora
                    </label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#00d4aa] mb-2 uppercase tracking-wider">
                  <Users size={14} /> Pasajeros
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="4"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3.5 px-4 text-[#2d3748] dark:text-zinc-100 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all text-[15px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex-1 py-4 rounded-xl font-bold text-[#4a5568] dark:text-zinc-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-[15px]"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRequestTrip}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-[#00d4aa] hover:bg-[#00bfa0] shadow-md shadow-[#00d4aa]/20 transition-colors text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'ENVIANDO...' : (activeTab === 'programado' ? 'PROGRAMAR VIAJE' : 'SOLICITAR VIAJE')}
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Rápido */}
          {activeTab === 'rapido' && (
            <div className="space-y-4">
              {mockDrivers.map(driver => (
                <div key={driver.id} className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00d4aa] rounded-full flex items-center justify-center text-white font-bold">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px]">{driver.name}</h3>
                        <p className="text-[12px] text-[#718096] dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" /> {driver.rating} • {driver.car}
                        </p>
                      </div>
                    </div>
                    <span className="text-[#00d4aa] font-bold text-[22px]">${driver.price}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4 bg-white dark:bg-zinc-800 p-3 rounded-xl border border-gray-100 dark:border-zinc-700">
                    <div className="flex items-center gap-3 text-[14px] text-[#4a5568] dark:text-zinc-300">
                      <MapPin size={16} className="text-[#00d4aa] shrink-0" />
                      <span className="truncate">{driver.origin}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[14px] text-[#4a5568] dark:text-zinc-300">
                      <Navigation size={16} className="text-[#e74c3c] shrink-0" />
                      <span className="truncate">{driver.destination}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[12px] font-medium">
                    <span className="flex items-center gap-1.5 text-[#718096] dark:text-zinc-400">
                      <Clock size={14} /> Salida: {driver.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#00d4aa] bg-[#00d4aa]/10 px-2 py-1 rounded-lg">
                      <Users size={14} /> {driver.seats} asientos disponibles
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full py-4 rounded-xl font-bold text-[#4a5568] dark:text-zinc-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-[15px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
