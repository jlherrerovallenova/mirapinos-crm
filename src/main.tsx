import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { DialogProvider } from './context/DialogContext'

// Importamos el test
import { runExhaustiveConnectionTest } from './utils/connectionDiagnostic'

// Configuramos React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Evitar polling oculto o retries infinitos
      refetchOnWindowFocus: false,
    },
  },
})

// El test de diagnóstico manual se invoca con F9 (sin interceptar fetch globalmente)
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)