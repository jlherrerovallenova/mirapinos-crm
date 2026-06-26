// src/pages/Settings.tsx
import React, { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import SettingsSidebar from '../components/SettingsSidebar';
import type { SettingsTab } from '../components/SettingsSidebar';
import SettingsProfileTab from '../components/SettingsProfileTab';
import SettingsIntegrationsTab from '../components/SettingsIntegrationsTab';
import SettingsHousingTab from '../components/SettingsHousingTab';
import SettingsDocumentsTab from '../components/SettingsDocumentsTab';
import SettingsDataTab from '../components/SettingsDataTab';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Configuración del Sistema</h1>
            <p className="text-slate-500 text-xs font-medium">Gestiona tu perfil, documentos e integraciones de terceros.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          {activeTab === 'profile' && <SettingsProfileTab />}
          {activeTab === 'integrations' && <SettingsIntegrationsTab />}
          {activeTab === 'housing' && <SettingsHousingTab />}
          {activeTab === 'documents' && <SettingsDocumentsTab />}
          {activeTab === 'data' && <SettingsDataTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;