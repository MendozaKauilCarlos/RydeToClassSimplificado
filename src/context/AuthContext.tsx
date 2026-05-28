import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'passenger' | 'driver' | 'admin';
  phone?: string;
  vehicle?: string;
  plates?: string;
  color?: string;
  capacity?: string;
  name?: string; // added to support both displayName and name
  isOnline?: boolean;
}

interface AuthContextType {
  user: User | any | null;
  userData: UserData | null;
  loading: boolean;
  updateProfile: (data: Partial<UserData>) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  updateProfile: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = async (data: Partial<UserData>) => {
    if (user && userData) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const payload: any = {
          ...data,
          updatedAt: new Date()
        };
        // Ensure both 'name' and 'displayName' are locked-in in sync for Firestore
        if (data.displayName) {
          payload.name = data.displayName;
        } else if (data.name) {
          payload.displayName = data.name;
        }
        
        await updateDoc(userRef, payload);
        
        // Update local React state
        setUserData({ ...userData, ...data, ...payload });
        return true;
      } catch (error) {
        console.error("Error al actualizar perfil en Firestore:", error);
        throw error;
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    // Force a fresh login session if this is a newly opened tab or window session
    if (!sessionStorage.getItem('has_started_session')) {
      signOut(auth).catch(err => console.error("Error signing out on initial launch:", err));
      sessionStorage.setItem('has_started_session', 'true');
    }

    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clear out the previous document listener when auth state changes
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }
      
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          unsubDoc = onSnapshot(userRef, async (userDoc) => {
            if (userDoc.exists()) {
              const rawData = userDoc.data() as any;
              
              let role = rawData.role;
              let displayName = rawData.displayName || rawData.name || null;
              let name = rawData.name || rawData.displayName || '';
              
              // Self-heal and auto-correct admin status for institutional admin email
              if (firebaseUser.email?.toLowerCase() === 'admin@cancun.tecnm.mx') {
                let needsUpdate = false;
                const updates: any = {};
                
                if (role !== 'admin') {
                  role = 'admin';
                  updates.role = 'admin';
                  needsUpdate = true;
                }
                if (!displayName || displayName === 'Usuario' || displayName === 'Usuario sin nombre' || displayName.toLowerCase() === 'usuario') {
                  displayName = 'ADMIN';
                  updates.displayName = 'ADMIN';
                  needsUpdate = true;
                }
                if (!name || name === 'Usuario' || name === '' || name.toLowerCase() === 'usuario') {
                  name = 'ADMIN';
                  updates.name = 'ADMIN';
                  needsUpdate = true;
                }
                
                if (needsUpdate) {
                  await updateDoc(userRef, updates).catch(err => console.error("Error setting admin parameters in Firestore:", err));
                }
              }
              
              const normalizedData: UserData = {
                ...rawData,
                role,
                uid: firebaseUser.uid,
                displayName,
                name
              };
              setUserData(normalizedData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          }, (err) => {
            console.error("Error setting doc snapshot subscription:", err);
            setUserData(null);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error setting up user doc listener:", error);
          setUserData(null);
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) {
        unsubDoc();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, updateProfile, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
