// Estado de la aplicación
const appState = {
    currentScreen: 'login-screen',
    isLoggedIn: false,
    userType: 'passenger', // 'passenger' o 'driver'
    isDriverOnline: false,
    user: {
        name: 'PAKO',
        // email: 'pakodilla3@gmail.com',
        
        phone: '1234567890',
        trips: 12,
        rating: 4.8,
        type: 'passenger'
    },
    activeTrip: null,
    currentTripType: 'custom', // 'custom', 'quick', 'scheduled'
    availableQuickTrips: [
        {
            id: 1,
            driverName: 'Carlos Mendoza',
            driverRating: 4.9,
            vehicle: 'Honda Civic',
            origin: 'Universidad Nacional',
            destination: 'Centro Comercial',
            departureTime: '08:00',
            price: 25,
            availableSeats: 2,
            totalSeats: 4,
            distance: '5.2 km',
            estimatedTime: '15 min'
        },
        {
            id: 2,
            driverName: 'Ana García',
            driverRating: 4.8,
            vehicle: 'Toyota Corolla',
            origin: 'Estación Metro',
            destination: 'Campus Norte',
            departureTime: '07:30',
            price: 30,
            availableSeats: 1,
            totalSeats: 3,
            distance: '8.1 km',
            estimatedTime: '20 min'
        },
        {
            id: 3,
            driverName: 'Luis Rodríguez',
            driverRating: 4.7,
            vehicle: 'Nissan Sentra',
            origin: 'Parque Central',
            destination: 'Universidad',
            departureTime: '09:00',
            price: 20,
            availableSeats: 3,
            totalSeats: 4,
            distance: '4.5 km',
            estimatedTime: '12 min'
        }
    ],
    driverRoutes: [],
    rideRequests: [
        {
            id: 1,
            passengerName: 'María García',
            passengerRating: 4.9,
            origin: 'Universidad Nacional',
            destination: 'Centro Comercial',
            distance: '5.2 km',
            fare: '$45',
            time: 'Hace 2 min'
        },
        {
            id: 2,
            passengerName: 'Juan Pérez',
            passengerRating: 4.7,
            origin: 'Estación Metro',
            destination: 'Campus Norte',
            distance: '8.1 km',
            fare: '$65',
            time: 'Hace 5 min'
        }
    ],
    trips: [
        {
            id: 1,
            type: 'Viaje Personalizado',
            status: 'progress',
            location: 'Ubica',
            time: '07:24'
        },
        {
            id: 2,
            type: 'Viaje Personalizado',
            status: 'requested',
            location: 'Ubica',
            time: '07:01'
        },
        {
            id: 3,
            type: 'Viaje Personalizado',
            status: 'requested',
            location: 'Ubica',
            time: '16:44'
        }
    ],
    map: null,
    currentLocation: null,
    markers: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    updateGreeting();
});

// Inicializar aplicación
// Inicializar aplicación con verificación de Firebase Auth
async function initializeApp() {
    // Esperar a que Firebase esté cargado
    if (typeof firebase === 'undefined' || typeof auth === 'undefined') {
        console.warn('Firebase no está cargado aún, esperando...');
        setTimeout(initializeApp, 100);
        return;
    }
    
    // Escuchar cambios de autenticación
    if (typeof onAuthStateChanged !== 'undefined') {
        onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // Usuario autenticado
                try {
                    const userData = await getUser();
                    if (userData) {
                        appState.user = userData;
                        appState.userType = userData.type || 'passenger';
                        appState.isLoggedIn = true;
                        
                        // Guardar en localStorage
                        localStorage.setItem('userType', appState.userType);
                        localStorage.setItem('rideToClassSession', 'true');
                        
                        // Actualizar UI
                        updateGreeting();
                        updateUIForUserType();
                        
                        // Cargar viajes del usuario (tanto pasajero como conductor)
                        await loadTrips();
                        
                        // Configurar listeners en tiempo real
                        setupRealtimeListeners();
                        
                        // Inicializar notificaciones push (solo en APK)
                        if (typeof initializePushNotifications !== 'undefined') {
                            setTimeout(() => {
                                initializePushNotifications().then(initialized => {
                                    if (initialized) {
                                        console.log('✅ Notificaciones push inicializadas');
                                    }
                                }).catch(err => {
                                    console.log('Notificaciones push no disponibles (solo en APK)');
                                });
                            }, 1000);
                        }
                        
                        // Inicializar notificaciones push (solo en APK)
                        if (typeof initializePushNotifications !== 'undefined') {
                            initializePushNotifications().then(initialized => {
                                if (initialized) {
                                    console.log('Notificaciones push inicializadas');
                                }
                            });
                        }
                        
                        // Si estamos en login, ir a home
                        if (document.getElementById('login-screen').classList.contains('active')) {
                            showScreen('home-screen');
                        }
                    }
                } catch (error) {
                    console.error('Error cargando datos del usuario:', error);
                    // Si hay error, cerrar sesión
                    if (typeof logoutUser !== 'undefined') {
                        await logoutUser();
                    }
                    showScreen('login-screen');
                }
            } else {
                // Usuario no autenticado
                appState.isLoggedIn = false;
                appState.user = {
                    name: '',
                    email: '',
                    phone: '',
                    trips: 0,
                    rating: 0,
                    type: 'passenger'
                };
                localStorage.removeItem('rideToClassSession');
                localStorage.removeItem('userType');
                
                // Si no estamos en login, ir a login
                const currentScreen = document.querySelector('.screen.active');
                if (currentScreen && currentScreen.id !== 'login-screen') {
                    showScreen('login-screen');
                }
            }
        });
    } else {
        // Fallback: verificar localStorage si Firebase Auth no está disponible
        const savedSession = localStorage.getItem('rideToClassSession');
        const savedUserType = localStorage.getItem('userType');
        
        if (savedSession) {
            appState.isLoggedIn = true;
            if (savedUserType) {
                appState.userType = savedUserType;
                appState.user.type = savedUserType;
            }
            showScreen('home-screen');
            updateUIForUserType();
        } else {
            showScreen('login-screen');
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login/Register
    document.getElementById('login-tab').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('register-tab').addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Selector de tipo de usuario
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            selectUserType(type);
        });
    });
    
    // Navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const screen = e.currentTarget.getAttribute('data-screen');
            navigateToScreen(screen);
        });
    });
    
    // Botones de acción - Pasajero
    document.getElementById('request-trip-btn').addEventListener('click', () => {
        appState.currentTripType = 'custom';
        switchTripType('custom');
        showModal('request-trip-modal');
    });
    document.getElementById('view-available-routes-btn')?.addEventListener('click', () => {
        showScreen('active-routes-screen');
        loadActiveRoutes();
    });
    
    document.getElementById('refresh-routes-btn')?.addEventListener('click', () => {
        loadActiveRoutes();
    });
    
    // Botones de acción - Conductor
    document.getElementById('go-online-btn')?.addEventListener('click', toggleDriverOnline);
    document.getElementById('view-ride-requests-btn')?.addEventListener('click', () => {
        showScreen('ride-requests-screen');
        loadRideRequests();
    });
    document.getElementById('active-trips-btn')?.addEventListener('click', () => {
        showScreen('active-trips-screen');
        loadActiveTrips();
    });
    document.getElementById('toggle-online-status')?.addEventListener('click', toggleDriverOnline);
    
    // Emergencia
    document.getElementById('emergency-btn').addEventListener('click', handleEmergency);
    document.getElementById('start-trip-btn').addEventListener('click', handleStartTrip);
    
    // Perfil
    document.querySelectorAll('[data-action="edit-profile"]').forEach(btn => {
        btn.addEventListener('click', () => showScreen('edit-profile-screen'));
    });
    document.querySelectorAll('[data-action="settings"]').forEach(btn => {
        btn.addEventListener('click', () => showScreen('settings-screen'));
    });
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', () => showModal('logout-modal'));
    });
    document.querySelectorAll('[data-action="back-to-profile"]').forEach(btn => {
        btn.addEventListener('click', () => showScreen('profile-screen'));
    });
    document.querySelectorAll('[data-action="view-users"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('users-screen');
            loadAllUsers();
        });
    });
    document.querySelectorAll('[data-action="back-to-settings"]').forEach(btn => {
        btn.addEventListener('click', () => showScreen('settings-screen'));
    });
    
    // Notificaciones
    document.querySelectorAll('#notification-btn, #notification-btn-2, #notification-btn-3').forEach(btn => {
        btn.addEventListener('click', () => showModal('notification-modal'));
    });
    
    // Modales
    document.getElementById('close-notification-modal').addEventListener('click', () => closeModal('notification-modal'));
    document.getElementById('cancel-logout').addEventListener('click', () => closeModal('logout-modal'));
    document.getElementById('confirm-logout').addEventListener('click', handleLogout);
    document.getElementById('cancel-trip').addEventListener('click', () => closeModal('request-trip-modal'));
    document.getElementById('confirm-trip').addEventListener('click', handleConfirmTrip);
    
    // Configuración
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.getAttribute('data-theme');
            switchTheme(theme);
        });
    });
    
    // Filtros de viajes
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            filterTrips(filter);
        });
    });
    
    // Geolocalización
    document.getElementById('get-current-location').addEventListener('click', getCurrentLocation);
    document.getElementById('center-map-btn').addEventListener('click', centerMap);
    
    // Editar perfil
    document.querySelector('.edit-profile-form').addEventListener('submit', handleSaveProfile);
    
    // Ver todos los viajes
    document.querySelectorAll('.see-all-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToScreen('trips-screen');
        });
    });
    
    // Menú desplegable
    document.getElementById('menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
    
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('dropdown-menu');
        const menuBtn = document.getElementById('menu-btn');
        if (dropdown && !dropdown.contains(e.target) && !menuBtn?.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Items del menú desplegable
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.getAttribute('data-action');
            handleDropdownAction(action);
            toggleDropdown();
        });
    });
    
    // Botones de navegación atrás
    document.querySelectorAll('[data-action="back-to-home"]').forEach(btn => {
        btn.addEventListener('click', () => showScreen('home-screen'));
    });
    
    // Modales de viajes
    document.getElementById('close-trip-details')?.addEventListener('click', () => {
        closeModal('trip-details-modal');
    });
    document.getElementById('close-driver-details')?.addEventListener('click', () => {
        closeModal('driver-details-modal');
    });
    document.getElementById('close-statistics')?.addEventListener('click', () => {
        closeModal('statistics-modal');
    });
    document.getElementById('close-about')?.addEventListener('click', () => {
        closeModal('about-modal');
    });
    document.getElementById('contact-driver-btn')?.addEventListener('click', () => {
        showToast('Funcionalidad de contacto próximamente', 'info');
    });
    document.getElementById('cancel-trip-passenger')?.addEventListener('click', () => {
        showModal('cancel-trip-modal');
    });
    document.getElementById('confirm-cancel-trip')?.addEventListener('click', handleCancelTripPassenger);
    document.getElementById('cancel-cancel-trip')?.addEventListener('click', () => {
        closeModal('cancel-trip-modal');
    });
    document.getElementById('rate-trip-btn')?.addEventListener('click', () => {
        closeModal('trip-details-modal');
        showModal('rating-modal');
    });
    document.getElementById('cancel-rating')?.addEventListener('click', () => {
        closeModal('rating-modal');
    });
    
    // Event listeners para modal de conductor canceló
    document.getElementById('keep-trip-btn')?.addEventListener('click', handleKeepTripAfterDriverCancel);
    document.getElementById('cancel-trip-after-driver-btn')?.addEventListener('click', handleCancelTripAfterDriverCancel);
    document.getElementById('submit-rating')?.addEventListener('click', handleSubmitRating);
    
    // Estrellas de calificación
    document.querySelectorAll('#stars-rating i').forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = parseInt(e.target.getAttribute('data-rating'));
            setRating(rating);
        });
        star.addEventListener('mouseenter', (e) => {
            const rating = parseInt(e.target.getAttribute('data-rating'));
            highlightStars(rating);
        });
    });
    document.getElementById('stars-rating')?.addEventListener('mouseleave', () => {
        const currentRating = parseInt(document.getElementById('stars-rating').getAttribute('data-current-rating') || '0');
        highlightStars(currentRating);
    });
    
    // Calcular estimación de viaje
    document.getElementById('trip-destination')?.addEventListener('input', calculateTripEstimate);
    document.getElementById('scheduled-destination')?.addEventListener('input', calculateScheduledEstimate);
    
    // Tabs de tipo de viaje
    document.querySelectorAll('.trip-type-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tripType = e.currentTarget.getAttribute('data-trip-type');
            switchTripType(tripType);
        });
    });
    
    // Botón crear ruta
    document.getElementById('create-route-btn-home')?.addEventListener('click', () => {
        showScreen('create-route-screen');
        loadDriverRoutes();
    });
    document.getElementById('create-route-btn')?.addEventListener('click', handleCreateRoute);
    document.getElementById('get-route-origin-location')?.addEventListener('click', () => {
        getCurrentLocation();
        if (appState.currentLocation) {
            document.getElementById('route-origin').value = `${appState.currentLocation.lat.toFixed(4)}, ${appState.currentLocation.lng.toFixed(4)}`;
        }
    });
    document.getElementById('get-scheduled-location')?.addEventListener('click', () => {
        getCurrentLocation();
        if (appState.currentLocation) {
            document.getElementById('scheduled-origin').value = `${appState.currentLocation.lat.toFixed(4)}, ${appState.currentLocation.lng.toFixed(4)}`;
        }
    });
    
    // Acciones de solicitudes de viaje
    document.addEventListener('click', (e) => {
        if (e.target.closest('.accept-request-btn')) {
            const requestId = e.target.closest('.request-card').getAttribute('data-request-id');
            acceptRideRequest(requestId);
        }
        if (e.target.closest('.reject-request-btn')) {
            const requestId = e.target.closest('.request-card').getAttribute('data-request-id');
            rejectRideRequest(requestId);
        }
        if (e.target.closest('#complete-trip-btn')) {
            completeActiveTrip();
        }
        if (e.target.closest('#cancel-trip-btn')) {
            cancelActiveTrip();
        }
    });
}

