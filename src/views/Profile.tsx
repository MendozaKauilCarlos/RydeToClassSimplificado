import React, { useState } from 'react';
import { User, Bell, Menu, Edit, Settings, LogOut, ChevronRight, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deactivateDriverRoutes } from '../services/db';

export default function Profile() {
  const { logout, userData, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const isDriver = userData?.role === 'driver';
  const isOnline = userData?.isOnline || false;

  const handleToggleOnline = async () => {
    try {
      const nextOnline = !isOnline;
      await updateProfile({ isOnline: nextOnline });
      
      // Si pasa a estar NO CONECTADO ("no conectado para recibir"), desactivar sus rutas activas automáticamente
      if (!nextOnline && user?.uid) {
        await deactivateDriverRoutes(user.uid);
      }
    } catch (error) {
      console.error('Error actualizando estado de conexión:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm">
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
          <div className="relative cursor-pointer">
            <Bell size={24} className="text-[#4a5568] dark:text-zinc-300 fill-[#4a5568] dark:fill-zinc-300" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#e74c3c] text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800">3</span>
          </div>
          <Menu size={28} className="text-[#4a5568] dark:text-zinc-300 cursor-pointer" />
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[800px] mx-auto mt-4 space-y-4">
        
        {/* Tarjeta de Perfil Principal */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col items-center transition-colors duration-200">
          
          {/* Avatar Grande */}
          <div className="w-24 h-24 bg-[#00d4aa] rounded-full flex items-center justify-center text-white mb-4 shadow-md shadow-[#00d4aa]/20 overflow-hidden">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={48} />
            )}
          </div>
          
          {/* Info Usuario */}
          <h2 className="text-[22px] font-bold text-[#2d3748] dark:text-zinc-100 mb-1">{userData?.displayName || 'Usuario'}</h2>
          <p className="text-[14px] text-[#718096] dark:text-zinc-400 mb-8">{userData?.email || ''}</p>
          
          {/* Estadísticas */}
          <div className="flex justify-center text-center">
            <div className="flex flex-col items-center">
              <span className="text-[24px] font-bold text-[#2d3748] dark:text-zinc-100 leading-none mb-1.5">
                {userData && typeof userData.trips !== 'undefined' ? userData.trips : 0}
              </span>
              <span className="text-[10px] text-[#a0aec0] dark:text-zinc-500 uppercase tracking-wider font-bold">VIAJES</span>
            </div>
          </div>
        </div>

        {/* Lista de Opciones */}
        <div className="space-y-3 pt-2">

          {/* Botón Conectarse (Solo Conductor) */}
          {isDriver && (
            <button 
              onClick={handleToggleOnline}
              className={`w-full p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm mb-2 ${isOnline ? 'bg-[#00d4aa] hover:bg-[#00bfa0] text-white' : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? 'bg-white/20' : 'bg-gray-100 dark:bg-zinc-700'}`}>
                  {isOnline ? <ToggleRight size={26} className="text-white" /> : <ToggleLeft size={26} className="text-[#a0aec0] dark:text-zinc-500" />}
                </div>
                <div className="text-left">
                  <p className={`font-bold text-[17px] leading-tight ${isOnline ? 'text-white' : 'text-[#2d3748] dark:text-zinc-100'}`}>{isOnline ? 'Conectado' : 'Conectarse'}</p>
                  <p className={`text-[12px] mt-0.5 font-medium ${isOnline ? 'text-white/90' : 'text-[#718096] dark:text-zinc-400'}`}>
                    {isOnline ? 'Recibiendo solicitudes' : 'Disponible para recibir viajes'}
                  </p>
                </div>
              </div>
            </button>
          )}
          
          {userData?.role === 'admin' && (
            <button 
              onClick={() => navigate('/users')}
              className="w-full bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 shadow-sm border border-blue-100/50 dark:border-blue-900/20 flex items-center justify-between hover:bg-blue-100/30 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Users size={20} className="text-[#3b82f6]" />
                <div className="text-left">
                  <span className="block text-[#1e40af] dark:text-blue-400 font-bold text-[15px]">Panel de Administración</span>
                  <span className="block text-[11px] text-blue-500 dark:text-blue-500 -mt-0.5">Gestionar alumnos y conductores</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
            </button>
          )}

          <button 
            onClick={() => navigate('/profile/edit')}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Edit size={20} className="text-[#00d4aa]" />
              <span className="text-[#2d3748] dark:text-zinc-100 font-medium text-[15px]">Editar Perfil</span>
            </div>
            <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
          </button>

          <button 
            onClick={() => navigate('/settings')}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Settings size={20} className="text-[#00d4aa]" />
              <span className="text-[#2d3748] dark:text-zinc-100 font-medium text-[15px]">Configuración</span>
            </div>
            <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
          </button>



          <button 
            onClick={handleLogout}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
          >
            <div className="flex items-center gap-4">
              <LogOut size={20} className="text-[#e74c3c]" />
              <span className="text-[#e74c3c] font-medium text-[15px]">Cerrar Sesión</span>
            </div>
            <ChevronRight size={20} className="text-[#a0aec0] dark:text-zinc-500" />
          </button>

        </div>

      </main>
    </div>
  );
}
