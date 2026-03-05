// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { DialogProvider } from './context/DialogContext'

// Importamos el test
import { runExhaustiveConnectionTest } from './utils/connectionDiagnostic'

// Lanzamos el test al pulsar la tecla F9
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F9') {
      console.log('🚀 Lanzando test de diagnóstico (F9 detectado)...');
      runExhaustiveConnectionTest();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)