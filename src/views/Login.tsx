import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, UserPlus, Mail, Lock, User, Car, Phone, IdCard, CarFront, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'passenger' | 'driver'>('passenger');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();

  // Form states - Pre-filled for testing purposes
  const [email, setEmail] = useState('pasajero@prueba.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [vehicle, setVehicle] = useState('');

  // Update pre-filled data based on userType when registering
  useEffect(() => {
    if (!isLogin) {
      if (userType === 'passenger') {
        setEmail('pasajero@prueba.com');
      } else {
        setEmail('conductor@prueba.com');
      }
    }
  }, [userType, isLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Error en login:', err);
      if (err.code === 'auth/user-not-found') setError('Usuario no encontrado');
      else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta');
      else if (err.code === 'auth/invalid-email') setError('Correo electrónico inválido');
      else setError('Error al iniciar sesión. Comprueba tus credenciales de Firebase en src/services/firebase.ts');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        email: user.email,
        name,
        role: userType,
        phone: userType === 'driver' ? phone : '',
        license: userType === 'driver' ? license : '',
        vehicle: userType === 'driver' ? vehicle : '',
        rating: 0,
        trips: 0,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      navigate('/');
    } catch (err: any) {
      console.error('Error en registro:', err);
      if (err.code === 'auth/email-already-in-use') setError('Este correo ya está registrado');
      else if (err.code === 'auth/weak-password') setError('La contraseña es muy débil');
      else setError('Error al registrar usuario. Comprueba tus credenciales de Firebase en src/services/firebase.ts');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (role: 'passenger' | 'driver') => {
    loginAsDemo(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-zinc-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00d4aa]/10 text-[#00d4aa] mb-4">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-3xl font-bold text-[#2d3748] dark:text-white mb-2">Ride to Class</h1>
          <p className="text-[#00d4aa] font-semibold tracking-wider text-sm mb-1">TRANSPORTE ESTUDIANTIL</p>
          <p className="text-[#718096] dark:text-zinc-400 text-sm">Viaja con confianza, estudia sin límites</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-700/50 transition-colors duration-200">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-zinc-700/50">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${
                isLogin ? 'bg-white dark:bg-zinc-800 text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'bg-gray-50 dark:bg-zinc-800/50 text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'
              }`}
            >
              <LogIn size={20} />
              <span className="font-medium">Ingresar</span>
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${
                !isLogin ? 'bg-white dark:bg-zinc-800 text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'bg-gray-50 dark:bg-zinc-800/50 text-[#718096] dark:text-zinc-400 hover:text-[#2d3748] dark:hover:text-zinc-300'
              }`}
            >
              <UserPlus size={20} />
              <span className="font-medium">Registro</span>
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {isLogin ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">EMAIL</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                      placeholder="Ingresa tu email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">CONTRASEÑA</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                      placeholder="Ingresa tu contraseña"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md shadow-[#00d4aa]/20"
                >
                  {loading ? 'Cargando...' : (
                    <>
                      <LogIn size={20} />
                      INICIAR SESIÓN
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-5">
                
                {/* User Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">TIPO DE USUARIO</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType('passenger')}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        userType === 'passenger' 
                          ? 'bg-[#00d4aa]/10 border-[#00d4aa] text-[#00d4aa]' 
                          : 'bg-[#f8fafc] dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-[#718096] dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <User size={18} />
                      Pasajero
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('driver')}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        userType === 'driver' 
                          ? 'bg-[#00d4aa]/10 border-[#00d4aa] text-[#00d4aa]' 
                          : 'bg-[#f8fafc] dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-[#718096] dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <Car size={18} />
                      Conductor
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">NOMBRE</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                      placeholder="Ingresa tu nombre"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">EMAIL</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                      placeholder="Ingresa tu email"
                    />
                  </div>
                </div>

                {/* Campos específicos de conductor */}
                {userType === 'driver' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">TELÉFONO</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                          placeholder="Ingresa tu teléfono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">LICENCIA DE CONDUCIR</label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                        <input
                          type="text"
                          required
                          value={license}
                          onChange={(e) => setLicense(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                          placeholder="Número de licencia"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">VEHÍCULO</label>
                      <div className="relative">
                        <CarFront className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                        <input
                          type="text"
                          required
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                          placeholder="Marca y modelo del vehículo"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#718096] dark:text-zinc-400 mb-2 tracking-wider">CONTRASEÑA</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0] dark:text-zinc-500" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-[#2d3748] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                      placeholder="Crea una contraseña"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md shadow-[#00d4aa]/20"
                >
                  {loading ? 'Cargando...' : (
                    <>
                      <UserPlus size={20} />
                      REGISTRARSE
                    </>
                  )}
                </button>
              </form>
            )}

            {/* DEMO BUTTONS */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-700/50">
              <p className="text-center text-xs text-[#718096] dark:text-zinc-500 mb-4 uppercase tracking-wider">Modo Simulación (Sin Backend)</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleDemo('passenger')}
                  className="flex-1 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-[#2d3748] dark:text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Simular Pasajero
                </button>
                <button
                  type="button"
                  onClick={() => handleDemo('driver')}
                  className="flex-1 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-[#2d3748] dark:text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Simular Conductor
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

