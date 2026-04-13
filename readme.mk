# QUIBI PROYECT

### ANÁLISIS
Plataforma de contenido en streaming, exclusiva para smartphones, que consiste en la reproducción rápida e instantánea de videos de no más de 10 minutos. No era una aplicación gratuita, sino que requería una suscripción para acceder a sus funciones. Fue lanzada al inicio de la pandemia de COVID-19, lo que debió convertirla en una aplicación interesante para ese momento.

### PROBLEMÁTICAS
* **PAGO DE SUSCRIPCIÓN**: Al ser una aplicación de pago, no ofrecía algo innovador o diferente frente a otras aplicaciones de uso gratuito.
* **CONTENIDO ENFOCADO A CELEBRIDADES**: El contenido no era variado ni ofrecía libertad a los usuarios para ver algo más de lo que el encargado quería mostrar.
* **LIMITACIÓN DE LA APLICACIÓN**: No permitía compartir contenido ni sacar capturas de pantalla, lo que impidió su promoción orgánica.
* **MAL ANÁLISIS DEL MERCADO**: No se tuvieron en cuenta las tendencias ni lo que era importante para los usuarios en ese momento.
* **FALTA DE COMUNICACIÓN**: Posiblemente hubo una mala coordinación entre la empresa y los trabajadores para innovar en la aplicación.

### ESTRATEGIAS
Principalmente se contempló el uso de **Kanban**, una metodología ágil que sirve para organizar, visualizar y mejorar el flujo de trabajo de un proyecto. Mediante un tablero con columnas como "Por hacer", "En proceso", "En revisión" y "Terminado", se logra una mayor transparencia entre los integrantes del equipo.

* **Límites WIP**: Se asignarán límites de trabajo en progreso para evitar la sobrecarga de los desarrolladores.
* **Priorización del Backlog**: Enfoque en funcionalidades esenciales y validación temprana con usuarios reales.
* **Comunicación Continua**: Fomento de una toma de decisiones rápida y constante entre las áreas técnica y de negocio.

## ROLES

| Encargado | ROL |
| :--- | :--- |
| MENDOZA KAUIL CARLOS EDUARDO | Coordinador Kanban |
| REYES DOLORES ALEJANDRO | Product Owner |
| ALEJANDRO SÁNCHEZ | Diseñador UX/UI |
| COHEN ALAIN | Desarrollador Backend |
| MENDOZA KAUIL | Desarrollador Frontend |
| REYES DOLORES ALEJANDRO | Tester / Control de calidad (QA) |
| ROSADO SANTANA ANGEL GAEL | FULL STACK |


## REQUISITOS DE ROL Y RESPONSABILIDADES

### 1. COORDINADOR KANBAN
* **Actividades**: Supervisar el tablero, asegurar el flujo continuo y coordinar la comunicación entre áreas.
* **Responsabilidades**: Liderazgo, organización y conocimientos en metodologías ágiles.

### 2. PRODUCT OWNER
* **Actividades**: Definir prioridades del backlog y asegurar que el producto entregue valor al usuario.
* **Responsabilidades**: Análisis de mercado, enfoque en UX y comunicación constante con el equipo técnico.

### 3. DESARROLLADOR FRONTEND
* **Actividades**: Diseñar e implementar la interfaz de usuario y optimizar la experiencia móvil.
* **Responsabilidades**: Conocimientos en HTML, CSS y JavaScript; atención al detalle y diseño responsivo.

### 4. DESARROLLADOR BACKEND
* **Actividades**: Implementar la lógica del sistema, gestionar bases de datos e integrar APIs.
* **Responsabilidades**: Resolución de problemas técnicos, manejo de servidores y seguridad.

### 5. DISEÑADOR UX/UI
* **Actividades**: Diseñar flujos de navegación sencillos y realizar pruebas de usabilidad.
* **Responsabilidades**: Creatividad, análisis y capacidad para interpretar la retroalimentación del usuario.

### 6. TESTER / CONTROL DE CALIDAD (QA)
* **Actividades**: Detectar errores, reportarlos en el tablero Kanban y verificar nuevas funcionalidades.
* **Responsabilidades**: Atención al detalle, capacidad de análisis y comunicación clara de errores.

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
