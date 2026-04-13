import React, { useState } from 'react';
import { Phone, ToggleLeft, ToggleRight, ChevronRight, Bell, Route, MapPin, Star, Clock, User, Menu, Search, X, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  // Determinamos si el usuario es conductor
  const isDriver = userData?.role === 'driver'; 
  const [isOnline, setIsOnline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications
  const notifications = isDriver ? [
    { id: 1, title: 'Nueva solicitud', message: 'Juan Pérez quiere viajar contigo al Centro.', time: 'Hace 2 min' },
    { id: 2, title: 'Viaje completado', message: 'Has recibido $50 por tu último viaje.', time: 'Hace 1 hora' }
  ] : [
    { id: 1, title: 'Viaje aceptado', message: 'Carlos (Nissan Versa) ha aceptado tu viaje.', time: 'Hace 5 min' },
    { id: 2, title: 'Conductor cerca', message: 'Tu conductor está a 2 minutos de distancia.', time: 'Hace 1 min' }
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans transition-colors duration-200">
      {/* Header Exacto */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-20 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-full flex items-center justify-center text-white">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#718096] dark:text-zinc-400 font-medium">¡Buenas tardes!</span>
            <span className="text-[13px] font-bold text-[#2d3748] dark:text-zinc-100 uppercase tracking-wide">
              {userData?.displayName || 'Usuario'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={24} className="text-[#4a5568] dark:text-zinc-300 fill-[#4a5568] dark:fill-zinc-300" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#e74c3c] text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800">
              {notifications.length}
            </span>
          </div>
          <Menu size={28} className="text-[#4a5568] dark:text-zinc-300 cursor-pointer" />
        </div>
      </header>

      {/* Dropdown de Notificaciones */}
      {showNotifications && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-30 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-zinc-700">
            <h3 className="font-bold text-[#2d3748] dark:text-zinc-100">Notificaciones</h3>
            <button onClick={() => setShowNotifications(false)} className="text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-100">
              <X size={20} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(notif => (
              <div key={notif.id} className="p-4 border-b border-gray-50 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors">
                <p className="text-[13px] font-bold text-[#2d3748] dark:text-zinc-100">{notif.title}</p>
                <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-1">{notif.message}</p>
                <p className="text-[10px] text-[#a0aec0] dark:text-zinc-500 mt-2 font-medium">{notif.time}</p>
              </div>
            ))}
          </div>
          <div className="p-3 text-center bg-gray-50 dark:bg-zinc-800/80">
            <button className="text-[12px] font-bold text-[#00d4aa] hover:underline">Marcar todas como leídas</button>
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-4 mt-2 relative z-10">
        
        {/* Botón Emergencia (Para ambos roles) */}
        <button className="w-full bg-[#e74c3c] hover:bg-[#d64536] text-white p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <Phone size={26} className="fill-white" />
            <div className="text-left">
              <p className="font-bold text-[17px] leading-tight">Emergencia 911</p>
              <p className="text-[12px] text-white/90 mt-0.5 font-medium">Llamar a emergencias</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-white" />
        </button>

        {/* Botón Conectarse (Solo Conductor) */}
        {isDriver && (
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {isOnline ? <ToggleRight size={26} className="text-white" /> : <ToggleLeft size={26} className="text-white" />}
              </div>
              <div className="text-left">
                <p className="font-bold text-[17px] leading-tight">{isOnline ? 'Conectado' : 'Conectarse'}</p>
                <p className="text-[12px] text-white/90 mt-0.5 font-medium">
                  {isOnline ? 'Recibiendo solicitudes' : 'Disponible para recibir viajes'}
                </p>
              </div>
            </div>
            <ChevronRight size={24} className="text-white" />
          </button>
        )}

        {/* Menú de Opciones */}
        <div className="space-y-3 mt-6">
          
          {/* Solicitudes de Viaje (Conductor) vs Solicitar Viaje (Pasajero) */}
          {isDriver ? (
            <button onClick={() => navigate('/driver/requests')} className="w-full bg-white dark:bg-zinc-800 p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700">
              <div className="flex items-center gap-4">
                <Bell size={22} className="text-[#718096] dark:text-zinc-400 fill-[#718096] dark:fill-zinc-400" />
                <div className="text-left">
                  <p className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px] leading-tight">Solicitudes de Viaje</p>
                  <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-0.5 font-medium">Ver viajes solicitados</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
            </button>
          ) : (
            <button onClick={() => navigate('/passenger/request-trip')} className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <Car size={26} className="text-white" />
                <div className="text-left">
                  <p className="font-bold text-[17px] leading-tight">Solicitar Viaje</p>
                  <p className="text-[12px] text-white/90 mt-0.5 font-medium">Encuentra un conductor cerca</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-white" />
            </button>
          )}

          {/* Viajes Activos (Ambos) */}
          <button onClick={() => navigate(isDriver ? '/driver/active' : '/trips')} className="w-full bg-white dark:bg-zinc-800 p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700">
            <div className="flex items-center gap-4">
              <Route size={22} className="text-[#718096] dark:text-zinc-400" />
              <div className="text-left">
                <p className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px] leading-tight">Viajes Activos</p>
                <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-0.5 font-medium">
                  {isDriver ? 'Gestionar viajes en curso' : 'Ver trayectoria actual'}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
          </button>

          {/* Crear Ruta (Solo Conductor) */}
          {isDriver && (
            <button onClick={() => navigate('/driver/create-route')} className="w-full bg-white dark:bg-zinc-800 p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700">
              <div className="flex items-center gap-4">
                <MapPin size={22} className="text-[#718096] dark:text-zinc-400 fill-[#718096] dark:fill-zinc-400" />
                <div className="text-left">
                  <p className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px] leading-tight">Crear Ruta</p>
                  <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-0.5 font-medium">Crear una ruta recurrente</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
            </button>
          )}
        </div>

        {/* Estadísticas */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-[18px] font-bold text-[#2d3748] dark:text-zinc-100">Viajes Recientes</h2>
            <button className="text-[#00d4aa] text-[13px] font-medium hover:underline">Ver todos</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Viajes Completados (Ambos) */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm flex items-center gap-4 transition-colors duration-200">
              <div className="w-12 h-12 bg-[#00d4aa] rounded-xl flex items-center justify-center text-white shrink-0">
                <Route size={24} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-3xl text-[#2d3748] dark:text-zinc-100">12</span>
                <span className="text-[10px] text-[#718096] dark:text-zinc-400 uppercase font-bold leading-tight max-w-[80px]">Viajes Completados</span>
              </div>
            </div>
            
            {/* Card 2: Calificación (Solo Conductor) */}
            {isDriver && (
              <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm flex items-center gap-4 transition-colors duration-200">
                <div className="w-12 h-12 bg-[#00d4aa] rounded-xl flex items-center justify-center text-white shrink-0">
                  <Star size={24} className="fill-white" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-3xl text-[#2d3748] dark:text-zinc-100">4.8</span>
                  <span className="text-[10px] text-[#718096] dark:text-zinc-400 uppercase font-bold leading-tight max-w-[80px]">Calificación</span>
                </div>
              </div>
            )}

            {/* Card 3: Tiempo Ahorrado (Ambos) */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm flex items-center gap-4 transition-colors duration-200">
              <div className="w-12 h-12 bg-[#00d4aa] rounded-xl flex items-center justify-center text-white shrink-0">
                <Clock size={24} className="fill-white" />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-3xl text-[#2d3748] dark:text-zinc-100">2.5h</span>
                <span className="text-[10px] text-[#718096] dark:text-zinc-400 uppercase font-bold leading-tight max-w-[80px]">Tiempo Ahorrado</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

