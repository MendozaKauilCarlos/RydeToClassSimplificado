# RIDE TO CLASS - Proyecto de Carpooling Universitario

Este proyecto es una aplicación de transporte compartido diseñada para estudiantes universitarios, permitiendo conectar a conductores y pasajeros de la misma institución de manera segura y eficiente.

---

## 📋 Especificación de Requerimientos

Para asegurar el correcto funcionamiento y desarrollo del proyecto, se han definido los siguientes requerimientos técnicos y del sistema. Esto garantiza que cualquier desarrollador o evaluador pueda ejecutar el código sin problemas.

### 1. Requerimientos de Hardware (Entorno de Desarrollo)
*   **Procesador:** Intel Core i3 / AMD Ryzen 3 o superior (Recomendado i5/Ryzen 5 para tiempos de compilación óptimos).
*   **Memoria RAM:** Mínimo 4 GB (Se recomiendan 8 GB o más para ejecutar el servidor de desarrollo y el navegador simultáneamente).
*   **Almacenamiento:** Al menos 2 GB de espacio libre en disco (para dependencias de `node_modules` y caché).
*   **Conexión a Internet:** Requerida para la descarga de paquetes (npm), renderizado de mapas (OpenStreetMap) y conexión con la base de datos (Firebase).

### 2. Requerimientos de Software
*   **Sistema Operativo:** Multiplataforma (Windows 10/11, macOS 10.15+, o distribuciones Linux basadas en Debian/Ubuntu).
*   **Entorno de Ejecución:** [Node.js](https://nodejs.org/) versión 18.x LTS o superior.
*   **Gestor de Paquetes:** `npm` (incluido con Node.js) o `yarn`.
*   **Control de Versiones:** [Git](https://git-scm.com/) instalado y configurado.
*   **Editor de Código (IDE):** Se recomienda encarecidamente **Visual Studio Code** con las siguientes extensiones instaladas:
    *   *ESLint* (para análisis de código).
    *   *Prettier* (para formateo automático).
    *   *Tailwind CSS IntelliSense* (para autocompletado de clases).

### 3. Requerimientos de Servicios Externos (BaaS)
La aplicación depende de servicios en la nube para funcionar correctamente:
*   **Firebase Authentication:** Configurado para permitir inicio de sesión con Google.
*   **Cloud Firestore:** Base de datos NoSQL para almacenar usuarios, rutas y solicitudes en tiempo real.
*   **Leaflet / OpenStreetMap:** Proveedor de mapas de código abierto para la geolocalización y visualización de rutas.

### 4. Requerimientos Funcionales Principales
*   **RF01:** El sistema debe permitir el registro e inicio de sesión de usuarios mediante correo institucional.
*   **RF02:** El sistema debe permitir al usuario elegir entre el rol de "Conductor" o "Pasajero".
*   **RF03:** Un conductor debe poder crear, editar y eliminar rutas especificando origen, destino, horario, asientos y precio.
*   **RF04:** Un pasajero debe poder visualizar las rutas disponibles en un mapa interactivo y enviar solicitudes de viaje.
*   **RF05:** El sistema debe mostrar el historial de viajes (Completados, Cancelados, En Progreso).

### 5. Requerimientos No Funcionales
*   **RNF01 (Usabilidad):** La interfaz debe ser intuitiva, responsiva (Mobile-First) y contar con soporte para Modo Oscuro/Claro.
*   **RNF02 (Rendimiento):** El tiempo de carga inicial de la aplicación (TTV) no debe superar los 3 segundos en conexiones 4G.
*   **RNF03 (Seguridad):** Las contraseñas y tokens de sesión deben ser gestionados de forma segura por Firebase, sin exponerse en el código fuente.

---

## 🚀 Pasos para la Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-de-la-carpeta>
    ```

2.  **Instalar las dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crear un archivo llamado `firebase-applet-config.json` en la raíz del proyecto con las credenciales de Firebase:
    ```json
    {
      "apiKey": "TU_API_KEY",
      "authDomain": "TU_AUTH_DOMAIN",
      "projectId": "TU_PROJECT_ID",
      "storageBucket": "TU_STORAGE_BUCKET",
      "messagingSenderId": "TU_SENDER_ID",
      "appId": "TU_APP_ID"
    }
    ```

4.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

---

## 🛠️ Tecnologías Utilizadas (Stack MERN/Serverless)
*   **React 18** + **Vite** (Frontend ultrarrápido)
*   **TypeScript** (Tipado estático para evitar errores en tiempo de ejecución)
*   **Tailwind CSS** (Sistema de diseño basado en utilidades)
*   **Firebase** (Backend as a Service)
*   **React Router DOM** (Navegación SPA)
*   **Leaflet & React-Leaflet** (Mapas interactivos)
*   **Lucide React** (Iconografía moderna)

---

## 👥 Asignación de Roles (Equipo de Desarrollo)

*   **Líder de Proyecto / Frontend:** [Tu Nombre Aquí]
*   **Backend / Base de Datos:** [Nombre del Compañero]
*   **UX/UI Design:** [Nombre del Compañero]
*   **QA / Testing:** [Nombre del Compañero]

---

> [!NOTE]
> Este proyecto fue migrado desde una base de HTML/JS puro a una arquitectura moderna de React para mejorar la escalabilidad, mantenibilidad y la experiencia de usuario.
