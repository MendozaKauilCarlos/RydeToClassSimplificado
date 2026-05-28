import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
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

export async function updateUserRole(userId: string, role: 'passenger' | 'driver' | 'admin') {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error actualizando rol de usuario:', error);
    throw error;
  }
}

export async function toggleUserSuspension(userId: string, currentSuspended: boolean) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      suspended: !currentSuspended,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error suspendiendo/activando usuario:', error);
    throw error;
  }
}

export async function deleteUserFromDB(userId: string) {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error('Error eliminando usuario:', error);
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
      status: tripData.status || 'requested',
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
      where('passengerId', '==', uid)
    );
    const snapshot = await getDocs(q);
    
    const trips = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    trips.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
    return trips;
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
      where('driverId', '==', uid)
    );
    const snapshot = await getDocs(q);
    
    const trips = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    trips.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
    return trips;
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

    // Desactivar la ruta si el viaje se completa o se cancela
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'completed' || lowerStatus === 'completado' || lowerStatus === 'cancelado') {
      const tripSnap = await getDoc(tripRef);
      if (tripSnap.exists()) {
        const tripData = tripSnap.data();
        if (tripData?.routeId) {
          const routeRef = doc(db, 'routes', tripData.routeId);
          await updateDoc(routeRef, {
            active: false,
            updatedAt: serverTimestamp()
          });
          console.log(`Ruta ${tripData.routeId} desactivada correctamente.`);
        }
      }
    }
    
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
      where('driverId', '==', uid)
    );
    const snapshot = await getDocs(q);
    
    const routes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    routes.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
    return routes;
  } catch (error) {
    console.error('Error obteniendo rutas:', error);
    throw error;
  }
}

export async function deleteRoute(routeId: string) {
  try {
    const routeRef = doc(db, 'routes', routeId);
    await deleteDoc(routeRef);
    return true;
  } catch (error) {
    console.error('Error eliminando ruta:', error);
    throw error;
  }
}

export async function toggleRouteActive(routeId: string, active: boolean) {
  try {
    const routeRef = doc(db, 'routes', routeId);
    await updateDoc(routeRef, {
      active,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error modificando estado de la ruta:', error);
    throw error;
  }
}

export async function deactivateDriverRoutes(driverId: string) {
  try {
    const q = query(
      collection(db, 'routes'),
      where('driverId', '==', driverId),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    const batchPromises = snapshot.docs.map(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        active: false,
        updatedAt: serverTimestamp()
      });
    });
    await Promise.all(batchPromises);
    return true;
  } catch (error) {
    console.error('Error auto-deactivating driver routes:', error);
    throw error;
  }
}

export async function searchRoutes(origin: any, destination: any, date: any) {
  try {
    const q = query(
      collection(db, 'routes'), 
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const rawRoutes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const activeRoutes: any[] = [];
    
    for (const route of rawRoutes) {
      if (route.driverId) {
        const driverDocRef = doc(db, 'users', route.driverId);
        const driverDocSnap = await getDoc(driverDocRef);
        if (driverDocSnap.exists()) {
          const driverData = driverDocSnap.data();
          // Solo conservamos la ruta si el conductor está marcado como conectado (isOnline === true)
          if (driverData?.isOnline === true) {
            activeRoutes.push({
              ...route,
              driverName: driverData.name || driverData.displayName || route.driverName || 'Conductor',
              driverPhotoURL: driverData.photoURL || route.driverPhotoURL,
              driverRating: driverData.rating || route.driverRating || 5.0,
              vehicle: driverData.vehicle || route.vehicle || route.car || 'Vehículo',
              car: driverData.vehicle || route.car || route.vehicle || 'Vehículo'
            });
          }
        }
      }
    }

    return activeRoutes;
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
