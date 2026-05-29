import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import L from 'leaflet';

// Expose Leaflet globally for plugins like leaflet-routing-machine under ESM environments
// @ts-ignore
window.L = L;

import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