// Cambiar entre login y registro
function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Manejar login
// Funciones antiguas eliminadas - ahora se usan las versiones con Firebase más abajo

// Navegar a una pantalla
function navigateToScreen(screenId) {
    showScreen(screenId);
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-screen') === screenId) {
            item.classList.add('active');
        }
    });
    
    // Actualizar UI según tipo de usuario
    updateUIForUserType();
    
    // Inicializar pantalla específica
    if (screenId === 'map-screen') {
        initMap();
    } else if (screenId === 'trips-screen') {
        loadTrips();
    } else if (screenId === 'ride-requests-screen') {
        loadRideRequests();
    } else if (screenId === 'active-trips-screen') {
        loadActiveTrips();
    }
}

// Mostrar pantalla
// Pantallas que requieren autenticación
const protectedScreens = [
    'home-screen',
    'profile-screen',
    'trips-screen',
    'map-screen',
    'settings-screen',
    'edit-profile-screen',
    'ride-requests-screen',
    'accepted-trips-screen',
    'create-route-screen',
    'users-screen',
    'active-routes-screen'
];

function showScreen(screenId) {
    // Verificar si la pantalla requiere autenticación
    if (protectedScreens.includes(screenId) && !appState.isLoggedIn) {
        showToast('Debes iniciar sesión para acceder a esta sección', 'error');
        showScreen('login-screen');
        return;
    }
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        appState.currentScreen = screenId;
    }
}

// Mostrar modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// Cerrar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Actualizar saludo según la hora
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '¡Buenas tardes!';
    
    if (hour < 12) {
        greeting = '¡Buenos días!';
    } else if (hour >= 20) {
        greeting = '¡Buenas noches!';
    }
    
    document.querySelectorAll('#greeting-text, #greeting-text-2').forEach(el => {
        if (el) el.textContent = greeting;
    });
}

// Manejar emergencia
function handleEmergency() {
    if (confirm('¿Deseas llamar al 911?')) {
        window.location.href = 'tel:911';
    }
}


// Manejar solicitar viaje
function handleConfirmTrip(e) {
    e.preventDefault();
    const origin = document.getElementById('trip-origin').value;
    const destination = document.getElementById('trip-destination').value;
    const passengers = document.getElementById('trip-passengers').value;
    
    if (!origin || !destination) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    // Agregar nuevo viaje
    const newTrip = {
        id: appState.trips.length + 1,
        type: 'Viaje Personalizado',
        status: 'requested',
        location: destination,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    
    appState.trips.unshift(newTrip);
    closeModal('request-trip-modal');
    alert('¡Viaje solicitado exitosamente!');
    
    // Limpiar formulario
    document.getElementById('trip-origin').value = '';
    document.getElementById('trip-destination').value = '';
    document.getElementById('trip-passengers').value = '1';
}

// Obtener ubicación actual
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                appState.currentLocation = { lat, lng };
                
                // Actualizar campo de origen
                document.getElementById('trip-origin').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                
                // Actualizar mapa si está visible (Leaflet)
                if (appState.map && typeof L !== 'undefined') {
                    try {
                        appState.map.setView([lat, lng], 15);
                        addMarker([lat, lng], 'Tu ubicación');
                    } catch (error) {
                        console.error('Error actualizando mapa:', error);
                    }
                }
                
                // Actualizar info en mapa
                document.getElementById('location-info').textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos de ubicación.');
            }
        );
    } else {
        alert('Tu navegador no soporta geolocalización');
    }
}

// Inicializar mapa con Leaflet (OpenStreetMap - GRATIS)
function initMap() {
    if (appState.map) {
        return; // El mapa ya está inicializado
    }
    
    // Verificar si Leaflet está disponible
    if (typeof L === 'undefined') {
        document.getElementById('map').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: white; padding: 20px; text-align: center;">
                <i class="fas fa-map" style="font-size: 48px; margin-bottom: 20px; color: var(--primary-color);"></i>
                <h3>Error al cargar el mapa</h3>
                <p style="margin-top: 10px; color: var(--text-secondary);">
                    No se pudo cargar la librería de mapas. Verifica tu conexión a internet.
                </p>
            </div>
        `;
        return;
    }
    
    // Ubicación por defecto (Cancún)
    const defaultLocation = [21.1386, -86.8353];
    
    try {
        // Crear mapa con Leaflet
        appState.map = L.map('map', {
            center: defaultLocation,
            zoom: 13,
            zoomControl: true
        });
        
        // Agregar capa de OpenStreetMap con tema oscuro
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(appState.map);
        
        // Alternativa: Mapa oscuro (descomenta si prefieres)
        // L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        //     attribution: '© OpenStreetMap contributors © CARTO',
        //     subdomains: 'abcd',
        //     maxZoom: 19
        // }).addTo(appState.map);
        
        // Agregar control de geocodificación (búsqueda de lugares)
        if (typeof L.Control.Geocoder !== 'undefined') {
            const geocoder = L.Control.Geocoder.nominatim();
            const geocoderControl = L.Control.geocoder({
                geocoder: geocoder,
                placeholder: 'Buscar lugar...',
                errorMessage: 'No se encontraron resultados.',
                defaultMarkGeocode: false
            }).addTo(appState.map);
            
            geocoderControl.on('markgeocode', function(e) {
                const latlng = e.geocode.center;
                appState.map.setView(latlng, 15);
                addMarker([latlng.lat, latlng.lng], e.geocode.name);
            });
        }
        
        // Obtener ubicación actual si está disponible
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    appState.currentLocation = { lat, lng };
                    
                    appState.map.setView([lat, lng], 15);
                    addMarker([lat, lng], 'Tu ubicación');
                    
                    document.getElementById('location-info').textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
                },
                () => {
                    // Si falla, usar ubicación por defecto
                    addMarker(defaultLocation, 'Ubicación por defecto');
                }
            );
        } else {
            // Si no hay geolocalización, usar ubicación por defecto
            addMarker(defaultLocation, 'Ubicación por defecto');
        }
        
        // Configurar autocompletado para campos de dirección (usando Nominatim)
        setupAddressAutocomplete();
        
    } catch (error) {
        console.error('Error inicializando mapa:', error);
        document.getElementById('map').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: white; padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px; color: var(--warning-color);"></i>
                <h3>Error al cargar el mapa</h3>
                <p style="margin-top: 10px; color: var(--text-secondary);">
                    ${error.message}
                </p>
            </div>
        `;
    }
}

// Configurar autocompletado de direcciones usando Nominatim (gratis)
function setupAddressAutocomplete() {
    const originInput = document.getElementById('trip-origin');
    const destinationInput = document.getElementById('trip-destination');
    const scheduledOrigin = document.getElementById('scheduled-origin');
    const scheduledDestination = document.getElementById('scheduled-destination');
    
    [originInput, destinationInput, scheduledOrigin, scheduledDestination].forEach(input => {
        if (!input) return;
        
        let timeout;
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'address-suggestions';
        suggestionsDiv.style.display = 'none';
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(suggestionsDiv);
        
        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            
            if (query.length < 3) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            timeout = setTimeout(() => {
                searchAddress(query, suggestionsDiv, input);
            }, 300);
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsDiv.style.display = 'none';
            }, 200);
        });
    });
}

// Buscar direcciones usando Nominatim (gratis, sin API key)
function searchAddress(query, suggestionsDiv, input) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'RideToClass/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        suggestionsDiv.innerHTML = '';
        
        if (data.length === 0) {
            suggestionsDiv.innerHTML = '<div class="suggestion-item">No se encontraron resultados</div>';
            suggestionsDiv.style.display = 'block';
            return;
        }
        
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = item.display_name;
            div.addEventListener('click', () => {
                input.value = item.display_name;
                suggestionsDiv.style.display = 'none';
                
                // Actualizar ubicación en el mapa si está disponible
                if (appState.map) {
                    const lat = parseFloat(item.lat);
                    const lng = parseFloat(item.lon);
                    appState.map.setView([lat, lng], 15);
                    addMarker([lat, lng], item.display_name);
                }
            });
            suggestionsDiv.appendChild(div);
        });
        
        suggestionsDiv.style.display = 'block';
    })
    .catch(error => {
        console.error('Error buscando dirección:', error);
    });
}

// Agregar marcador al mapa (Leaflet)
function addMarker(position, title) {
    if (!appState.map || typeof L === 'undefined') {
        return null;
    }
    
    try {
        // Limpiar marcadores anteriores
        appState.markers.forEach(marker => {
            appState.map.removeLayer(marker);
        });
        appState.markers = [];
        
        // Crear icono personalizado
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: #00d4aa; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        const marker = L.marker(position, {
            icon: customIcon,
            title: title
        }).addTo(appState.map);
        
        // Agregar popup
        if (title) {
            marker.bindPopup(title).openPopup();
        }
        
        appState.markers.push(marker);
        return marker;
    } catch (error) {
        console.error('Error agregando marcador:', error);
        return null;
    }
}

// Centrar mapa en ubicación actual (Leaflet)
function centerMap() {
    if (typeof L === 'undefined') {
        getCurrentLocation();
        return;
    }
    
    if (appState.currentLocation && appState.map) {
        try {
            appState.map.setView([appState.currentLocation.lat, appState.currentLocation.lng], 15);
        } catch (error) {
            console.error('Error centrando mapa:', error);
            getCurrentLocation();
        }
    } else {
        getCurrentLocation();
    }
}

// Iniciar viaje
function handleStartTrip() {
    if (!appState.currentLocation) {
        showToast('Por favor, permite el acceso a tu ubicación para iniciar un viaje', 'warning');
        getCurrentLocation();
        return;
    }
    
    // Buscar viaje aceptado y cambiarlo a en progreso
    const acceptedTrip = appState.trips.find(t => t.status === 'accepted');
    if (acceptedTrip) {
        acceptedTrip.status = 'progress';
        acceptedTrip.startedAt = new Date();
        
        if (appState.activeTrip) {
            appState.activeTrip.status = 'progress';
        }
        
        showToast('¡Viaje iniciado! El conductor está en camino.', 'success');
        document.getElementById('route-info').textContent = 'Ruta activa';
        loadTrips();
        loadActiveTrips();
    } else {
        showToast('No tienes viajes aceptados para iniciar', 'warning');
    }
}

