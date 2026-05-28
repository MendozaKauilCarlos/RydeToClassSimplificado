import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, Route, User, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  const isAdmin = userData?.role === 'admin';

  const navItems = isAdmin 
    ? [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/users', icon: Users, label: 'Usuarios' },
      ]
    : [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/trips', icon: Route, label: 'Viajes' },
        { path: '/profile', icon: User, label: 'Perfil' },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 pb-safe z-50 transition-colors duration-200">
      <div className="flex justify-around items-center h-16 max-w-5xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#00d4aa]' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-[#00d4aa]' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
