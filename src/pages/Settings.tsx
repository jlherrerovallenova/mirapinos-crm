// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FileText, 
  Trash2, 
  Eye, 
  Edit3, 
  Loader2, 
  Search,
  Download,
  X,
  Settings as SettingsIcon,
  User as UserIcon,
  FolderOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Definición de interfaces para Tipado
interface SystemDocument {
  name: string;
  id: string;
  updated_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

const Settings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  
  // Estados de Navegación y UI
  const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Estados de Documentos
  const [documents, setDocuments] = useState<SystemDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Estados de Formulario de Perfil
  const [fullName, setFullName] = useState(profile?.full_name || '');

  // Cargar documentos cuando se entra en la pestaña
  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  // Sincronizar nombre de perfil cuando cargue el contexto
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // --- Lógica de Perfil ---
  const handleUpdateProfile = async () => {
    if (!profile?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('No se pudo actualizar el perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Lógica de Documentos ---
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase.storage.from('documents').list();
      if (error) throw error;
      setDocuments(data as unknown as SystemDocument[] || []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${fileName}"?`)) return;
    try {
      const { error } = await supabase.storage.from('documents').remove([fileName]);
      if (error) throw error;
      setDocuments(documents.filter(doc => doc.name !== fileName));
    } catch (error) {
      alert('Error al eliminar el archivo');
    }
  };

  const handlePreview = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(fileName, 60);
      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      alert('No se pudo generar la vista previa');
    }
  };

  const handleRename = async (oldName: string) => {
    if (!newName || oldName === newName) {
      setIsEditingName(null);
      return;
    }
    try {
      const { error } = await supabase.storage.from('documents').move(oldName, newName);
      if (error) throw error;
      setIsEditingName(null);
      setNewName('');
      fetchDocuments();
    } catch (error) {
      alert('Error al renombrar el archivo');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="text-emerald-600" size={24} />
        <h1 className="text-xl font-bold text-slate-800">Configuración del Sistema</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navegación Lateral (Sidebar) */}
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
            <span className="font-medium">Documentos</span>
          </button>
        </div>

        {/* Panel de Contenido */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          
          {/* VISTA: PERFIL */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              <div className="border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">Información Personal</h2>
                <p className="text-xs text-slate-500">Actualiza tus datos de contacto y visualización.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Rol Asignado</label>
                  <div className="p-2.5 text-sm bg-slate-50 border rounded-lg text-slate-500 italic">
                    {profile?.role || 'Cargando...'}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {/* VISTA: DOCUMENTOS */}
          {activeTab === 'documents' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              {/* Barra de Herramientas superior */}
              <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Repositorio de Archivos</h2>
                  <p className="text-[11px] text-slate-500">Gestiona los documentos maestros del sistema.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre..."
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Tabla Compacta */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest border-b">
                      <th className="px-6 py-3 font-bold">Documento</th>
                      <th className="px-4 py-3 font-bold hidden sm:table-cell">Tamaño</th>
                      <th className="px-4 py-3 font-bold hidden md:table-cell">Modificado</th>
                      <th className="px-6 py-3 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingDocs ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-emerald-600" size={24} />
                            <span className="text-sm text-slate-400">Consultando Storage...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 text-sm italic">
                          No se encontraron documentos en este repositorio.
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-emerald-50/30 transition-colors group">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <FileText size={18} className="text-emerald-500 shrink-0" />
                              {isEditingName === doc.name ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <input
                                    autoFocus
                                    className="text-sm border-emerald-500 border-2 rounded px-2 py-1 outline-none w-full bg-white shadow-inner"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRename(doc.name);
                                      if (e.key === 'Escape') setIsEditingName(null);
                                    }}
                                  />
                                  <button onClick={() => handleRename(doc.name)} className="text-emerald-600 p-1 hover:bg-emerald-100 rounded"><Save size={16} /></button>
                                  <button onClick={() => setIsEditingName(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded"><X size={16} /></button>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-slate-700 truncate max-w-[250px]">{doc.name}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                            {(doc.metadata.size / 1024).toFixed(1)} KB
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                            {new Date(doc.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handlePreview(doc.name)} 
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-md" 
                                title="Previsualizar"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => { setIsEditingName(doc.name); setNewName(doc.name); }} 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md" 
                                title="Renombrar"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(doc.name)} 
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-md" 
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} />
                <span className="text-sm font-bold text-slate-700">Visor de Documentos</span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Download size={14} /> Abrir en pestaña
                </a>
                <button 
                  onClick={() => setPreviewUrl(null)} 
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none shadow-inner" 
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;