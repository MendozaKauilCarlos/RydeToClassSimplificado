import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  ChevronRight, 
  Bell, 
  Route, 
  MapPin, 
  Star, 
  Clock, 
  User, 
  Menu, 
  X, 
  Car, 
  Users, 
  Shield, 
  Ban, 
  Lock,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Home() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  
  const isDriver = userData?.role === 'driver'; 
  const isAdmin = userData?.role === 'admin'; 
  
  const [showNotifications, setShowNotifications] = useState(false);

  // Real-time admin statistics
  const [stats, setStats] = useState({
    passengers: 0,
    drivers: 0,
    suspended: 0,
    activeTrips: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Subscribe to real-time metrics for administrators
  useEffect(() => {
    if (!isAdmin) return;
    
    setLoadingStats(true);

    // Live monitor of academic campus users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let d = 0;
      let p = 0;
      let s = 0;
      snapshot.forEach(docSnap => {
        const u = docSnap.data();
        if (u.suspended) {
          s++;
        }
        if (u.role === 'driver') {
          d++;
        } else if (u.role === 'passenger') {
          p++;
        }
      });
      setStats(prev => ({ 
        ...prev, 
        passengers: p, 
        drivers: d, 
        suspended: s 
      }));
    }, (error) => {
      console.error('Error fetching real-time users for admin dashboard:', error);
    });

    // Live monitor of on-duty campus trips
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      let active = 0;
      snapshot.forEach(docSnap => {
        const t = docSnap.data();
        if (['pending', 'accepted', 'picking_up', 'in_transit'].includes(t.status)) {
          active++;
        }
      });
      setStats(prev => ({ 
        ...prev, 
        activeTrips: active 
      }));
      setLoadingStats(false);
    }, (error) => {
      console.error('Error fetching active trips count:', error);
      setLoadingStats(false);
    });

    return () => {
      unsubUsers();
      unsubTrips();
    };
  }, [isAdmin]);

  // Clean empty array for notification indicator
  const notifications: any[] = [];

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 flex items-center justify-center text-[#00d4aa]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#00d4aa] border-t-transparent"></div>
          <span className="text-xs text-[#718096] dark:text-zinc-400 font-bold tracking-wider uppercase">Cargando perfil institucional...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-20 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Header Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#718096] dark:text-zinc-400 font-medium">
              {isAdmin ? 'Módulo Administrativo' : '¡Buenas tardes!'}
            </span>
            <span className="text-[13px] font-bold text-[#2d3748] dark:text-zinc-100 uppercase tracking-wide">
              {userData?.displayName || 'Usuario'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={24} className="text-[#4a5568] dark:text-zinc-300 fill-[#4a5568] dark:fill-zinc-300" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#e74c3c] text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800">
              {notifications.length}
            </span>
          </div>
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-500/10 dark:bg-zinc-700/50 dark:hover:bg-red-950/20 text-[#e74c3c] rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border border-red-200/50 dark:border-red-900/10 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-30 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-zinc-700">
            <h3 className="font-bold text-[#2d3748] dark:text-zinc-100">Notificaciones</h3>
            <button onClick={() => setShowNotifications(false)} className="text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-100">
              <X size={20} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#718096] dark:text-zinc-400 text-[13px] font-medium">
                No tienes notificaciones pendientes
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-4 border-b border-gray-50 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors">
                  <p className="text-[13px] font-bold text-[#2d3748] dark:text-zinc-100">{notif.title}</p>
                  <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-1">{notif.message}</p>
                  <p className="text-[10px] text-[#a0aec0] dark:text-zinc-500 mt-2 font-medium">{notif.time}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-3 text-center bg-gray-50 dark:bg-zinc-800/80">
            <button className="text-[12px] font-bold text-[#00d4aa] hover:underline">Marcar todas como leídas</button>
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6 mt-2 relative z-10">
        
        {/* VIEW 1: ADMIN ROLE - SIMPLE, FOCUSED AND MANAGEMENT FIRST */}
        {isAdmin ? (
          <div className="space-y-6">
            
            {/* Admin Header Alert Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
                <Shield size={160} />
              </div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Panel de Control de Rectoría / Escuela</p>
              <h1 className="text-xl md:text-2xl font-black leading-tight">Consola de Administración de Alumnos</h1>
              <p className="text-blue-100 text-[13px] mt-2 max-w-lg leading-relaxed">
                Aquí cuentas con total acceso para aprobar solicitudes, dar de baja cuentas, suspender el servicio a estudiantes con reportes o reconfigurar los niveles de acceso.
              </p>
            </div>

            {/* Admin Action Option (Quick path to /users) */}
            <button 
              onClick={() => navigate('/users')} 
              className="w-full bg-white dark:bg-zinc-800 border-2 border-blue-100/30 dark:border-zinc-700 hover:border-blue-500 text-left p-6 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Users size={28} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#2d3748] dark:text-zinc-100 text-[17px] leading-tight group-hover:text-blue-500 transition-colors">
                    Gestionar Alumnos y Conductores
                  </h3>
                  <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-1 max-w-[400px]">
                    Suspender cuentas de alumnos reportados, cambiar roles entre conductor y pasajero, o purgar registros inactivos.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-[#718096] group-hover:bg-blue-500 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </button>

            {/* Dynamic System Stats Section */}
            <div>
              <h2 className="text-[15px] font-bold text-[#718096] dark:text-zinc-400 uppercase tracking-wider mb-4 px-1">Métricas Generales en Tiempo Real</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Stat 1: Registered Passengers (Students) */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold text-[#718096] dark:text-zinc-400 uppercase tracking-wider">Total Alumnos</span>
                    <span className="p-1 px-2 bg-blue-100/10 text-blue-500 text-[10px] font-bold rounded">Pasajeros</span>
                  </div>
                  <p className="text-3xl font-black text-[#2d3748] dark:text-zinc-100 mt-3">{loadingStats ? '...' : stats.passengers}</p>
                  <p className="text-[11px] text-[#a0aec0] dark:text-zinc-500 mt-1">Con cuentas activas</p>
                </div>

                {/* Stat 2: Registered Drivers */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold text-[#718096] dark:text-zinc-400 uppercase tracking-wider">Total Conductores</span>
                    <span className="p-1 px-2 bg-[#00d4aa]/10 text-[#00d4aa] text-[10px] font-bold rounded">Aprobados</span>
                  </div>
                  <p className="text-3xl font-black text-[#2d3748] dark:text-zinc-100 mt-3">{loadingStats ? '...' : stats.drivers}</p>
                  <p className="text-[11px] text-[#a0aec0] dark:text-zinc-500 mt-1">Con vehículo verificado</p>
                </div>

                {/* Stat 3: Active Trips on Air */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold text-[#718096] dark:text-zinc-400 uppercase tracking-wider">Rutas en Curso</span>
                    <span className="p-1 px-2 bg-purple-100/10 text-purple-500 text-[10px] font-bold rounded">En Vivo</span>
                  </div>
                  <p className="text-3xl font-black text-[#2d3748] dark:text-zinc-100 mt-3">{loadingStats ? '...' : stats.activeTrips}</p>
                  <p className="text-[11px] text-[#a0aec0] dark:text-zinc-500 mt-1">Monitoreo escolar activo</p>
                </div>

                {/* Stat 4: Suspended Users */}
                <div className={`${
                  stats.suspended > 0 
                  ? 'bg-red-500/5 dark:bg-red-500/10 border-red-200 dark:border-red-900/30' 
                  : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-800'
                } p-5 rounded-xl shadow-sm border transition-colors`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-extrabold text-[#718096] dark:text-zinc-400 uppercase tracking-wider">Cuentas Suspendidas</span>
                    <span className={`p-1 px-2 text-[10px] font-bold rounded ${
                      stats.suspended > 0 ? 'bg-red-500/20 text-red-600' : 'bg-gray-100/10 text-gray-500'
                    }`}>
                      Bloqueos
                    </span>
                  </div>
                  <p className={`text-3xl font-black mt-3 ${stats.suspended > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#2d3748] dark:text-zinc-100'}`}>
                    {loadingStats ? '...' : stats.suspended}
                  </p>
                  <p className="text-[11px] text-[#a0aec0] dark:text-zinc-500 mt-1">Infracciones del reglamento</p>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* VIEW 2: STANDARD DRIVER & PASSENGER DASHBOARD */
          <div className="space-y-6">
            
            {/* Emergencia 911 Button */}
            <button className="w-full bg-[#e74c3c] hover:bg-[#d64536] text-white p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <Phone size={26} className="fill-white" />
                <div className="text-left">
                  <p className="font-bold text-[17px] leading-tight">Emergencia 911</p>
                  <p className="text-[12px] text-white/90 mt-0.5 font-medium">Llamar a emergencias del campus</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-white" />
            </button>

            {/* Menu Options */}
            <div className="space-y-3">
              {/* Trip Requests (Driver) vs Book Trip (Passenger) */}
              {isDriver ? (
                <button onClick={() => navigate('/driver/requests')} className="w-full bg-white dark:bg-zinc-800 p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700">
                  <div className="flex items-center gap-4">
                    <Bell size={22} className="text-[#718096] dark:text-zinc-400 fill-[#718096] dark:fill-zinc-400" />
                    <div className="text-left">
                      <p className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px] leading-tight font-sans">Solicitudes de Viaje</p>
                      <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-0.5 font-medium">Ver viajes solicitados por alumnos</p>
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

              {/* Active Trips List Link */}
              <button onClick={() => navigate(isDriver ? '/driver/active' : '/trips')} className="w-full bg-white dark:bg-zinc-800 p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700">
                <div className="flex items-center gap-4">
                  <Route size={22} className="text-[#718096] dark:text-zinc-400" />
                  <div className="text-left">
                    <p className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px] leading-tight">Viajes Activos</p>
                    <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-0.5 font-medium">
                      {isDriver ? 'Gestionar tus viajes asignados' : 'Ver trayecto escolar de hoy'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
              </button>

              {/* Create Route (Drivers Only) */}
              {isDriver && (
                <button onClick={() => navigate('/driver/create-route')} className="w-full bg-white dark:bg-zinc-800 p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700">
                  <div className="flex items-center gap-4">
                    <MapPin size={22} className="text-[#718096] dark:text-zinc-400 fill-[#718096] dark:fill-zinc-400" />
                    <div className="text-left">
                      <p className="font-bold text-[#2d3748] dark:text-zinc-100 text-[16px] leading-tight">Crear Ruta</p>
                      <p className="text-[12px] text-[#718096] dark:text-zinc-400 mt-0.5 font-medium">Publicar horario y ruta fija</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
                </button>
              )}
            </div>

            {/* Travel Stats Summary */}
          </div>
        )}

      </main>
    </div>
  );
}
