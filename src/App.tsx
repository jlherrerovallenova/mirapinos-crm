import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
// Importaríamos las páginas (que crearemos a continuación)
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Pipeline from './pages/Pipeline';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} /> {/* URL dinámica para cada cliente */}
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}