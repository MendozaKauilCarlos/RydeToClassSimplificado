// Funciones para interactuar con Firestore

// ============ USUARIOS ============

// Crear o actualizar usuario
async function saveUser(userData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        await db.collection('users').doc(user.uid).set({
            ...userData,
            userId: user.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        return true;
    } catch (error) {
        console.error('Error guardando usuario:', error);
        throw error;
    }
}

// Obtener datos del usuario
async function getUser(userId = null) {
    try {
        const uid = userId || auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        throw error;
    }
}

// Obtener todos los usuarios (para administración)
async function getAllUsers() {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
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

// Crear viaje
async function createTrip(tripData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const tripRef = await db.collection('trips').add({
            ...tripData,
            userId: user.uid,
            passengerId: user.uid,
            status: 'requested',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return tripRef.id;
    } catch (error) {
        console.error('Error creando viaje:', error);
        throw error;
    }
}

// Obtener viajes del usuario (pasajero)
async function getUserTrips(userId = null) {
    try {
        const uid = userId || auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        
        const snapshot = await db.collection('trips')
            .where('passengerId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo viajes:', error);
        throw error;
    }
}

// Obtener viajes del conductor
async function getDriverTrips(driverId = null) {
    try {
        const uid = driverId || auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        
        const snapshot = await db.collection('trips')
            .where('driverId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo viajes del conductor:', error);
        throw error;
    }
}

// Actualizar estado del viaje
async function updateTripStatus(tripId, status, additionalData = {}) {
    try {
        await db.collection('trips').doc(tripId).update({
            status,
            ...additionalData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error actualizando viaje:', error);
        throw error;
    }
}

// Escuchar cambios en viajes (tiempo real)
function subscribeToTrips(callback, userId = null) {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return null;
    
    return db.collection('trips')
        .where('passengerId', '==', uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const trips = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(trips);
        });
}

// ============ SOLICITUDES DE VIAJE (Para conductores) ============

// Obtener solicitudes de viaje disponibles
async function getRideRequests() {
    try {
        const snapshot = await db.collection('rideRequests')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        throw error;
    }
}

// Aceptar solicitud de viaje
async function acceptRideRequest(requestId, driverId) {
    try {
        const batch = db.batch();
        
        // Actualizar solicitud
        const requestRef = db.collection('rideRequests').doc(requestId);
        batch.update(requestRef, {
            status: 'accepted',
            driverId: driverId,
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Crear viaje activo
        const requestDoc = await requestRef.get();
        const requestData = requestDoc.data();
        
        const tripRef = db.collection('trips').doc();
        batch.set(tripRef, {
            ...requestData,
            userId: requestData.passengerId || requestData.userId, // Mantener userId del pasajero
            passengerId: requestData.passengerId, // Asegurar passengerId
            driverId: driverId,
            status: 'accepted',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        return tripRef.id;
    } catch (error) {
        console.error('Error aceptando solicitud:', error);
        throw error;
    }
}

// ============ RUTAS (Para conductores) ============

// Crear ruta
async function createRoute(routeData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const routeRef = await db.collection('routes').add({
            ...routeData,
            driverId: user.uid,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return routeRef.id;
    } catch (error) {
        console.error('Error creando ruta:', error);
        throw error;
    }
}

// Obtener rutas del conductor
async function getDriverRoutes(driverId = null) {
    try {
        const uid = driverId || auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        
        const snapshot = await db.collection('routes')
            .where('driverId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo rutas:', error);
        throw error;
    }
}

// Obtener todas las rutas activas (para pasajeros)
async function getActiveRoutes() {
    try {
        const snapshot = await db.collection('routes')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        const routes = [];
        for (const doc of snapshot.docs) {
            const routeData = doc.data();
            // Obtener información del conductor
            if (routeData.driverId) {
                const driverData = await getUser(routeData.driverId);
                routes.push({
                    id: doc.id,
                    ...routeData,
                    driver: driverData
                });
            } else {
                routes.push({
                    id: doc.id,
                    ...routeData
                });
            }
        }
        
        return routes;
    } catch (error) {
        console.error('Error obteniendo rutas activas:', error);
        throw error;
    }
}

// Escuchar cambios en rutas activas (tiempo real para pasajeros)
function subscribeToActiveRoutes(callback) {
    return db.collection('routes')
        .where('active', '==', true)
        .onSnapshot(async (snapshot) => {
            const routes = [];
            for (const doc of snapshot.docs) {
                const routeData = doc.data();
                if (routeData.driverId) {
                    try {
                        const driverData = await getUser(routeData.driverId);
                        routes.push({
                            id: doc.id,
                            ...routeData,
                            driver: driverData
                        });
                    } catch (error) {
                        routes.push({
                            id: doc.id,
                            ...routeData
                        });
                    }
                } else {
                    routes.push({
                        id: doc.id,
                        ...routeData
                    });
                }
            }
            callback(routes);
        });
}

// Escuchar cambios en viajes del pasajero (tiempo real)
function subscribeToPassengerTrips(callback, passengerId = null) {
    const uid = passengerId || auth.currentUser?.uid;
    if (!uid) return null;
    
    return db.collection('trips')
        .where('passengerId', '==', uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(async (snapshot) => {
            const trips = [];
            for (const doc of snapshot.docs) {
                const tripData = doc.data();
                // Obtener información del conductor si existe
                if (tripData.driverId) {
                    try {
                        const driverData = await getUser(tripData.driverId);
                        trips.push({
                            id: doc.id,
                            ...tripData,
                            driver: driverData
                        });
                    } catch (error) {
                        trips.push({
                            id: doc.id,
                            ...tripData
                        });
                    }
                } else {
                    trips.push({
                        id: doc.id,
                        ...tripData
                    });
                }
            }
            callback(trips);
        });
}

// Escuchar cambios en solicitudes de viaje (tiempo real para conductores)
function subscribeToRideRequests(callback) {
    return db.collection('rideRequests')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .onSnapshot(async (snapshot) => {
            const requests = [];
            for (const doc of snapshot.docs) {
                const requestData = doc.data();
                // Obtener información del pasajero
                if (requestData.passengerId) {
                    try {
                        const passengerData = await getUser(requestData.passengerId);
                        requests.push({
                            id: doc.id,
                            ...requestData,
                            passenger: passengerData
                        });
                    } catch (error) {
                        requests.push({
                            id: doc.id,
                            ...requestData
                        });
                    }
                } else {
                    requests.push({
                        id: doc.id,
                        ...requestData
                    });
                }
            }
            callback(requests);
        });
}

// Escuchar cambios en viajes del conductor (tiempo real)
function subscribeToDriverTrips(callback, driverId = null) {
    const uid = driverId || auth.currentUser?.uid;
    if (!uid) return null;
    
    return db.collection('trips')
        .where('driverId', '==', uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(async (snapshot) => {
            const trips = [];
            for (const doc of snapshot.docs) {
                const tripData = doc.data();
                // Obtener información del pasajero
                if (tripData.passengerId) {
                    try {
                        const passengerData = await getUser(tripData.passengerId);
                        trips.push({
                            id: doc.id,
                            ...tripData,
                            passenger: passengerData
                        });
                    } catch (error) {
                        trips.push({
                            id: doc.id,
                            ...tripData
                        });
                    }
                } else {
                    trips.push({
                        id: doc.id,
                        ...tripData
                    });
                }
            }
            callback(trips);
        });
}

// ============ NOTIFICACIONES ============

// Crear notificación
async function createNotification(userId, notificationData) {
    try {
        await db.collection('notifications').add({
            userId,
            ...notificationData,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error creando notificación:', error);
        throw error;
    }
}

// Obtener notificaciones del usuario
async function getUserNotifications(userId = null) {
    try {
        const uid = userId || auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        
        const snapshot = await db.collection('notifications')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        throw error;
    }
}

// Marcar notificación como leída
async function markNotificationAsRead(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error marcando notificación:', error);
        throw error;
    }
}

// ============ AUTENTICACIÓN ============

// Registrar usuario
async function registerUser(email, password, userData) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await saveUser({
            ...userData,
            email: userCredential.user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return userCredential.user;
    } catch (error) {
        console.error('Error registrando usuario:', error);
        throw error;
    }
}

// Iniciar sesión
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error iniciando sesión:', error);
        throw error;
    }
}

// Cerrar sesión
async function logoutUser() {
    try {
        await auth.signOut();
        return true;
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        throw error;
    }
}

// Observar cambios de autenticación
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

// Hacer funciones disponibles globalmente para uso en onclick
if (typeof window !== 'undefined') {
    window.acceptRideRequest = acceptRideRequest;
    window.getDriverTrips = getDriverTrips;
}