// Cargar viajes desde Firestore
async function loadTrips() {
    const tripsList = document.getElementById('trips-list');
    if (!tripsList) return;
    
    tripsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando viajes...</p></div>';
    
    try {
        // Cargar desde Firestore si está disponible
        if (appState.isLoggedIn && typeof auth !== 'undefined' && auth.currentUser) {
            let firestoreTrips;
            try {
                // Cargar viajes según el tipo de usuario
                if (appState.userType === 'driver') {
                    // Para conductores: cargar viajes donde driverId sea igual al ID del conductor
                    if (typeof getDriverTrips !== 'undefined') {
                        firestoreTrips = await getDriverTrips();
                    } else if (typeof window.getDriverTrips !== 'undefined') {
                        firestoreTrips = await window.getDriverTrips();
                    } else {
                        // Fallback: consulta directa
                        const uid = auth.currentUser.uid;
                        const snapshot = await db.collection('trips')
                            .where('driverId', '==', uid)
                            .get();
                        firestoreTrips = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                    }
                } else {
                    // Para pasajeros: cargar viajes donde passengerId sea igual al ID del pasajero
                    if (typeof getUserTrips !== 'undefined') {
                        firestoreTrips = await getUserTrips();
                    } else {
                        // Fallback: consulta directa
                        const uid = auth.currentUser.uid;
                        const snapshot = await db.collection('trips')
                            .where('passengerId', '==', uid)
                            .get();
                        firestoreTrips = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                    }
                }
                console.log('Viajes cargados desde Firestore:', firestoreTrips?.length || 0, 'Tipo:', appState.userType);
            } catch (error) {
                console.error('Error cargando viajes desde Firestore:', error);
                if (error.message && (error.message.includes('index') || error.message.includes('requires an index'))) {
                    tripsList.innerHTML = `
                        <div class="info-message">
                            <i class="fas fa-info-circle"></i>
                            <p>Los índices de Firestore se están creando. Por favor espera 2-5 minutos y recarga la página.</p>
                        </div>
                    `;
                    return;
                }
                // Si hay otro error, intentar cargar sin ordenar por createdAt
                try {
                    const uid = auth.currentUser.uid;
                    const field = appState.userType === 'driver' ? 'driverId' : 'passengerId';
                    const snapshot = await db.collection('trips')
                        .where(field, '==', uid)
                        .get();
                    firestoreTrips = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    console.log('Viajes cargados sin ordenar:', firestoreTrips.length);
                } catch (fallbackError) {
                    console.error('Error en fallback:', fallbackError);
                    throw error; // Lanzar el error original
                }
            }
            if (firestoreTrips && firestoreTrips.length > 0) {
                // Convertir viajes de Firestore al formato esperado
                appState.trips = firestoreTrips.map(trip => {
                    // Para conductores, mostrar información del pasajero
                    // Para pasajeros, mostrar información del conductor
                    const otherUser = appState.userType === 'driver' ? trip.passenger : trip.driver;
                    
                    return {
                        id: trip.id,
                        type: trip.type === 'custom' ? 'Viaje Personalizado' : 
                              trip.type === 'scheduled' ? 'Viaje Programado' : 
                              trip.type === 'quick' ? 'Viaje Rápido' : trip.type,
                        status: trip.status || 'requested',
                        origin: trip.origin,
                        destination: trip.destination,
                        location: trip.destination,
                        time: trip.scheduledTime || trip.createdAt?.toDate?.()?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        date: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : (trip.createdAt?.toDate?.() || new Date()),
                        passengers: trip.passengers || 1,
                        distance: trip.distance || '0',
                        estimatedTime: trip.estimatedTime || '0',
                        fare: trip.fare || '0',
                        // Información según el tipo de usuario
                        driverName: appState.userType === 'driver' ? null : (otherUser?.name || trip.driverName || null),
                        driverRating: appState.userType === 'driver' ? null : (otherUser?.rating || trip.driverRating || null),
                        vehicle: appState.userType === 'driver' ? null : (otherUser?.vehicle || trip.vehicle || null),
                        passengerName: appState.userType === 'driver' ? (otherUser?.name || 'Pasajero') : null,
                        passengerRating: appState.userType === 'driver' ? (otherUser?.rating || 0) : null,
                        rated: trip.rated || false
                    };
                });
            } else {
                appState.trips = [];
            }
        }
        
        // Renderizar viajes
        tripsList.innerHTML = '';
        
        if (appState.trips.length === 0) {
            tripsList.innerHTML = `
                <div class="no-active-trips">
                    <i class="fas fa-route"></i>
                    <p>No tienes viajes registrados</p>
                </div>
            `;
            return;
        }
        
        appState.trips.forEach(trip => {
            const tripItem = createTripItem(trip);
            tripsList.appendChild(tripItem);
        });
        
        // Actualizar conteos
        updateTripsStats();
    } catch (error) {
        console.error('Error cargando viajes:', error);
        tripsList.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Error: ${error.message}</p></div>`;
    }
}

// Actualizar estadísticas de viajes
function updateTripsStats() {
    const totalCount = appState.trips?.length || 0;
    const activeCount = appState.trips?.filter(t => 
        t.status === 'requested' || 
        t.status === 'accepted' || 
        t.status === 'progress' ||
        t.status === 'scheduled'
    ).length || 0;
    const completedCount = appState.trips?.filter(t => 
        t.status === 'completed'
    ).length || 0;
    
    // Actualizar elementos HTML
    const totalEl = document.getElementById('trips-total-count');
    const activeEl = document.getElementById('trips-active-count');
    const completedEl = document.getElementById('trips-completed-count');
    
    if (totalEl) totalEl.textContent = totalCount;
    if (activeEl) activeEl.textContent = activeCount;
    if (completedEl) completedEl.textContent = completedCount;
}

// Crear elemento de viaje
function createTripItem(trip) {
    const item = document.createElement('div');
    item.className = 'trip-item';
    
    const statusClass = trip.status === 'progress' ? 'progress' : 
                        trip.status === 'requested' ? 'requested' : 'custom';
    const statusText = trip.status === 'progress' ? 'EN PROGRESO' :
                      trip.status === 'requested' ? 'SOLICITADO' : trip.type;
    
    item.innerHTML = `
        <div class="trip-badge ${statusClass}">
            <i class="fas fa-map-marker-alt"></i>
            ${trip.type}
        </div>
        <div class="trip-status">
            <span class="trip-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="trip-info">
            <div>
                <i class="fas fa-map-marker-alt"></i>
                ${trip.location}
            </div>
            <div>
                <i class="fas fa-clock"></i>
                ${trip.time}
            </div>
        </div>
    `;
    
    return item;
}

// Filtrar viajes
function filterTrips(filter) {
    // Actualizar tabs activos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-filter') === filter) {
            tab.classList.add('active');
        }
    });
    
    // Filtrar y mostrar viajes
    let filteredTrips = appState.trips;
    
    if (filter !== 'all') {
        filteredTrips = appState.trips.filter(trip => {
            if (filter === 'requested') return trip.status === 'requested';
            if (filter === 'progress') return trip.status === 'progress' || trip.status === 'accepted';
            if (filter === 'completed') return trip.status === 'completed';
            if (filter === 'cancelled') return trip.status === 'cancelled';
            return true;
        });
    }
    
    const tripsList = document.getElementById('trips-list');
    tripsList.innerHTML = '';
    
    // Actualizar conteos
    updateTripsStats();
    
    filteredTrips.forEach(trip => {
        const tripItem = createTripItem(trip);
        tripsList.appendChild(tripItem);
    });
}


// Guardar perfil
function handleSaveProfile(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const phone = e.target.querySelector('input[type="tel"]').value;
    
    appState.user.name = name;
    appState.user.email = email;
    appState.user.phone = phone;
    
    // Actualizar UI
    document.querySelectorAll('.profile-name').forEach(el => {
        if (el) el.textContent = name;
    });
    document.querySelectorAll('.profile-email').forEach(el => {
        if (el) el.textContent = email;
    });
    document.querySelectorAll('.username').forEach(el => {
        if (el) el.textContent = name;
    });
    
    alert('Perfil actualizado exitosamente');
    showScreen('profile-screen');
}

// Cerrar sesión (usando Firebase)
async function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        try {
            // Cerrar sesión en Firebase
            if (typeof logoutUser !== 'undefined') {
                await logoutUser();
            }
            
            // Limpiar listeners en tiempo real
            cleanupRealtimeListeners();
            
            // Limpiar estado local
            appState.isLoggedIn = false;
            appState.user = {
                name: '',
                email: '',
                phone: '',
                trips: 0,
                rating: 0,
                type: 'passenger'
            };
            appState.userType = 'passenger';
            localStorage.removeItem('rideToClassSession');
            localStorage.removeItem('userType');
            
            closeModal('logout-modal');
            showScreen('login-screen');
            showToast('Sesión cerrada correctamente', 'success');
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            showToast('Error al cerrar sesión', 'error');
        }
    }
}

// Buscar viajes
document.querySelector('.search-bar input')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const tripsList = document.getElementById('trips-list');
    
    if (!tripsList) return;
    
    const filteredTrips = appState.trips.filter(trip => {
        return trip.type.toLowerCase().includes(searchTerm) ||
               trip.location.toLowerCase().includes(searchTerm);
    });
    
    tripsList.innerHTML = '';
    filteredTrips.forEach(trip => {
        const tripItem = createTripItem(trip);
        tripsList.appendChild(tripItem);
    });
});

// Cargar tema guardado
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);
const themeBtn = document.querySelector(`[data-theme="${savedTheme}"]`);
if (themeBtn) {
    themeBtn.classList.add('active');
    const otherBtn = document.querySelector(`[data-theme="${savedTheme === 'dark' ? 'light' : 'dark'}"]`);
    if (otherBtn) otherBtn.classList.remove('active');
}

// Aplicar tema
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
}

// Cambiar tema
function switchTheme(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });
    
    applyTheme(theme);
    showToast(`Tema cambiado a ${theme === 'dark' ? 'oscuro' : 'claro'}`, 'success');
}

// Toggle menú desplegable
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Manejar acciones del menú desplegable
function handleDropdownAction(action) {
    switch(action) {
        case 'notifications':
            showModal('notification-modal');
            break;
        case 'my-trips':
            navigateToScreen('trips-screen');
            break;
        case 'accepted-trips':
            showScreen('accepted-trips-screen');
            loadAcceptedTrips();
            break;
        case 'create-route':
            showScreen('create-route-screen');
            loadDriverRoutes();
            break;
        case 'ride-requests':
            showScreen('ride-requests-screen');
            loadRideRequests();
            break;
        case 'edit-profile':
            showScreen('edit-profile-screen');
            break;
        case 'settings':
            showScreen('settings-screen');
            break;
        case 'view-users':
            showScreen('users-screen');
            loadAllUsers();
            break;
        case 'statistics':
            showModal('statistics-modal');
            loadStatistics();
            break;
        case 'help':
            alert('Centro de ayuda: Para más información, contacta a soporte@ridetoclass.com');
            break;
        case 'about':
            showModal('about-modal');
            break;
        case 'logout':
            showModal('logout-modal');
            break;
    }
}

// Calcular estimación de viaje
function calculateTripEstimate() {
    const origin = document.getElementById('trip-origin')?.value;
    const destination = document.getElementById('trip-destination')?.value;
    const estimateDiv = document.getElementById('trip-estimate');
    
    if (!origin || !destination || !estimateDiv) return;
    
    // Simular cálculo (en producción usarías la API de Google Maps)
    const distance = (Math.random() * 20 + 2).toFixed(1); // 2-22 km
    const time = Math.round(distance * 2.5); // minutos aproximados
    const price = (parseFloat(distance) * 8 + 20).toFixed(0); // precio base
    
    document.getElementById('estimate-distance').textContent = `${distance} km`;
    document.getElementById('estimate-time').textContent = `${time} min`;
    document.getElementById('estimate-price').textContent = `$${price}`;
    
    estimateDiv.style.display = 'flex';
    estimateDiv.style.animation = 'slideUp 0.3s ease';
}

// Mostrar detalles del viaje
function showTripDetails(trip) {
    const modal = document.getElementById('trip-details-modal');
    const content = document.getElementById('trip-details-content');
    const cancelBtn = document.getElementById('cancel-trip-passenger');
    const rateBtn = document.getElementById('rate-trip-btn');
    
    if (!modal || !content) return;
    
    const isActive = trip.status === 'progress' || trip.status === 'accepted';
    const isCompleted = trip.status === 'completed';
    
    content.innerHTML = `
        <div class="trip-detail-section">
            <h3><i class="fas fa-route"></i> Ruta</h3>
            <div class="route-point">
                <div class="route-icon start">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="route-info">
                    <p>${trip.origin || 'Origen'}</p>
                </div>
            </div>
            <div class="route-point">
                <div class="route-icon end">
                    <i class="fas fa-flag"></i>
                </div>
                <div class="route-info">
                    <p>${trip.destination || 'Destino'}</p>
                </div>
            </div>
        </div>
        
        ${isActive ? `
        <div class="trip-detail-section">
            <h3><i class="fas fa-user"></i> Conductor</h3>
            <div class="driver-info-card">
                <div class="avatar-small">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <strong>${trip.driverName || 'Conductor asignado'}</strong>
                    <p>⭐ ${trip.driverRating || '4.8'}</p>
                    <p><i class="fas fa-car"></i> ${trip.vehicle || 'Toyota Corolla'}</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="trip-detail-section">
            <h3><i class="fas fa-info-circle"></i> Información del Viaje</h3>
            <div class="trip-info-grid">
                <div class="trip-info-item">
                    <i class="fas fa-route"></i>
                    <strong>${trip.distance || '5.2'} km</strong>
                    <span>Distancia</span>
                </div>
                <div class="trip-info-item">
                    <i class="fas fa-clock"></i>
                    <strong>${trip.estimatedTime || '15'} min</strong>
                    <span>Tiempo estimado</span>
                </div>
                <div class="trip-info-item">
                    <i class="fas fa-dollar-sign"></i>
                    <strong>$${trip.fare || '45'}</strong>
                    <span>Precio</span>
                </div>
                <div class="trip-info-item">
                    <i class="fas fa-users"></i>
                    <strong>${trip.passengers || 1}</strong>
                    <span>Pasajeros</span>
                </div>
            </div>
        </div>
        
        <div class="trip-detail-section">
            <h3><i class="fas fa-calendar"></i> Estado</h3>
            <p><strong>Estado:</strong> <span class="trip-status-badge ${trip.status}">${getStatusText(trip.status)}</span></p>
            <p><strong>Fecha:</strong> ${new Date(trip.date || Date.now()).toLocaleString('es-ES')}</p>
        </div>
    `;
    
    if (cancelBtn) cancelBtn.style.display = isActive ? 'flex' : 'none';
    if (rateBtn) rateBtn.style.display = isCompleted ? 'flex' : 'none';
    
    showModal('trip-details-modal');
}

function getStatusText(status) {
    const statusMap = {
        'requested': 'SOLICITADO',
        'accepted': 'ACEPTADO',
        'progress': 'EN PROGRESO',
        'completed': 'COMPLETADO',
        'cancelled': 'CANCELADO',
        'scheduled': 'PROGRAMADO'
    };
    return statusMap[status] || status.toUpperCase();
}

// Cancelar viaje (pasajero)
async function handleCancelTripPassenger() {
    const reason = document.getElementById('cancel-reason')?.value;
    const activeTrip = appState.trips.find(t => t.status === 'progress' || t.status === 'accepted' || t.status === 'requested');
    
    if (!activeTrip) {
        showToast('No se encontró un viaje activo', 'error');
        return;
    }
    
    try {
        // Actualizar en Firestore si está disponible
        if (typeof updateTripStatus !== 'undefined' && typeof db !== 'undefined' && activeTrip.id) {
            await updateTripStatus(activeTrip.id, 'cancelled', {
                cancelReason: reason || 'Cancelado por el pasajero',
                cancelledBy: 'passenger',
                cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Si hay conductor asignado, notificarle
            if (activeTrip.driverId && typeof createNotification !== 'undefined') {
                await createNotification(activeTrip.driverId, {
                    title: 'Viaje Cancelado',
                    message: `El pasajero ha cancelado el viaje. ${reason ? 'Razón: ' + reason : ''}`,
                    type: 'trip_cancelled',
                    tripId: activeTrip.id
                });
            }
        }
        
        // Actualizar estado local
        activeTrip.status = 'cancelled';
        activeTrip.cancelReason = reason;
        activeTrip.cancelledAt = new Date();
        
        closeModal('cancel-trip-modal');
        closeModal('trip-details-modal');
        showToast('Viaje cancelado exitosamente', 'success');
        await loadTrips();
    } catch (error) {
        console.error('Error cancelando viaje:', error);
        showToast('Error al cancelar el viaje: ' + error.message, 'error');
    }
}

// Calificar viaje
let currentRating = 0;

function setRating(rating) {
    currentRating = rating;
    document.getElementById('stars-rating').setAttribute('data-current-rating', rating);
    highlightStars(rating);
}

function highlightStars(rating) {
    document.querySelectorAll('#stars-rating i').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function handleSubmitRating() {
    const comment = document.getElementById('rating-comment')?.value;
    const completedTrip = appState.trips.find(t => t.status === 'completed' && !t.rated);
    
    if (currentRating === 0) {
        showToast('Por favor selecciona una calificación', 'warning');
        return;
    }
    
    if (completedTrip) {
        completedTrip.rating = currentRating;
        completedTrip.ratingComment = comment;
        completedTrip.rated = true;
        completedTrip.ratedAt = new Date();
        
        closeModal('rating-modal');
        showToast('¡Gracias por tu calificación!', 'success');
        loadTrips();
        
        // Limpiar formulario
        currentRating = 0;
        document.getElementById('rating-comment').value = '';
        highlightStars(0);
    }
}

// Cambiar tipo de viaje
function switchTripType(type) {
    appState.currentTripType = type;
    
    // Actualizar tabs
    document.querySelectorAll('.trip-type-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-trip-type') === type) {
            tab.classList.add('active');
        }
    });
    
    // Mostrar formulario correspondiente
    document.querySelectorAll('.trip-type-form').forEach(form => {
        form.classList.remove('active');
    });
    
    const confirmBtn = document.getElementById('confirm-trip');
    
    if (type === 'custom') {
        document.getElementById('custom-trip-form').classList.add('active');
        if (confirmBtn) {
            confirmBtn.textContent = 'Solicitar Viaje';
            confirmBtn.style.display = 'flex';
        }
    } else if (type === 'quick') {
        document.getElementById('quick-trip-form').classList.add('active');
        if (confirmBtn) confirmBtn.style.display = 'none';
        loadQuickTrips();
    } else if (type === 'scheduled') {
        document.getElementById('scheduled-trip-form').classList.add('active');
        if (confirmBtn) {
            confirmBtn.textContent = 'Programar Viaje';
            confirmBtn.style.display = 'flex';
        }
        // Establecer fecha mínima como hoy
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('scheduled-date');
        if (dateInput) dateInput.min = today;
    }
}

// Cargar viajes rápidos disponibles
function loadQuickTrips() {
    const quickTripsList = document.getElementById('quick-trips-list');
    if (!quickTripsList) return;
    
    quickTripsList.innerHTML = '';
    
    if (appState.availableQuickTrips.length === 0) {
        quickTripsList.innerHTML = `
            <div class="no-active-trips">
                <i class="fas fa-bolt"></i>
                <p>No hay viajes rápidos disponibles</p>
            </div>
        `;
        return;
    }
    
    appState.availableQuickTrips.forEach(trip => {
        const tripCard = document.createElement('div');
        tripCard.className = 'quick-trip-card';
        tripCard.setAttribute('data-trip-id', trip.id);
        
        tripCard.innerHTML = `
            <div class="quick-trip-header">
                <div class="quick-trip-driver">
                    <div class="avatar-small">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <strong>${trip.driverName}</strong>
                        <p>⭐ ${trip.driverRating} • ${trip.vehicle}</p>
                    </div>
                </div>
                <div class="quick-trip-price">$${trip.price}</div>
            </div>
            
            <div class="quick-trip-route">
                <div class="quick-trip-route-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${trip.origin}</span>
                </div>
                <div class="quick-trip-route-item">
                    <i class="fas fa-flag"></i>
                    <span>${trip.destination}</span>
                </div>
            </div>
            
            <div class="quick-trip-info">
                <div>
                    <i class="fas fa-clock"></i>
                    Salida: ${trip.departureTime}
                </div>
                <div class="quick-trip-seats">
                    <i class="fas fa-users"></i>
                    ${trip.availableSeats} asientos disponibles
                </div>
            </div>
        `;
        
        tripCard.addEventListener('click', () => {
            joinQuickTrip(trip.id);
        });
        
        quickTripsList.appendChild(tripCard);
    });
}

// Unirse a viaje rápido
function joinQuickTrip(tripId) {
    const trip = appState.availableQuickTrips.find(t => t.id === tripId);
    if (!trip) return;
    
    if (trip.availableSeats <= 0) {
        showToast('No hay asientos disponibles', 'warning');
        return;
    }
    
    const newTrip = {
        id: Date.now(),
        type: 'Viaje Rápido',
        status: 'accepted',
        origin: trip.origin,
        destination: trip.destination,
        location: trip.destination,
        time: trip.departureTime,
        date: new Date(),
        passengers: 1,
        distance: trip.distance.replace(' km', ''),
        estimatedTime: trip.estimatedTime.replace(' min', ''),
        fare: trip.price.toString(),
        driverName: trip.driverName,
        driverRating: trip.driverRating,
        vehicle: trip.vehicle,
        rated: false,
        quickTripId: tripId
    };
    
    // Reducir asientos disponibles
    trip.availableSeats--;
    
    appState.trips.unshift(newTrip);
    closeModal('request-trip-modal');
    showToast(`¡Te uniste al viaje de ${trip.driverName}!`, 'success');
    loadTrips();
    loadQuickTrips();
}

// Calcular estimación para viaje programado
function calculateScheduledEstimate() {
    const origin = document.getElementById('scheduled-origin')?.value;
    const destination = document.getElementById('scheduled-destination')?.value;
    const estimateDiv = document.getElementById('scheduled-estimate');
    
    if (!origin || !destination || !estimateDiv) return;
    
    const distance = (Math.random() * 20 + 2).toFixed(1);
    const time = Math.round(distance * 2.5);
    const price = (parseFloat(distance) * 8 + 20).toFixed(0);
    
    document.getElementById('scheduled-distance').textContent = `${distance} km`;
    document.getElementById('scheduled-time-estimate').textContent = `${time} min`;
    document.getElementById('scheduled-price').textContent = `$${price}`;
    
    estimateDiv.style.display = 'flex';
}

// Mejorar función de crear viaje para incluir más detalles
async function handleConfirmTrip(e) {
    e.preventDefault();
    
    if (appState.currentTripType === 'quick') {
        return; // Los viajes rápidos se manejan con joinQuickTrip
    }
    
    if (appState.currentTripType === 'custom') {
        const origin = document.getElementById('trip-origin').value;
        const destination = document.getElementById('trip-destination').value;
        const passengers = document.getElementById('trip-passengers').value;
        
        if (!origin || !destination) {
            showToast('Por favor completa todos los campos', 'warning');
            return;
        }
        
        // Obtener estimaciones
        const distance = document.getElementById('estimate-distance')?.textContent || '5.2 km';
        const time = document.getElementById('estimate-time')?.textContent || '15 min';
        const price = document.getElementById('estimate-price')?.textContent || '$45';
        
        try {
            // Preparar datos del viaje para Firebase
            const tripData = {
                type: 'custom',
                origin: origin,
                destination: destination,
                passengers: parseInt(passengers) || 1,
                distance: distance.replace(' km', ''),
                estimatedTime: time.replace(' min', ''),
                fare: price.replace('$', '').replace(',', ''),
                status: 'requested'
            };
            
            // Guardar en Firestore si está disponible
            if (typeof createTrip !== 'undefined' && typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
                const tripId = await createTrip(tripData);
                console.log('Viaje creado con ID:', tripId);
                
                // Crear también una solicitud de viaje para que los conductores la vean
                try {
                    const requestRef = await db.collection('rideRequests').add({
                        passengerId: auth.currentUser.uid,
                        tripId: tripId,
                        origin: origin,
                        destination: destination,
                        fare: `$${tripData.fare}`,
                        distance: distance,
                        status: 'pending',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('Solicitud de viaje creada con ID:', requestRef.id);
                } catch (requestError) {
                    console.error('Error creando solicitud de viaje:', requestError);
                    // No fallar si la solicitud no se puede crear, el viaje ya está guardado
                }
                
                showToast('¡Viaje solicitado exitosamente!', 'success');
                
                // Esperar un momento para que Firestore se actualice
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                // Fallback: guardar solo localmente
                const newTrip = {
                    id: Date.now(),
                    type: 'Viaje Personalizado',
                    status: 'requested',
                    origin: origin,
                    destination: destination,
                    location: destination,
                    time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(),
                    passengers: parseInt(passengers),
                    distance: distance.replace(' km', ''),
                    estimatedTime: time.replace(' min', ''),
                    fare: price.replace('$', ''),
                    driverName: null,
                    driverRating: null,
                    vehicle: null,
                    rated: false
                };
                appState.trips.unshift(newTrip);
                showToast('¡Viaje solicitado exitosamente!', 'success');
            }
            
            closeModal('request-trip-modal');
            
            // Limpiar formulario
            document.getElementById('trip-origin').value = '';
            document.getElementById('trip-destination').value = '';
            document.getElementById('trip-passengers').value = '1';
            document.getElementById('trip-estimate').style.display = 'none';
            
            // Recargar viajes desde Firestore
            await loadTrips();
        } catch (error) {
            console.error('Error creando viaje:', error);
            showToast('Error al crear el viaje: ' + error.message, 'error');
        }
    } else if (appState.currentTripType === 'scheduled') {
        const origin = document.getElementById('scheduled-origin').value;
        const destination = document.getElementById('scheduled-destination').value;
        const date = document.getElementById('scheduled-date').value;
        const time = document.getElementById('scheduled-time').value;
        const passengers = document.getElementById('scheduled-passengers').value;
        
        if (!origin || !destination || !date || !time) {
            showToast('Por favor completa todos los campos', 'warning');
            return;
        }
        
        const distance = document.getElementById('scheduled-distance')?.textContent || '5.2 km';
        const estimatedTime = document.getElementById('scheduled-time-estimate')?.textContent || '15 min';
        const price = document.getElementById('scheduled-price')?.textContent || '$45';
        
        const scheduledDateTime = new Date(`${date}T${time}`);
        
        try {
            // Preparar datos del viaje programado para Firebase
            const tripData = {
                type: 'scheduled',
                origin: origin,
                destination: destination,
                passengers: parseInt(passengers) || 1,
                distance: distance.replace(' km', ''),
                estimatedTime: estimatedTime.replace(' min', ''),
                fare: price.replace('$', '').replace(',', ''),
                scheduledDate: date,
                scheduledTime: time,
                scheduledDateTime: scheduledDateTime.toISOString(),
                status: 'scheduled'
            };
            
            // Guardar en Firestore si está disponible
            if (typeof createTrip !== 'undefined' && typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
                const tripId = await createTrip(tripData);
                console.log('Viaje programado creado con ID:', tripId);
                
                // Crear también una solicitud de viaje para que los conductores la vean
                try {
                    await db.collection('rideRequests').add({
                        passengerId: auth.currentUser.uid,
                        tripId: tripId,
                        origin: origin,
                        destination: destination,
                        fare: `$${tripData.fare}`,
                        distance: distance,
                        status: 'pending',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (requestError) {
                    console.error('Error creando solicitud de viaje:', requestError);
                }
                
                showToast(`¡Viaje programado para el ${new Date(scheduledDateTime).toLocaleDateString('es-ES')} a las ${time}!`, 'success');
                
                // Esperar un momento para que Firestore se actualice
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                // Fallback: guardar solo localmente
                const newTrip = {
                    id: Date.now(),
                    type: 'Viaje Programado',
                    status: 'scheduled',
                    origin: origin,
                    destination: destination,
                    location: destination,
                    time: time,
                    date: scheduledDateTime,
                    scheduledDate: date,
                    scheduledTime: time,
                    passengers: parseInt(passengers),
                    distance: distance.replace(' km', ''),
                    estimatedTime: estimatedTime.replace(' min', ''),
                    fare: price.replace('$', ''),
                    driverName: null,
                    driverRating: null,
                    vehicle: null,
                    rated: false
                };
                appState.trips.unshift(newTrip);
                showToast(`¡Viaje programado para el ${new Date(scheduledDateTime).toLocaleDateString('es-ES')} a las ${time}!`, 'success');
            }
            
            closeModal('request-trip-modal');
            
            // Limpiar formulario
            document.getElementById('scheduled-origin').value = '';
            document.getElementById('scheduled-destination').value = '';
            document.getElementById('scheduled-date').value = '';
            document.getElementById('scheduled-time').value = '';
            document.getElementById('scheduled-passengers').value = '1';
            document.getElementById('scheduled-estimate').style.display = 'none';
            
            // Recargar viajes desde Firestore
            await loadTrips();
        } catch (error) {
            console.error('Error creando viaje programado:', error);
            showToast('Error al crear el viaje: ' + error.message, 'error');
        }
    }
}

// Mejorar función de crear elemento de viaje
function createTripItem(trip) {
    const item = document.createElement('div');
    item.className = 'trip-item';
    item.style.cursor = 'pointer';
    
    item.addEventListener('click', () => {
        showTripDetails(trip);
    });
    
    const statusClass = trip.status === 'progress' ? 'progress' : 
                        trip.status === 'accepted' ? 'progress' :
                        trip.status === 'scheduled' ? 'requested' :
                        trip.status === 'requested' ? 'requested' : 
                        trip.status === 'completed' ? 'custom' : 'requested';
    const statusText = getStatusText(trip.status);
    
    const typeIcon = trip.type === 'Viaje Rápido' ? 'fa-bolt' : 
                     trip.type === 'Viaje Programado' ? 'fa-calendar-alt' : 
                     'fa-route';
    
    // Mostrar información según el tipo de usuario
    const userInfo = appState.userType === 'driver' && trip.passengerName ? 
        `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <i class="fas fa-user"></i>
            <span><strong>${trip.passengerName}</strong> ${trip.passengerRating ? `⭐ ${trip.passengerRating}` : ''}</span>
        </div>` : 
        (trip.driverName ? `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <i class="fas fa-car"></i>
            <span><strong>${trip.driverName}</strong> ${trip.driverRating ? `⭐ ${trip.driverRating}` : ''}</span>
        </div>` : '');
    
    item.innerHTML = `
        <div class="trip-badge ${statusClass}">
            <i class="fas ${typeIcon}"></i>
            ${trip.type}
        </div>
        <div class="trip-status">
            <span class="trip-badge ${statusClass}">${statusText}</span>
        </div>
        ${userInfo}
        <div class="trip-info">
            <div>
                <i class="fas fa-map-marker-alt"></i>
                ${trip.origin || trip.location || 'Origen'}
            </div>
            <div>
                <i class="fas fa-flag"></i>
                ${trip.destination || trip.location || 'Destino'}
            </div>
            <div>
                <i class="fas fa-clock"></i>
                ${trip.scheduledDate ? `${trip.scheduledDate} ${trip.scheduledTime || trip.time}` : trip.time}
            </div>
            ${trip.fare ? `<div style="color: var(--primary-color); font-weight: bold; margin-top: 5px;">
                <i class="fas fa-dollar-sign"></i>
                $${trip.fare}
            </div>` : ''}
        </div>
    `;
    
    return item;
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Crear ruta (conductor)
function handleCreateRoute() {
    const name = document.getElementById('route-name').value;
    const origin = document.getElementById('route-origin').value;
    const destination = document.getElementById('route-destination').value;
    const departureTime = document.getElementById('route-departure-time').value;
    const seats = document.getElementById('route-seats').value;
    const price = document.getElementById('route-price').value;
    
    if (!name || !origin || !destination || !departureTime || !seats || !price) {
        showToast('Por favor completa todos los campos', 'warning');
        return;
    }
    
    // Obtener días seleccionados
    const selectedDays = [];
    document.querySelectorAll('.day-checkbox input:checked').forEach(checkbox => {
        selectedDays.push(checkbox.value);
    });
    
    if (selectedDays.length === 0) {
        showToast('Selecciona al menos un día de la semana', 'warning');
        return;
    }
    
    const newRoute = {
        id: Date.now(),
        name: name,
        origin: origin,
        destination: destination,
        departureTime: departureTime,
        days: selectedDays,
        availableSeats: parseInt(seats),
        totalSeats: parseInt(seats),
        price: parseFloat(price),
        createdAt: new Date(),
        active: true
    };
    
    appState.driverRoutes.push(newRoute);
    
    showToast('¡Ruta creada exitosamente!', 'success');
    loadDriverRoutes();
    
    // Limpiar formulario
    document.getElementById('route-name').value = '';
    document.getElementById('route-origin').value = '';
    document.getElementById('route-destination').value = '';
    document.getElementById('route-departure-time').value = '';
    document.getElementById('route-seats').value = '4';
    document.getElementById('route-price').value = '';
    document.querySelectorAll('.day-checkbox input').forEach(cb => cb.checked = false);
}

// Cargar rutas del conductor
function loadDriverRoutes() {
    const routesList = document.getElementById('routes-list');
    if (!routesList) return;
    
    routesList.innerHTML = '';
    
    if (appState.driverRoutes.length === 0) {
        routesList.innerHTML = `
            <div class="no-active-trips">
                <i class="fas fa-map-marked-alt"></i>
                <p>No has creado ninguna ruta</p>
            </div>
        `;
        return;
    }
    
    appState.driverRoutes.forEach(route => {
        const routeCard = document.createElement('div');
        routeCard.className = 'route-card';
        routeCard.setAttribute('data-route-id', route.id);
        
        const daysText = route.days.map(day => {
            const dayMap = {
                'lunes': 'Lun',
                'martes': 'Mar',
                'miercoles': 'Mié',
                'jueves': 'Jue',
                'viernes': 'Vie',
                'sabado': 'Sáb',
                'domingo': 'Dom'
            };
            return dayMap[day] || day;
        }).join(', ');
        
        routeCard.innerHTML = `
            <div class="route-card-header">
                <div>
                    <div class="route-card-name">${route.name}</div>
                    <div class="route-card-schedule">
                        <i class="fas fa-clock"></i>
                        ${route.departureTime} • ${daysText}
                    </div>
                </div>
                <div class="route-card-status ${route.active ? 'active' : 'inactive'}">
                    ${route.active ? 'Activa' : 'Inactiva'}
                </div>
            </div>
            
            <div class="route-card-route">
                <div class="route-card-route-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${route.origin}</span>
                </div>
                <div class="route-card-route-item">
                    <i class="fas fa-flag"></i>
                    <span>${route.destination}</span>
                </div>
            </div>
            
            <div class="route-card-footer">
                <div>
                    <div class="route-card-price">$${route.price}</div>
                    <div class="route-card-seats">
                        <i class="fas fa-users"></i>
                        ${route.availableSeats}/${route.totalSeats} asientos
                    </div>
                </div>
                <div class="route-card-actions">
                    <button class="btn-edit" onclick="editRoute(${route.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteRoute(${route.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        routesList.appendChild(routeCard);
    });
}

// Editar ruta
window.editRoute = function(routeId) {
    const route = appState.driverRoutes.find(r => r.id === routeId);
    if (!route) return;
    
    // Llenar formulario con datos de la ruta
    document.getElementById('route-name').value = route.name;
    document.getElementById('route-origin').value = route.origin;
    document.getElementById('route-destination').value = route.destination;
    document.getElementById('route-departure-time').value = route.departureTime;
    document.getElementById('route-seats').value = route.totalSeats;
    document.getElementById('route-price').value = route.price;
    
    // Marcar días
    document.querySelectorAll('.day-checkbox input').forEach(cb => {
        cb.checked = route.days.includes(cb.value);
    });
    
    // Eliminar ruta antigua
    appState.driverRoutes = appState.driverRoutes.filter(r => r.id !== routeId);
    loadDriverRoutes();
    
    showToast('Ruta cargada para editar', 'success');
    
    // Scroll al formulario
    document.querySelector('.route-form-card').scrollIntoView({ behavior: 'smooth' });
};

// Eliminar ruta
window.deleteRoute = function(routeId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta ruta?')) {
        appState.driverRoutes = appState.driverRoutes.filter(r => r.id !== routeId);
        loadDriverRoutes();
        showToast('Ruta eliminada', 'success');
    }
};

// Cargar viajes aceptados (para pasajeros)
function loadAcceptedTrips() {
    const acceptedTripsList = document.getElementById('accepted-trips-list');
    if (!acceptedTripsList) return;
    
    acceptedTripsList.innerHTML = '';
    
    // Filtrar viajes aceptados o en progreso
    const acceptedTrips = appState.trips.filter(trip => 
        (trip.status === 'accepted' || trip.status === 'progress') && trip.driverName
    );
    
    if (acceptedTrips.length === 0) {
        acceptedTripsList.innerHTML = `
            <div class="no-active-trips">
                <i class="fas fa-check-circle"></i>
                <p>No tienes viajes aceptados</p>
            </div>
        `;
        return;
    }
    
    acceptedTrips.forEach(trip => {
        const tripCard = document.createElement('div');
        tripCard.className = 'accepted-trip-card';
        tripCard.addEventListener('click', () => {
            showDriverDetails(trip);
        });
        
        tripCard.innerHTML = `
            <div class="driver-card-header">
                <div class="driver-avatar-large">
                    <i class="fas fa-user"></i>
                </div>
                <div class="driver-info" style="flex: 1;">
                    <h3>${trip.driverName || 'Conductor'}</h3>
                    <p>
                        <i class="fas fa-star"></i>
                        ${trip.driverRating || '4.8'} • ${trip.vehicle || 'Vehículo'}
                    </p>
                </div>
                <div class="trip-status-badge ${trip.status === 'progress' ? 'progress' : 'requested'}">
                    ${trip.status === 'progress' ? 'EN PROGRESO' : 'ACEPTADO'}
                </div>
            </div>
            
            <div class="trip-route">
                <div class="route-point">
                    <div class="route-icon start">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="route-info">
                        <p>${trip.origin}</p>
                    </div>
                </div>
                <div class="route-point">
                    <div class="route-icon end">
                        <i class="fas fa-flag"></i>
                    </div>
                    <div class="route-info">
                        <p>${trip.destination}</p>
                    </div>
                </div>
            </div>
            
            <div class="driver-stats">
                <div class="driver-stat-item">
                    <strong>$${trip.fare || '45'}</strong>
                    <span>Precio</span>
                </div>
                <div class="driver-stat-item">
                    <strong>${trip.distance || '5.2'} km</strong>
                    <span>Distancia</span>
                </div>
                <div class="driver-stat-item">
                    <strong>${trip.estimatedTime || '15'} min</strong>
                    <span>Tiempo</span>
                </div>
            </div>
        `;
        
        acceptedTripsList.appendChild(tripCard);
    });
}

// Mostrar detalles del conductor
function showDriverDetails(trip) {
    const modal = document.getElementById('driver-details-modal');
    const content = document.getElementById('driver-details-content');
    
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div class="driver-profile-section">
            <div class="driver-profile-avatar">
                <i class="fas fa-user"></i>
            </div>
            <h2>${trip.driverName || 'Conductor'}</h2>
            <p style="font-size: 18px; color: var(--primary-color); margin-bottom: 10px;">
                <i class="fas fa-star"></i> ${trip.driverRating || '4.8'}
            </p>
            <p style="color: var(--text-secondary);">Conductor verificado</p>
        </div>
        
        <div class="vehicle-info">
            <h4>
                <i class="fas fa-car"></i>
                Información del Vehículo
            </h4>
            <div class="vehicle-details">
                <div class="vehicle-detail-item">
                    <i class="fas fa-car-side"></i>
                    <strong>${trip.vehicle || 'Toyota Corolla'}</strong>
                    <span>Modelo</span>
                </div>
                <div class="vehicle-detail-item">
                    <i class="fas fa-palette"></i>
                    <strong>Blanco</strong>
                    <span>Color</span>
                </div>
                <div class="vehicle-detail-item">
                    <i class="fas fa-id-card"></i>
                    <strong>ABC-123</strong>
                    <span>Placas</span>
                </div>
            </div>
        </div>
        
        <div class="trip-detail-section">
            <h3><i class="fas fa-route"></i> Ruta del Viaje</h3>
            <div class="route-point">
                <div class="route-icon start">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="route-info">
                    <p>${trip.origin}</p>
                </div>
            </div>
            <div class="route-point">
                <div class="route-icon end">
                    <i class="fas fa-flag"></i>
                </div>
                <div class="route-info">
                    <p>${trip.destination}</p>
                </div>
            </div>
        </div>
        
        <div class="trip-info-grid">
            <div class="trip-info-item">
                <i class="fas fa-dollar-sign"></i>
                <strong>$${trip.fare || '45'}</strong>
                <span>Precio</span>
            </div>
            <div class="trip-info-item">
                <i class="fas fa-route"></i>
                <strong>${trip.distance || '5.2'} km</strong>
                <span>Distancia</span>
            </div>
            <div class="trip-info-item">
                <i class="fas fa-clock"></i>
                <strong>${trip.estimatedTime || '15'} min</strong>
                <span>Tiempo</span>
            </div>
            <div class="trip-info-item">
                <i class="fas fa-users"></i>
                <strong>${trip.passengers || 1}</strong>
                <span>Pasajeros</span>
            </div>
        </div>
    `;
    
    showModal('driver-details-modal');
}

// Cargar estadísticas
function loadStatistics() {
    const statisticsContent = document.getElementById('statistics-content');
    if (!statisticsContent) return;
    
    const completedTrips = appState.trips.filter(t => t.status === 'completed').length;
    const totalTrips = appState.trips.length;
    const avgRating = appState.user.rating || 4.8;
    
    // Datos para gráfico (últimos 7 días)
    const weeklyData = [12, 8, 15, 10, 18, 14, 16];
    const maxValue = Math.max(...weeklyData);
    
    statisticsContent.innerHTML = `
        <div class="stat-chart">
            <h3><i class="fas fa-chart-line"></i> Viajes por Semana</h3>
            <div class="chart-bars">
                ${weeklyData.map((value, index) => {
                    const height = (value / maxValue) * 100;
                    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                    return `
                        <div class="chart-bar" style="height: ${height}%">
                            <span class="chart-bar-value">${value}</span>
                            <span class="chart-bar-label">${days[index]}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="trip-info-grid">
            <div class="trip-info-item">
                <i class="fas fa-route"></i>
                <strong>${totalTrips}</strong>
                <span>Total Viajes</span>
            </div>
            <div class="trip-info-item">
                <i class="fas fa-check-circle"></i>
                <strong>${completedTrips}</strong>
                <span>Completados</span>
            </div>
            <div class="trip-info-item">
                <i class="fas fa-star"></i>
                <strong>${avgRating}</strong>
                <span>Calificación</span>
            </div>
            <div class="trip-info-item">
                <i class="fas fa-dollar-sign"></i>
                <strong>$${totalTrips * 45}</strong>
                <span>Total Gastado</span>
            </div>
        </div>
    `;
}

// Simular notificaciones
setInterval(() => {
    const badge = document.getElementById('notification-badge');
    const menuBadge = document.getElementById('menu-notification-badge');
    if (badge && Math.random() > 0.9) {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        if (menuBadge) menuBadge.textContent = currentCount + 1;
    }
}, 30000);

// Seleccionar tipo de usuario en registro
function selectUserType(type) {
    appState.userType = type;
    document.getElementById('user-type').value = type;
    
    // Actualizar botones
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar/ocultar campos según el tipo
    const phoneGroup = document.getElementById('phone-group');
    const licenseGroup = document.getElementById('license-group');
    const vehicleGroup = document.getElementById('vehicle-group');
    
    if (type === 'driver') {
        phoneGroup.style.display = 'block';
        licenseGroup.style.display = 'block';
        vehicleGroup.style.display = 'block';
        document.getElementById('reg-phone').required = true;
        document.getElementById('reg-license').required = true;
        document.getElementById('reg-vehicle').required = true;
    } else {
        phoneGroup.style.display = 'none';
        licenseGroup.style.display = 'none';
        vehicleGroup.style.display = 'none';
        document.getElementById('reg-phone').required = false;
        document.getElementById('reg-license').required = false;
        document.getElementById('reg-vehicle').required = false;
    }
}

// Actualizar interfaz según tipo de usuario
function updateUIForUserType() {
    const passengerView = document.querySelector('.passenger-view');
    const driverView = document.querySelector('.driver-view');
    
    // Mostrar/ocultar elementos según tipo de usuario
    document.querySelectorAll('.passenger-only').forEach(el => {
        el.style.display = appState.userType === 'passenger' ? 'flex' : 'none';
    });
    
    document.querySelectorAll('.driver-only').forEach(el => {
        el.style.display = appState.userType === 'driver' ? 'flex' : 'none';
    });
    
    if (appState.userType === 'driver') {
        if (passengerView) passengerView.style.display = 'none';
        if (driverView) driverView.style.display = 'flex';
    } else {
        if (passengerView) passengerView.style.display = 'flex';
        if (driverView) driverView.style.display = 'none';
    }
    
    // Actualizar título de la pantalla de viajes
    const tripsTitle = document.querySelector('#trips-screen .page-title');
    if (tripsTitle) {
        if (appState.userType === 'driver') {
            tripsTitle.textContent = 'Mis Viajes como Conductor';
        } else {
            tripsTitle.textContent = 'Mis Viajes Solicitados';
        }
    }
}

// Manejar registro con tipo de usuario (usando Firebase)
async function handleRegister(e) {
    e.preventDefault();
    
    const userType = document.getElementById('user-type').value;
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    // Validación básica
    if (!name || !email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Validación para conductores
    if (userType === 'driver') {
        const phone = document.getElementById('reg-phone').value;
        const license = document.getElementById('reg-license').value;
        const vehicle = document.getElementById('reg-vehicle').value;
        
        if (!phone || !license || !vehicle) {
            showToast('Los conductores deben completar todos los campos', 'error');
            return;
        }
    }
    
    try {
        // Verificar si Firebase está disponible
        if (typeof registerUser === 'undefined') {
            throw new Error('Firebase no está configurado. Por favor, verifica la configuración.');
        }
        
        // Preparar datos del usuario
        const userData = {
            name: name,
            type: userType,
            phone: userType === 'driver' ? document.getElementById('reg-phone').value : '',
            license: userType === 'driver' ? document.getElementById('reg-license').value : '',
            vehicle: userType === 'driver' ? document.getElementById('reg-vehicle').value : '',
            rating: 0,
            trips: 0
        };
        
        // Registrar usuario en Firebase Authentication y Firestore
        await registerUser(email, password, userData);
        
        showToast(`¡Registro exitoso como ${userType === 'driver' ? 'Conductor' : 'Pasajero'}!`, 'success');
        
        // Limpiar formulario
        document.getElementById('register-form').reset();
        
        // Cambiar a pestaña de login
        switchAuthTab('login');
        
    } catch (error) {
        console.error('Error en registro:', error);
        let errorMessage = 'Error al registrar usuario';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo electrónico ya está registrado';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es muy débil';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
    }
}

// Manejar login con tipo de usuario (usando Firebase)
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Validación básica
    if (!email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        // Verificar si Firebase está disponible
        if (typeof loginUser === 'undefined') {
            throw new Error('Firebase no está configurado. Por favor, verifica la configuración.');
        }
        
        // Iniciar sesión con Firebase
        await loginUser(email, password);
        
        // Obtener datos del usuario desde Firestore
        const userData = await getUser();
        
        if (userData) {
            // Actualizar estado de la aplicación
            appState.user = userData;
            appState.userType = userData.type || 'passenger';
            appState.isLoggedIn = true;
            
            // Guardar en localStorage para persistencia
            localStorage.setItem('userType', appState.userType);
            localStorage.setItem('rideToClassSession', 'true');
            
            // Actualizar UI
            updateGreeting();
            updateUIForUserType();
            
            // Navegar a la pantalla principal
            showScreen('home-screen');
            showToast('¡Bienvenido de nuevo!', 'success');
        } else {
            throw new Error('No se pudieron cargar los datos del usuario');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Usuario deshabilitado';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
    }
}

// Toggle estado online del conductor
function toggleDriverOnline() {
    appState.isDriverOnline = !appState.isDriverOnline;
    
    const statusIndicator = document.getElementById('driver-status-indicator');
    const statusText = document.getElementById('driver-status-text');
    const toggleBtn = document.getElementById('toggle-online-status');
    const goOnlineBtn = document.getElementById('go-online-btn');
    
    if (appState.isDriverOnline) {
        if (statusIndicator) {
            statusIndicator.classList.add('online');
            statusIndicator.classList.remove('offline');
        }
        if (statusText) statusText.textContent = 'En línea';
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-toggle-on"></i> Desconectarse';
        }
        if (goOnlineBtn) {
            goOnlineBtn.innerHTML = `
                <div class="btn-icon">
                    <i class="fas fa-toggle-on"></i>
                </div>
                <div class="btn-content">
                    <strong>Desconectarse</strong>
                    <p>No disponible para viajes</p>
                </div>
                <i class="fas fa-chevron-right"></i>
            `;
        }
        alert('¡Estás en línea! Los pasajeros podrán ver que estás disponible.');
    } else {
        if (statusIndicator) {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
        }
        if (statusText) statusText.textContent = 'Desconectado';
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-toggle-off"></i> Conectarse';
        }
        if (goOnlineBtn) {
            goOnlineBtn.innerHTML = `
                <div class="btn-icon">
                    <i class="fas fa-toggle-off"></i>
                </div>
                <div class="btn-content">
                    <strong>Conectarse</strong>
                    <p>Disponible para recibir viajes</p>
                </div>
                <i class="fas fa-chevron-right"></i>
            `;
        }
        alert('Te has desconectado. Ya no recibirás solicitudes de viaje.');
    }
}

// Cargar solicitudes de viaje para conductores
async function loadRideRequests() {
    if (appState.userType !== 'driver') return;
    
    const requestsList = document.getElementById('ride-requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando solicitudes...</p></div>';
    
    try {
        // Cargar desde Firebase si está disponible
        if (typeof getRideRequests !== 'undefined') {
            try {
                appState.rideRequests = await getRideRequests();
            } catch (error) {
                // Si el error es por índice faltante, mostrar mensaje amigable
                if (error.message && error.message.includes('index')) {
                    console.warn('Índice aún no está listo, esperando...', error);
                    requestsList.innerHTML = `
                        <div class="info-message">
                            <i class="fas fa-info-circle"></i>
                            <p>Los índices de Firestore se están creando. Por favor espera 2-5 minutos y recarga la página.</p>
                            <p style="font-size: 12px; margin-top: 10px; color: var(--text-secondary);">
                                Si el problema persiste, ve a Firebase Console → Firestore → Indexes
                            </p>
                        </div>
                    `;
                    return;
                }
                throw error; // Re-lanzar otros errores
            }
        }
        
        if (appState.rideRequests.length === 0) {
            requestsList.innerHTML = `
                <div class="no-active-trips">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay solicitudes de viaje disponibles</p>
                </div>
            `;
            return;
        }
        
        requestsList.innerHTML = '';
        
        appState.rideRequests.forEach(request => {
            const requestCard = document.createElement('div');
            requestCard.className = 'request-card';
            requestCard.setAttribute('data-request-id', request.id);
            
            const passengerName = request.passenger?.name || request.passengerName || 'Pasajero';
            const passengerRating = request.passenger?.rating || request.passengerRating || 0;
            
            requestCard.innerHTML = `
                <div class="request-header">
                    <div class="passenger-info">
                        <div class="avatar-small">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <strong>${passengerName}</strong>
                            <p>⭐ ${passengerRating}</p>
                        </div>
                    </div>
                    <div class="trip-status-badge requested">
                        ${request.time || 'Ahora'}
                    </div>
                </div>
                
                <div class="request-details">
                    <div class="route-point">
                        <div class="route-icon start">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="route-info">
                            <p>${request.origin || 'Origen'}</p>
                        </div>
                    </div>
                    <div class="route-point">
                        <div class="route-icon end">
                            <i class="fas fa-flag"></i>
                        </div>
                        <div class="route-info">
                            <p>${request.destination || 'Destino'}</p>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <strong style="color: var(--primary-color); font-size: 20px;">$${request.fare || 0}</strong>
                        <p style="font-size: 12px; color: var(--text-secondary);">${request.distance || '0 km'}</p>
                    </div>
                </div>
                
                <div class="request-actions">
                    <button class="btn-secondary reject-request-btn" onclick="rejectRideRequest('${request.id}')">
                        <i class="fas fa-times"></i>
                        Rechazar
                    </button>
                    <button class="btn-primary accept-request-btn" onclick="acceptRideRequestLocal('${request.id}')">
                        <i class="fas fa-check"></i>
                        Aceptar
                    </button>
                </div>
            `;
            
            requestsList.appendChild(requestCard);
        });
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        let errorMessage = 'Error al cargar solicitudes';
        
        if (error.message && error.message.includes('index')) {
            errorMessage = 'Los índices de Firestore se están creando. Espera 2-5 minutos y recarga.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        requestsList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${errorMessage}</p>
                ${error.message && error.message.includes('index') ? 
                    '<p style="font-size: 12px; margin-top: 10px;">Ve a Firebase Console → Firestore → Indexes para ver el estado</p>' : 
                    ''
                }
            </div>
        `;
    }
}

// Aceptar solicitud de viaje (función local)
async function acceptRideRequestLocal(requestId) {
    const request = appState.rideRequests.find(r => r.id == requestId);
    if (!request) {
        showToast('Solicitud no encontrada', 'error');
        return;
    }
    
    try {
        // Usar Firebase si está disponible (función de firebase-db.js)
        if (typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            const driverId = auth.currentUser.uid;
            
            // Obtener datos de la solicitud primero
            const requestRef = db.collection('rideRequests').doc(requestId);
            const requestDoc = await requestRef.get();
            
            if (!requestDoc.exists) {
                throw new Error('Solicitud no encontrada');
            }
            
            const requestData = requestDoc.data();
            
            // Usar batch para actualizar solicitud y crear viaje
            const batch = db.batch();
            
            // Actualizar solicitud
            batch.update(requestRef, {
                status: 'accepted',
                driverId: driverId,
                acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Crear viaje activo
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
            
            console.log('Viaje aceptado, ID del viaje:', tripRef.id);
            
            // Esperar un momento para que Firestore se actualice
            await new Promise(resolve => setTimeout(resolve, 500));
            
            showToast(`¡Viaje aceptado! Dirígete a ${request.origin || requestData.origin || 'el origen'}`, 'success');
        } else if (typeof acceptRideRequest !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            // Llamar a la función de firebase-db.js directamente
            const tripId = await acceptRideRequest(requestId, auth.currentUser.uid);
            console.log('Viaje aceptado, ID del viaje:', tripId);
            showToast(`¡Viaje aceptado! Dirígete a ${request.origin || request.passenger?.name || 'el origen'}`, 'success');
        } else if (typeof window.acceptRideRequest !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            // Intentar usar la función global
            const tripId = await window.acceptRideRequest(requestId, auth.currentUser.uid);
            console.log('Viaje aceptado (global), ID del viaje:', tripId);
            showToast(`¡Viaje aceptado! Dirígete a ${request.origin || request.passenger?.name || 'el origen'}`, 'success');
        } else {
            // Fallback: actualizar estado local
            appState.activeTrip = {
                id: Date.now(),
                passengerName: request.passenger?.name || request.passengerName || 'Pasajero',
                passengerRating: request.passenger?.rating || request.passengerRating || 0,
                origin: request.origin,
                destination: request.destination,
                fare: request.fare?.replace('$', '') || '0',
                distance: request.distance?.replace(' km', '') || '0',
                startTime: new Date(),
                status: 'accepted'
            };
            showToast(`¡Viaje aceptado! Dirígete a ${request.origin}`, 'success');
        }
        
        // Actualizar pantallas
        await loadRideRequests();
        loadActiveTrips();
        
        // Recargar viajes del conductor para que aparezca en el menú
        if (appState.userType === 'driver') {
            await loadTrips();
        }
        
        showScreen('active-trips-screen');
    } catch (error) {
        console.error('Error aceptando solicitud:', error);
        console.error('Detalles del error:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Error al aceptar la solicitud';
        
        if (error.code === 'permission-denied') {
            errorMessage = 'No tienes permisos para aceptar esta solicitud. Verifica las reglas de Firestore.';
        } else if (error.code === 'not-found') {
            errorMessage = 'La solicitud no fue encontrada. Puede que ya haya sido aceptada.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
    }
}

// Rechazar solicitud de viaje
async function rejectRideRequest(requestId) {
    try {
        // Actualizar en Firebase si está disponible
        if (typeof db !== 'undefined' && db) {
            await db.collection('rideRequests').doc(requestId).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Actualizar estado local
        appState.rideRequests = appState.rideRequests.filter(r => r.id != requestId);
        await loadRideRequests();
        showToast('Solicitud rechazada', 'info');
    } catch (error) {
        console.error('Error rechazando solicitud:', error);
        // Fallback: actualizar solo localmente
        appState.rideRequests = appState.rideRequests.filter(r => r.id != requestId);
        loadRideRequests();
        showToast('Solicitud rechazada', 'info');
    }
}

// Cargar viajes activos
function loadActiveTrips() {
    const activeTripCard = document.getElementById('active-trip-card');
    const noActiveTrips = document.getElementById('no-active-trips');
    
    if (appState.activeTrip) {
        if (activeTripCard) {
            activeTripCard.style.display = 'block';
            document.getElementById('active-passenger-name').textContent = appState.activeTrip.passengerName;
            document.getElementById('active-passenger-rating').textContent = `⭐ ${appState.activeTrip.passengerRating}`;
            document.getElementById('active-trip-origin').textContent = appState.activeTrip.origin;
            document.getElementById('active-trip-destination').textContent = appState.activeTrip.destination;
        }
        if (noActiveTrips) noActiveTrips.style.display = 'none';
    } else {
        if (activeTripCard) activeTripCard.style.display = 'none';
        if (noActiveTrips) noActiveTrips.style.display = 'block';
    }
}

// Finalizar viaje activo (conductor)
async function completeActiveTrip() {
    if (!appState.activeTrip) {
        showToast('No hay un viaje activo', 'error');
        return;
    }
    
    if (!confirm('¿Confirmas que has completado el viaje?')) {
        return;
    }
    
    try {
        // Buscar el viaje en Firestore usando el ID
        let tripId = appState.activeTrip.id;
        
        // Si no tiene ID, buscar por otros campos
        if (!tripId && typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            const snapshot = await db.collection('trips')
                .where('driverId', '==', auth.currentUser.uid)
                .where('status', 'in', ['accepted', 'progress'])
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                tripId = snapshot.docs[0].id;
            }
        }
        
        if (tripId && typeof updateTripStatus !== 'undefined') {
            // Actualizar en Firestore
            await updateTripStatus(tripId, 'completed', {
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                completedBy: 'driver'
            });
            
            // Notificar al pasajero
            const trip = appState.activeTrip;
            if (trip.passengerId && typeof createNotification !== 'undefined') {
                await createNotification(trip.passengerId, {
                    title: 'Viaje Completado',
                    message: 'El conductor ha marcado el viaje como completado. ¡Gracias por usar Ride to Class!',
                    type: 'trip_completed',
                    tripId: tripId
                });
            }
            
            showToast('¡Viaje completado! Gracias por usar Ride to Class.', 'success');
        } else {
            // Fallback: actualizar solo localmente
            const passengerTrip = appState.trips.find(t => 
                (t.status === 'accepted' || t.status === 'progress') &&
                t.origin === appState.activeTrip.origin &&
                t.destination === appState.activeTrip.destination
            );
            
            if (passengerTrip) {
                passengerTrip.status = 'completed';
                passengerTrip.completedAt = new Date();
            }
            
            appState.activeTrip = null;
            showToast('¡Viaje completado! Gracias por usar Ride to Class.', 'success');
        }
        
        // Recargar pantallas
        loadActiveTrips();
        await loadTrips();
    } catch (error) {
        console.error('Error completando viaje:', error);
        showToast('Error al completar el viaje: ' + error.message, 'error');
    }
}

// Cancelar viaje activo (conductor)
async function cancelActiveTrip() {
    if (!appState.activeTrip) {
        showToast('No hay un viaje activo', 'error');
        return;
    }
    
    // Mostrar modal de confirmación con opciones
    const cancelReason = prompt('¿Por qué deseas cancelar el viaje? (opcional)');
    
    if (cancelReason === null) {
        return; // Usuario canceló
    }
    
    try {
        // Buscar el viaje en Firestore
        let tripId = appState.activeTrip.id;
        
        if (!tripId && typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            const snapshot = await db.collection('trips')
                .where('driverId', '==', auth.currentUser.uid)
                .where('status', 'in', ['accepted', 'progress'])
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                tripId = snapshot.docs[0].id;
            }
        }
        
        if (tripId && typeof updateTripStatus !== 'undefined') {
            // Actualizar en Firestore
            await updateTripStatus(tripId, 'cancelled', {
                cancelReason: cancelReason || 'Cancelado por el conductor',
                cancelledBy: 'driver',
                cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Notificar al pasajero con opción de mantener o cancelar
            const trip = appState.activeTrip;
            if (trip.passengerId && typeof createNotification !== 'undefined') {
                await createNotification(trip.passengerId, {
                    title: 'Viaje Cancelado por el Conductor',
                    message: `El conductor ha cancelado el viaje. ${cancelReason ? 'Razón: ' + cancelReason : ''}`,
                    type: 'trip_cancelled_by_driver',
                    tripId: tripId,
                    driverCancelled: true
                });
            }
            
            // Mostrar notificación al pasajero (si está en la app)
            if (appState.userType === 'passenger') {
                showToast('El conductor ha cancelado el viaje. Se buscará otro conductor.', 'warning');
            }
            
            showToast('Viaje cancelado', 'info');
        } else {
            // Fallback: actualizar solo localmente
            appState.activeTrip = null;
            showToast('Viaje cancelado', 'info');
        }
        
        // Recargar pantallas
        loadActiveTrips();
        await loadTrips();
    } catch (error) {
        console.error('Error cancelando viaje:', error);
        showToast('Error al cancelar el viaje: ' + error.message, 'error');
    }
}

// ============ ADMINISTRACIÓN: VER USUARIOS ============

let allUsersData = [];
let currentFilter = 'all';

// Cargar todos los usuarios
async function loadAllUsers() {
    try {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        usersList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando usuarios...</p></div>';
        
        // Verificar si Firebase está inicializado
        if (typeof db === 'undefined' || !db) {
            usersList.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Firebase no está configurado. Por favor, configura Firebase primero.</p></div>';
            return;
        }
        
        allUsersData = await getAllUsers();
        updateUsersStats();
        renderUsers();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        const usersList = document.getElementById('users-list');
        if (usersList) {
            usersList.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar usuarios: ${error.message}</p></div>`;
        }
    }
}

// Actualizar estadísticas de usuarios
function updateUsersStats() {
    const totalUsers = allUsersData.length;
    const passengers = allUsersData.filter(u => u.type === 'passenger' || !u.type).length;
    const drivers = allUsersData.filter(u => u.type === 'driver').length;
    
    const totalEl = document.getElementById('total-users');
    const passengerEl = document.getElementById('passenger-count');
    const driverEl = document.getElementById('driver-count');
    
    if (totalEl) totalEl.textContent = totalUsers;
    if (passengerEl) passengerEl.textContent = passengers;
    if (driverEl) driverEl.textContent = drivers;
}

// Renderizar lista de usuarios
function renderUsers() {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    // Filtrar usuarios según el filtro activo
    let filteredUsers = allUsersData;
    if (currentFilter === 'passenger') {
        filteredUsers = allUsersData.filter(u => u.type === 'passenger' || !u.type);
    } else if (currentFilter === 'driver') {
        filteredUsers = allUsersData.filter(u => u.type === 'driver');
    }
    
    if (filteredUsers.length === 0) {
        usersList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No hay usuarios registrados</p></div>';
        return;
    }
    
    usersList.innerHTML = filteredUsers.map(user => {
        const createdAt = user.createdAt ? (user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A') : 'N/A';
        const userType = user.type === 'driver' ? 'Conductor' : 'Pasajero';
        const userTypeIcon = user.type === 'driver' ? 'fa-car' : 'fa-user';
        
        return `
            <div class="user-card">
                <div class="user-avatar">
                    <i class="fas ${userTypeIcon}"></i>
                </div>
                <div class="user-info">
                    <h3>${user.name || 'Sin nombre'}</h3>
                    <p class="user-email">${user.email || 'Sin email'}</p>
                    <div class="user-meta">
                        <span class="user-type ${user.type || 'passenger'}">
                            <i class="fas ${userTypeIcon}"></i> ${userType}
                        </span>
                        ${user.phone ? `<span class="user-phone"><i class="fas fa-phone"></i> ${user.phone}</span>` : ''}
                    </div>
                    ${user.rating ? `<div class="user-rating"><i class="fas fa-star"></i> ${user.rating.toFixed(1)}</div>` : ''}
                    <p class="user-date">Registrado: ${createdAt}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Configurar filtros
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterType = btn.getAttribute('data-filter');
            if (filterType === 'all' || filterType === 'today' || filterType === 'week') {
                // Filtros de rutas
                if (typeof currentRouteFilter !== 'undefined') {
                    currentRouteFilter = filterType;
                    renderActiveRoutes();
                }
            } else {
                // Filtros de usuarios
                currentFilter = filterType;
                renderUsers();
            }
        });
    });
});

// ============ RUTAS ACTIVAS PARA PASAJEROS ============

let activeRoutesData = [];
let currentRouteFilter = 'all';
let activeRoutesListener = null;
let passengerTripsListener = null;
let driverRequestsListener = null;
let driverTripsListener = null;

// Cargar rutas activas
async function loadActiveRoutes() {
    try {
        const routesList = document.getElementById('active-routes-list');
        if (!routesList) return;
        
        routesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando rutas...</p></div>';
        
        // Verificar si Firebase está inicializado
        if (typeof getActiveRoutes === 'undefined' || !db) {
            routesList.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Firebase no está configurado.</p></div>';
            return;
        }
        
        activeRoutesData = await getActiveRoutes();
        renderActiveRoutes();
        
        // Configurar listener en tiempo real
        if (typeof subscribeToActiveRoutes !== 'undefined') {
            if (activeRoutesListener) {
                activeRoutesListener(); // Desconectar listener anterior
            }
            activeRoutesListener = subscribeToActiveRoutes((routes) => {
                activeRoutesData = routes;
                renderActiveRoutes();
            });
        }
    } catch (error) {
        console.error('Error cargando rutas:', error);
        const routesList = document.getElementById('active-routes-list');
        if (routesList) {
            routesList.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Error: ${error.message}</p></div>`;
        }
    }
}

// Renderizar rutas activas
function renderActiveRoutes() {
    const routesList = document.getElementById('active-routes-list');
    if (!routesList) return;
    
    // Filtrar rutas según el filtro activo
    let filteredRoutes = activeRoutesData;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const todayName = dayNames[dayOfWeek];
    
    if (currentRouteFilter === 'today') {
        filteredRoutes = activeRoutesData.filter(route => 
            route.days && route.days.includes(todayName)
        );
    } else if (currentRouteFilter === 'week') {
        // Rutas que tienen al menos un día de esta semana
        filteredRoutes = activeRoutesData.filter(route => 
            route.days && route.days.length > 0
        );
    }
    
    if (filteredRoutes.length === 0) {
        routesList.innerHTML = '<div class="empty-state"><i class="fas fa-route"></i><p>No hay rutas activas disponibles</p></div>';
        return;
    }
    
    routesList.innerHTML = filteredRoutes.map(route => {
        const daysText = route.days ? route.days.map(day => {
            const dayMap = {
                'lunes': 'Lun',
                'martes': 'Mar',
                'miercoles': 'Mié',
                'jueves': 'Jue',
                'viernes': 'Vie',
                'sabado': 'Sáb',
                'domingo': 'Dom'
            };
            return dayMap[day] || day;
        }).join(', ') : 'Todos los días';
        
        const driverName = route.driver ? (route.driver.name || 'Conductor') : 'Conductor';
        const driverRating = route.driver ? (route.driver.rating || 0) : 0;
        const availableSeats = route.availableSeats || route.totalSeats || 0;
        const totalSeats = route.totalSeats || 4;
        
        return `
            <div class="route-card" data-route-id="${route.id}">
                <div class="route-card-header">
                    <div>
                        <div class="route-card-name">${route.name || 'Ruta sin nombre'}</div>
                        <div class="route-card-schedule">
                            <i class="fas fa-clock"></i>
                            ${route.departureTime || 'N/A'} • ${daysText}
                        </div>
                    </div>
                    <div class="route-card-status active">
                        Activa
                    </div>
                </div>
                
                <div class="route-card-driver">
                    <div class="avatar-small">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <strong>${driverName}</strong>
                        <p>⭐ ${driverRating.toFixed(1)}</p>
                    </div>
                </div>
                
                <div class="route-card-route">
                    <div class="route-card-route-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${route.origin || 'Origen'}</span>
                    </div>
                    <div class="route-card-route-item">
                        <i class="fas fa-flag"></i>
                        <span>${route.destination || 'Destino'}</span>
                    </div>
                </div>
                
                <div class="route-card-footer">
                    <div>
                        <div class="route-card-price">$${route.price || 0}</div>
                        <div class="route-card-seats">
                            <i class="fas fa-users"></i>
                            ${availableSeats}/${totalSeats} asientos disponibles
                        </div>
                    </div>
                    <button class="btn-primary" onclick="joinRoute('${route.id}')">
                        <i class="fas fa-plus"></i>
                        Unirse
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Unirse a una ruta
window.joinRoute = async function(routeId) {
    try {
        const route = activeRoutesData.find(r => r.id === routeId);
        if (!route) {
            showToast('Ruta no encontrada', 'error');
            return;
        }
        
        if ((route.availableSeats || 0) <= 0) {
            showToast('No hay asientos disponibles en esta ruta', 'warning');
            return;
        }
        
        // Crear solicitud de viaje
        if (typeof createTrip === 'undefined') {
            showToast('Error: Firebase no está configurado', 'error');
            return;
        }
        
        const tripData = {
            type: 'quick',
            origin: route.origin,
            destination: route.destination,
            driverId: route.driverId,
            routeId: routeId,
            status: 'requested',
            fare: route.price || 0
        };
        
        await createTrip(tripData);
        showToast('¡Solicitud enviada! El conductor revisará tu solicitud.', 'success');
        
        // Recargar viajes del pasajero
        if (appState.userType === 'passenger') {
            loadTrips();
        }
    } catch (error) {
        console.error('Error uniéndose a ruta:', error);
        showToast('Error al unirse a la ruta: ' + error.message, 'error');
    }
};

// ============ ACTUALIZACIONES EN TIEMPO REAL ============

// Configurar listeners en tiempo real cuando el usuario inicia sesión
function setupRealtimeListeners() {
    if (!appState.isLoggedIn) return;
    
    // Para pasajeros: escuchar cambios en sus viajes
    if (appState.userType === 'passenger' && typeof subscribeToPassengerTrips !== 'undefined') {
        if (passengerTripsListener) {
            passengerTripsListener(); // Desconectar listener anterior
        }
        passengerTripsListener = subscribeToPassengerTrips((trips) => {
            // Convertir viajes al formato esperado
            const formattedTrips = trips.map(trip => {
                const otherUser = trip.driver;
                return {
                    id: trip.id,
                    type: trip.type === 'custom' ? 'Viaje Personalizado' : 
                          trip.type === 'scheduled' ? 'Viaje Programado' : 
                          trip.type === 'quick' ? 'Viaje Rápido' : trip.type,
                    status: trip.status || 'requested',
                    origin: trip.origin,
                    destination: trip.destination,
                    location: trip.destination,
                    time: trip.scheduledTime || trip.createdAt?.toDate?.()?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    date: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : (trip.createdAt?.toDate?.() || new Date()),
                    passengers: trip.passengers || 1,
                    distance: trip.distance || '0',
                    estimatedTime: trip.estimatedTime || '0',
                    fare: trip.fare || '0',
                    driverName: otherUser?.name || trip.driverName || null,
                    driverRating: otherUser?.rating || trip.driverRating || null,
                    vehicle: otherUser?.vehicle || trip.vehicle || null,
                    rated: trip.rated || false
                };
            });
            
            // Detectar cambios de estado
            const previousTrips = appState.trips || [];
            formattedTrips.forEach(trip => {
                const previousTrip = previousTrips.find(pt => pt.id === trip.id);
                
                // Si el viaje fue aceptado
                if (trip.status === 'accepted' && (!previousTrip || previousTrip.status !== 'accepted')) {
                    showToast('¡Un conductor ha aceptado tu viaje!', 'success');
                }
                
                // Si el viaje fue completado
                if (trip.status === 'completed' && (!previousTrip || previousTrip.status !== 'completed')) {
                    showToast('¡Tu viaje ha sido completado!', 'success');
                }
                
                // Si el viaje fue cancelado por el conductor
                if (trip.status === 'cancelled' && trip.cancelledBy === 'driver' && (!previousTrip || previousTrip.status !== 'cancelled')) {
                    showDriverCancelledModal(trip);
                }
            });
            
            appState.trips = formattedTrips;
            loadTrips();
            updateTripsStats(); // Actualizar conteos
        });
    }
    
    // Para conductores: escuchar nuevas solicitudes
    if (appState.userType === 'driver' && typeof subscribeToRideRequests !== 'undefined') {
        if (driverRequestsListener) {
            driverRequestsListener(); // Desconectar listener anterior
        }
        
        let previousRequestsCount = appState.rideRequests?.length || 0;
        
        driverRequestsListener = subscribeToRideRequests((requests) => {
            // Notificar si hay nuevas solicitudes
            if (requests.length > previousRequestsCount) {
                const newCount = requests.length - previousRequestsCount;
                showToast(`Tienes ${newCount} nueva(s) solicitud(es) de viaje`, 'info');
            }
            
            appState.rideRequests = requests;
            previousRequestsCount = requests.length;
            
            // Si estamos en la pantalla de solicitudes, actualizar
            if (document.getElementById('ride-requests-screen')?.classList.contains('active')) {
                loadRideRequests();
            }
        });
        
        // Escuchar viajes del conductor
        if (typeof subscribeToDriverTrips !== 'undefined') {
            if (driverTripsListener) {
                driverTripsListener(); // Desconectar listener anterior
            }
            driverTripsListener = subscribeToDriverTrips((trips) => {
                // Convertir viajes al formato esperado
                const formattedTrips = trips.map(trip => {
                    const otherUser = trip.passenger;
                    return {
                        id: trip.id,
                        type: trip.type === 'custom' ? 'Viaje Personalizado' : 
                              trip.type === 'scheduled' ? 'Viaje Programado' : 
                              trip.type === 'quick' ? 'Viaje Rápido' : trip.type,
                        status: trip.status || 'requested',
                        origin: trip.origin,
                        destination: trip.destination,
                        location: trip.destination,
                        time: trip.scheduledTime || trip.createdAt?.toDate?.()?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        date: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : (trip.createdAt?.toDate?.() || new Date()),
                        passengers: trip.passengers || 1,
                        distance: trip.distance || '0',
                        estimatedTime: trip.estimatedTime || '0',
                        fare: trip.fare || '0',
                        passengerName: otherUser?.name || 'Pasajero',
                        passengerRating: otherUser?.rating || 0,
                        rated: trip.rated || false
                    };
                });
                
                appState.trips = formattedTrips;
                appState.activeTrip = formattedTrips.find(t => t.status === 'accepted' || t.status === 'progress');
                
                // Recargar pantallas
                loadActiveTrips();
                if (document.getElementById('trips-screen')?.classList.contains('active')) {
                    loadTrips();
                } else {
                    // Actualizar conteos aunque no estemos en la pantalla
                    updateTripsStats();
                }
            });
        }
    }
}

// Mostrar modal cuando el conductor cancela
let cancelledTripData = null;

function showDriverCancelledModal(trip) {
    cancelledTripData = trip;
    
    const modal = document.getElementById('driver-cancelled-modal');
    const reasonEl = document.getElementById('driver-cancel-reason');
    
    if (reasonEl && trip.cancelReason) {
        reasonEl.textContent = `Razón: ${trip.cancelReason}`;
    } else if (reasonEl) {
        reasonEl.textContent = 'No se proporcionó una razón.';
    }
    
    if (modal) {
        showModal('driver-cancelled-modal');
    } else {
        // Si no hay modal, mostrar notificación
        showToast('El conductor ha cancelado tu viaje. Se buscará otro conductor.', 'warning');
    }
}

// Manejar mantener viaje (buscar otro conductor)
async function handleKeepTripAfterDriverCancel() {
    if (!cancelledTripData) return;
    
    try {
        // Cambiar estado del viaje a 'requested' para que aparezca de nuevo en las solicitudes
        if (cancelledTripData.id && typeof updateTripStatus !== 'undefined') {
            await updateTripStatus(cancelledTripData.id, 'requested', {
                previousDriverId: cancelledTripData.driverId,
                searchNewDriver: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Crear nueva solicitud de viaje
            if (typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
                await db.collection('rideRequests').add({
                    passengerId: auth.currentUser.uid,
                    tripId: cancelledTripData.id,
                    origin: cancelledTripData.origin,
                    destination: cancelledTripData.destination,
                    fare: cancelledTripData.fare || '$0',
                    distance: cancelledTripData.distance || '0',
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            showToast('Buscando otro conductor...', 'info');
        }
        
        closeModal('driver-cancelled-modal');
        cancelledTripData = null;
    } catch (error) {
        console.error('Error manteniendo viaje:', error);
        showToast('Error al buscar otro conductor: ' + error.message, 'error');
    }
}

// Manejar cancelar viaje después de que el conductor canceló
async function handleCancelTripAfterDriverCancel() {
    if (!cancelledTripData) return;
    
    try {
        // El viaje ya está cancelado, solo confirmar
        if (cancelledTripData.id && typeof updateTripStatus !== 'undefined') {
            await updateTripStatus(cancelledTripData.id, 'cancelled', {
                cancelledBy: 'passenger',
                cancelledAfterDriverCancel: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showToast('Viaje cancelado', 'info');
        closeModal('driver-cancelled-modal');
        cancelledTripData = null;
        await loadTrips();
    } catch (error) {
        console.error('Error cancelando viaje:', error);
        showToast('Error al cancelar el viaje: ' + error.message, 'error');
    }
}

// Limpiar listeners al cerrar sesión
function cleanupRealtimeListeners() {
    if (activeRoutesListener) {
        activeRoutesListener();
        activeRoutesListener = null;
    }
    if (passengerTripsListener) {
        passengerTripsListener();
        passengerTripsListener = null;
    }
    if (driverRequestsListener) {
        driverRequestsListener();
        driverRequestsListener = null;
    }
    if (driverTripsListener) {
        driverTripsListener();
        driverTripsListener = null;
    }
    
    // Limpiar notificaciones push
    if (typeof cleanupPushNotifications !== 'undefined') {
        cleanupPushNotifications();
    }
}


