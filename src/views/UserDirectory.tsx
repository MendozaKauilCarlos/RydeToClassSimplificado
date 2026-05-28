import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Shield, Ban, CheckCircle, Trash2, Mail, Phone, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole, toggleUserSuspension, deleteUserFromDB } from '../services/db';

export default function UserDirectory() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'drivers' | 'passengers'>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const fetched = await getAllUsers();
      setUsers(fetched || []);
    } catch (error) {
      console.error('Error fetching users from DB:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: 'passenger' | 'driver' | 'admin') => {
    const nextRole = currentRole === 'driver' ? 'passenger' : 'driver';
    const confirm = window.confirm(`¿Estás seguro de cambiar el rol de este usuario a ${nextRole === 'driver' ? 'Conductor' : 'Pasajero'}?`);
    if (!confirm) return;

    setActioningId(userId);
    try {
      await updateUserRole(userId, nextRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    } catch (error) {
      alert('Error al cambiar el rol del usuario.');
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleSuspension = async (userId: string, currentSuspended: boolean) => {
    const actionText = currentSuspended ? 'reactivar' : 'suspender';
    const confirm = window.confirm(`¿Estás seguro de que deseas ${actionText} la cuenta de este estudiante/usuario?`);
    if (!confirm) return;

    setActioningId(userId);
    try {
      await toggleUserSuspension(userId, !!currentSuspended);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: !currentSuspended } : u));
    } catch (error) {
      alert('Error al actualizar el estado de la cuenta.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const confirm = window.confirm(`⚠️ ADVERTENCIA CRÍTICA: ¿Estás completamente seguro de que deseas eliminar permanentemente a "${name}" de la plataforma?\nEsta acción no se puede deshacer.`);
    if (!confirm) return;

    setActioningId(userId);
    try {
      await deleteUserFromDB(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      alert('Error al eliminar el usuario de la base de datos.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-[#2d3748] dark:text-zinc-100">
        <div className="w-10 h-10 border-4 border-[#00d4aa] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold">Cargando panel de control...</p>
      </div>
    );
  }

  if (userData && userData.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center text-[#2d3748] dark:text-zinc-100">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 font-bold text-3xl">!</div>
        <h3 className="text-lg font-bold">Acceso Denegado</h3>
        <p className="text-sm text-[#718096] dark:text-zinc-400 max-w-xs mt-2 mb-6">Esta sección es de uso exclusivo para las cuentas con privilegios de Administrador.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#00d4aa] text-white font-bold rounded-xl text-sm hover:bg-[#00bfa0] transition-colors shadow-sm">
          VOLVER AL INICIO
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter((u: any) => {
    const name = u.name || u.displayName || 'Usuario sin nombre';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'drivers') return matchesSearch && u.role === 'driver';
    if (activeTab === 'passengers') return matchesSearch && u.role === 'passenger';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 text-[#2d3748] dark:text-zinc-100 pb-24 font-sans transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#2d3748] dark:text-zinc-100" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-[#2d3748] dark:text-zinc-100 uppercase tracking-wide">Panel Administrativo</h1>
          <p className="text-[11px] text-[#718096] dark:text-zinc-400 -mt-0.5">Gestión directa de alumnos y accesos</p>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[800px] mx-auto mt-2">
        {/* Barra de Búsqueda */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-[#a0aec0] dark:text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar alumno por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-zinc-100 placeholder:text-[#a0aec0] dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] shadow-sm transition-all text-[14px]"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-white dark:bg-zinc-800 rounded-xl p-1 mb-6 shadow-sm border border-gray-100 dark:border-zinc-700">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-colors ${activeTab === 'all' ? 'bg-[#00d4aa] text-white shadow-sm' : 'text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-colors ${activeTab === 'drivers' ? 'bg-[#00d4aa] text-white shadow-sm' : 'text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'}`}
          >
            Conductores
          </button>
          <button 
            onClick={() => setActiveTab('passengers')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-colors ${activeTab === 'passengers' ? 'bg-[#00d4aa] text-white shadow-sm' : 'text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'}`}
          >
            Pasajeros
          </button>
        </div>

        {/* Lista de Usuarios */}
        <div className="space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(u => {
              const uName = u.name || u.displayName || 'Usuario sin nombre';
              const isSuspended = !!u.suspended;
              const isUserActioning = actioningId === u.id;
              const isSelf = u.id === userData?.uid;
              const isAdminUser = u.role === 'admin';

              return (
                <div 
                  key={u.id} 
                  className={`bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border transition-all duration-200 ${
                    isSuspended 
                      ? 'border-red-200 dark:border-red-900/30 bg-red-50/10' 
                      : isSelf 
                        ? 'border-[#00d4aa] dark:border-[#00d4aa]/50 bg-[#00d4aa]/5' 
                        : 'border-gray-100 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 overflow-hidden shadow-sm ${
                        isSuspended ? 'bg-red-500' : 'bg-[#00d4aa]'
                      }`}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={uName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} />
                        )}
                      </div>
                      
                      {/* Info de contacto */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold text-[#2d3748] dark:text-zinc-100 leading-tight">
                            {uName} {isSelf && <span className="text-xs font-semibold text-[#00d4aa] dark:text-[#00d4aa]">(Tú)</span>}
                          </h3>
                          {isSuspended && (
                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[9px] font-bold uppercase tracking-wider">
                              Suspendido
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            isAdminUser 
                              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              : u.role === 'driver' 
                                ? 'bg-[#00d4aa]/10 text-[#00d4aa]' 
                                : 'bg-blue-100/10 text-blue-500'
                          }`}>
                            {isAdminUser ? 'Administrador' : u.role === 'driver' ? 'Conductor' : 'Pasajero'}
                          </span>
                          <span className="text-[11px] text-[#718096] dark:text-zinc-400 flex items-center gap-1">
                            <Mail size={12} /> {u.email || 'Sin correo'}
                          </span>
                          {u.phone && (
                            <span className="text-[11px] text-[#718096] dark:text-zinc-400 flex items-center gap-1">
                              <Phone size={12} /> {u.phone}
                            </span>
                          )}
                        </div>

                        {u.role === 'driver' && u.vehicle && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#718096] dark:text-zinc-400 mt-2 bg-gray-50 dark:bg-zinc-900/40 p-1.5 rounded-lg max-w-max">
                            <Car size={13} className="text-[#00d4aa]" />
                            <span>{u.vehicle} {u.plates ? `(${u.plates})` : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción directos con restricciones de protección para Admins */}
                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-zinc-700">
                      {/* Cambiar Rol */}
                      <button
                        onClick={() => handleRoleChange(u.id, u.role)}
                        disabled={isUserActioning || isAdminUser}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-all border disabled:opacity-40 ${
                          isAdminUser
                            ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200/50 dark:border-zinc-700/50 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-700/80 border-gray-200/50 dark:border-zinc-700/50 text-[#4a5568] dark:text-zinc-200'
                        }`}
                        title={isAdminUser ? "Los roles de administrador no se pueden degradar desde este panel" : "Alternar rol (Pasajero / Conductor)"}
                      >
                        Rol
                      </button>

                      {/* Suspender / Activar */}
                      <button
                        onClick={() => handleToggleSuspension(u.id, isSuspended)}
                        disabled={isUserActioning || isAdminUser || isSelf}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-all disabled:opacity-40 ${
                          isAdminUser || isSelf
                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                            : isSuspended
                              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        }`}
                        title={isSelf ? "No puedes suspender tu propia cuenta activa" : isAdminUser ? "No se pueden suspender cuentas de administradores" : isSuspended ? "Reactivar acceso" : "Suspender acceso"}
                      >
                        {isSuspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                        {isSuspended ? 'Activar' : 'Suspender'}
                      </button>

                      {/* Eliminar permanentemente de la BD */}
                      <button
                        onClick={() => handleDeleteUser(u.id, uName)}
                        disabled={isUserActioning || isAdminUser || isSelf}
                        className={`p-1.5 rounded-xl transition-all disabled:opacity-40 ${
                          isAdminUser || isSelf
                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                            : 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white'
                        }`}
                        title={isSelf ? "No puedes eliminar tu propia cuenta de administrador" : isAdminUser ? "No se pueden eliminar cuentas de administradores" : "Eliminar usuario permanentemente"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center shadow-sm border border-gray-100 dark:border-zinc-700">
              <User size={48} className="mx-auto text-[#a0aec0] dark:text-zinc-500 mb-3 opacity-50" />
              <p className="font-bold text-[#4a5568] dark:text-zinc-300">No se encontraron alumnos</p>
              <p className="text-[13px] text-[#718096] dark:text-zinc-400 mt-1">Busca otro nombre o cambia de pestaña.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

