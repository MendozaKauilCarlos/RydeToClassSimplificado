import React, { useState, useEffect } from 'react';
import { ArrowLeft, BellOff, MapPin, Navigation, Clock, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { updateTripStatus } from '../services/db';
import { useAuth } from '../context/AuthContext';

interface RequestData {
  id: string;
  passengerName: string;
  origin: string;
  destination: string;
  distance: string;
  time: string;
  price: number;
}

export default function DriverRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [requests, setRequests] = useState<RequestData[]>([]);

  useEffect(() => {
    if (!isOnline) {
      setRequests([]);
      return;
    }

    // Escuchar viajes solicitados en tiempo real
    const q = query(collection(db, 'trips'), where('status', '==', 'requested'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          passengerName: data.passengerName || 'Pasajero',
          origin: data.origin || 'Origen no especificado',
          destination: data.destination || 'Destino no especificado',
          distance: 'Calculando...', // Esto se puede mejorar con la API de mapas
          time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Reciente',
          price: data.price || 45
        };
      });
      setRequests(newRequests);
    });

    return () => unsubscribe();
  }, [isOnline]);

  const handleAccept = async (id: string) => {
    try {
      await updateTripStatus(id, 'in_progress', { driverId: user?.uid || 'Conductor' });
      alert('¡Viaje aceptado! Redirigiendo al mapa...');
      navigate('/driver/active-trips');
    } catch (error) {
      console.error('Error aceptando viaje:', error);
      alert('Hubo un error al aceptar el viaje.');
    }
  };

  const handleReject = async (id: string) => {
    // En un sistema real, no lo cancelaríamos para todos, solo lo ocultaríamos para este conductor.
    // Por ahora, solo lo quitamos de la vista localmente o lo marcamos como rechazado.
    setRequests(requests.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 pb-20 font-sans text-[#2d3748] dark:text-zinc-100 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <h1 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Solicitudes de Viaje</h1>
      </header>

      <main className="p-4 md:p-8 max-w-[800px] mx-auto">
        {/* Estado de conexión */}
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`w-full rounded-xl p-4 flex items-center justify-center gap-2 text-white font-bold mb-8 shadow-sm transition-colors ${
            isOnline ? 'bg-[#00d4aa] hover:bg-[#00bfa0]' : 'bg-gray-400 dark:bg-zinc-600 hover:bg-gray-500'
          }`}
        >
          <div className={`w-2.5 h-2.5 bg-white rounded-full ${isOnline ? 'animate-pulse' : ''}`}></div>
          {isOnline ? 'ESTÁS CONECTADO' : 'CONECTARSE'}
        </button>

        {!isOnline ? (
          <div className="flex flex-col items-center justify-center text-center mt-20 opacity-60">
            <BellOff size={64} className="text-[#a0aec0] dark:text-zinc-500 mb-4" />
            <p className="text-[#718096] dark:text-zinc-400 font-medium text-[15px]">Conéctate para recibir solicitudes</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20 opacity-60">
            <div className="relative mb-4">
              <MapPin size={64} className="text-[#a0aec0] dark:text-zinc-500" />
              <div className="absolute -bottom-2 -right-2 bg-[#f0f2f5] dark:bg-zinc-900 rounded-full p-1">
                <div className="w-5 h-5 border-2 border-[#00d4aa] rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>
            <p className="text-[#718096] dark:text-zinc-400 font-medium text-[15px]">Buscando pasajeros cercanos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px]">{request.passengerName}</h3>
                    <p className="text-[12px] text-[#718096] dark:text-zinc-400 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {request.time} • {request.distance}
                    </p>
                  </div>
                  <span className="text-[#00d4aa] font-bold text-[20px]">${request.price}</span>
                </div>
                
                <div className="space-y-3 mb-6 bg-[#f8fafc] dark:bg-zinc-900/50 p-3 rounded-xl">
                  <div className="flex items-center gap-3 text-[14px] text-[#4a5568] dark:text-zinc-300">
                    <MapPin size={16} className="text-[#00d4aa] shrink-0" />
                    <span className="truncate">{request.origin}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#4a5568] dark:text-zinc-300">
                    <Navigation size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="truncate">{request.destination}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleReject(request.id)}
                    className="flex-1 py-3 rounded-xl font-bold text-[#718096] dark:text-zinc-400 bg-[#f0f2f5] dark:bg-zinc-900 hover:bg-[#e2e8f0] dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Rechazar
                  </button>
                  <button 
                    onClick={() => handleAccept(request.id)}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-[#00d4aa] hover:bg-[#00bfa0] shadow-md shadow-[#00d4aa]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
