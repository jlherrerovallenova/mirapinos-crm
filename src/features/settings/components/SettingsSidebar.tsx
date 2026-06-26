import React from 'react';
import {
  User as UserIcon,
  FolderOpen,
  Settings as SettingsIcon,
  Database,
  Map
} from 'lucide-react';

export type SettingsTab = 'profile' | 'housing' | 'documents' | 'integrations' | 'data';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-full md:w-56 flex flex-col gap-1">
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
          activeTab === 'profile'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <UserIcon size={16} />
        <span className="font-medium">Mi Perfil</span>
      </button>
      <button
        onClick={() => setActiveTab('documents')}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
          activeTab === 'documents'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <FolderOpen size={16} />
        <span className="font-medium">Documentos Venta</span>
      </button>
      <button
        onClick={() => setActiveTab('integrations')}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
          activeTab === 'integrations'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <SettingsIcon size={16} />
        <span className="font-medium">Integraciones</span>
      </button>

      <button
        onClick={() => setActiveTab('data')}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
          activeTab === 'data'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Database size={16} />
        <span className="font-medium">Clientes</span>
      </button>

      <button
        onClick={() => setActiveTab('housing')}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
          activeTab === 'housing'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Map size={16} />
        <span className="font-medium">Viviendas</span>
      </button>
    </div>
  );
};

export default SettingsSidebar;
