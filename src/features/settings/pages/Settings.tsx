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
    <div className="flex flex-col animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full gap-6 pb-10">
      
      {/* Header Section (Stitch Redesign) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <SettingsIcon size={36} className="text-[#006c4a]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración del Sistema</h2>
            <p className="text-slate-500 text-xs font-semibold mt-1">Gestiona tu perfil, documentos e integraciones de terceros.</p>
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