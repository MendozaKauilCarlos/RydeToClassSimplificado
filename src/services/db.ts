import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  GeoPoint
} from 'firebase/firestore';
import { db, auth } from './firebase';

// ============ USUARIOS ============

export async function saveUser(userData: any) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      userId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error guardando usuario:', error);
    throw error;
  }
}

export async function getUser(userId: string | null = null) {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error('Usuario no autenticado');
    
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
}

// ============ VIAJES ============

export async function createTrip(tripData: any) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    const tripRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      userId: user.uid,
      passengerId: user.uid,
      status: 'requested',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return tripRef.id;
  } catch (error) {
    console.error('Error creando viaje:', error);
    throw error;
  }
}

export async function getUserTrips(userId: string | null = null) {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error('Usuario no autenticado');
    
    const q = query(
      collection(db, 'trips'), 
      where('passengerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error obteniendo viajes:', error);
    throw error;
  }
}

export async function getDriverTrips(driverId: string | null = null) {
  try {
    const uid = driverId || auth.currentUser?.uid;
    if (!uid) throw new Error('Usuario no autenticado');
    
    const q = query(
      collection(db, 'trips'), 
      where('driverId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error obteniendo viajes del conductor:', error);
    throw error;
  }
}

export async function updateTripStatus(tripId: string, status: string, additionalData = {}) {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      status,
      ...additionalData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error actualizando estado del viaje:', error);
    throw error;
  }
}

// ============ RUTAS (CONDUCTORES) ============

export async function createRoute(routeData: any) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    const routeRef = await addDoc(collection(db, 'routes'), {
      ...routeData,
      driverId: user.uid,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return routeRef.id;
  } catch (error) {
    console.error('Error creando ruta:', error);
    throw error;
  }
}

export async function getDriverRoutes(driverId: string | null = null) {
  try {
    const uid = driverId || auth.currentUser?.uid;
    if (!uid) throw new Error('Usuario no autenticado');
    
    const q = query(
      collection(db, 'routes'), 
      where('driverId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error obteniendo rutas:', error);
    throw error;
  }
}

export async function searchRoutes(origin: any, destination: any, date: any) {
  try {
    const q = query(
      collection(db, 'routes'), 
      where('active', '==', true)
      // Nota: En Firestore, las consultas geoespaciales complejas requieren Geohashes o herramientas como GeoFirestore.
      // Por ahora, traemos las rutas activas y filtramos en el cliente si es necesario.
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error buscando rutas:', error);
    throw error;
  }
}

// ============ UBICACIÓN EN TIEMPO REAL ============

export async function saveLocation(latitude: number, longitude: number, type = 'driver') {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    const locationRef = doc(db, 'locations', user.uid);
    await setDoc(locationRef, {
      userId: user.uid,
      type,
      position: new GeoPoint(latitude, longitude),
      timestamp: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error guardando ubicación:', error);
    throw error;
  }
}

export async function getLocation(userId: string) {
  try {
    const docRef = doc(db, 'locations', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    throw error;
  }
}
