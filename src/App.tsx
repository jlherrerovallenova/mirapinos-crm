// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import LeadDetail from './pages/LeadDetail';
import Agenda from './pages/Agenda'; // <--- Importación de la nueva página
import Login from './pages/Login'; 

function App() {
  return (
    <Routes>
      {/* 1. Ruta Pública: Login (sin Sidebar ni Header) */}
      <Route path="/login" element={<Login />} />

      {/* 2. Rutas Protegidas: Todas las que llevan MainLayout */}
      {/* MainLayout verificará si hay sesión. Si no, redirige a /login */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/agenda" element={<Agenda />} /> {/* <--- Nueva Ruta registrada */}
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 3. Ruta por defecto: Cualquier URL desconocida lleva al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;