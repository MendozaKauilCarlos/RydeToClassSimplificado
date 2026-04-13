import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Componentes
import BottomNav from './components/BottomNav';

// Vistas
import Login from './views/Login';
import Home from './views/Home';
import DriverRequests from './views/DriverRequests';
import DriverActiveTrips from './views/DriverActiveTrips';
import DriverCreateRoute from './views/DriverCreateRoute';
import PassengerRequestTrip from './views/PassengerRequestTrip';
import Trips from './views/Trips';
import MapView from './views/MapView';
import Profile from './views/Profile';
import EditProfile from './views/EditProfile';
import Settings from './views/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 flex items-center justify-center text-[#00d4aa]">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas Protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />

      {/* Rutas de Conductor */}
      <Route path="/driver/requests" element={
        <ProtectedRoute>
          <DriverRequests />
        </ProtectedRoute>
      } />
      <Route path="/driver/active" element={
        <ProtectedRoute>
          <DriverActiveTrips />
        </ProtectedRoute>
      } />
      <Route path="/driver/create-route" element={
        <ProtectedRoute>
          <DriverCreateRoute />
        </ProtectedRoute>
      } />

      {/* Rutas de Pasajero */}
      <Route path="/passenger/request-trip" element={
        <ProtectedRoute>
          <PassengerRequestTrip />
        </ProtectedRoute>
      } />

      <Route path="/trips" element={
        <ProtectedRoute>
          <Trips />
        </ProtectedRoute>
      } />
      <Route path="/map" element={
        <ProtectedRoute>
          <MapView />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/profile/edit" element={
        <ProtectedRoute>
          <EditProfile />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
