import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Reemplaza esto con tu configuración real de Firebase
// (Puedes encontrarla en la consola de Firebase -> Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyC93Nvi2PmWjuH2iZlfse5hZpIBraGLkhc",
  authDomain: "rydetoclass.firebaseapp.com",
  projectId: "rydetoclass",
  storageBucket: "rydetoclass.firebasestorage.app",
  messagingSenderId: "348922513160",
  appId: "1:348922513160:web:36f1900093a25bfaf74ebd",
  measurementId: "G-XLWR9DRYLP"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
