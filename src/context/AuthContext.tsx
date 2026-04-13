import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'passenger' | 'driver';
}

interface AuthContextType {
  user: User | any | null;
  userData: UserData | null;
  loading: boolean;
  loginAsDemo: (role: 'passenger' | 'driver') => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  loginAsDemo: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const loginAsDemo = (role: 'passenger' | 'driver') => {
    setIsDemo(true);
    setUser({ uid: 'demo-user-123', email: 'demo@ridetoclass.com', displayName: 'Usuario Demo' });
    setUserData({
      uid: 'demo-user-123',
      email: 'demo@ridetoclass.com',
      displayName: 'Usuario Demo',
      role: role
    });
    setLoading(false);
  };

  const logout = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
      setUserData(null);
    } else {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }
  };

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isDemo) return;
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemo]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, loginAsDemo, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
