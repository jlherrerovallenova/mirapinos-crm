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
import { supabase } from '../lib/supabase'; //
import { useAuth } from '../context/AuthContext'; //

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
  const { profile } = useAuth(); //
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'documents'>('profile');
  const [documents, setDocuments] = useState<SystemDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Cargar documentos al cambiar a la pestaña de documentos
  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      // Listamos los archivos del bucket 'documents'
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
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

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
      // En Supabase Storage, renombrar se hace moviendo el archivo
      const { error } = await supabase.storage.from('documents').move(oldName, newName);
      if (error) throw error;
      
      setNewName('');
      setIsEditingName(null);
      fetchDocuments();
    } catch (error) {
      alert('Error al renombrar el archivo: Verifique que el nombre no contenga caracteres especiales.');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-emerald-600" size={28} />
        <h1 className="text-2xl font-bold text-slate-800">Panel de Configuración</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar de Navegación */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <UserIcon size={20} />
            <span className="font-medium">Perfil de Usuario</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'documents' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <FolderOpen size={20} />
            <span className="font-medium">Documentos del Sistema</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold text-slate-800 border-b pb-4">Ajustes de Cuenta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nombre Completo</label>
                  <input 
                    type="text" 
                    defaultValue={profile?.full_name || ''} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Rol de Acceso</label>
                  <input 
                    type="text" 
                    value={profile?.role || ''} 
                    disabled 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 italic" 
                  />
                </div>
              </div>
              <div className="pt-4">
                <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 shadow-sm transition-all active:scale-95">
                  <Save size={18} /> Actualizar Información
                </button>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <h2 className="text-xl font-semibold text-slate-800">Repositorio de Documentos</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="animate-spin text-emerald-600 mb-3" size={40} />
                  <p className="text-slate-500 font-medium">Sincronizando con el servidor...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredDocs.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl">
                      <FileText className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-400">No se han encontrado archivos en este bucket.</p>
                    </div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <div key={doc.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group bg-white">
                        <div className="flex items-center gap-4 flex-1 w-full">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditingName === doc.name ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  className="border-2 border-emerald-500 rounded-lg px-3 py-1 text-sm flex-1 outline-none"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename(doc.name);
                                    if (e.key === 'Escape') setIsEditingName(null);
                                  }}
                                />
                                <button onClick={() => handleRename(doc.name)} className="bg-emerald-600 text-white p-1 rounded-md hover:bg-emerald-700">
                                  <Save size={16} />
                                </button>
                                <button onClick={() => setIsEditingName(null)} className="bg-slate-200 text-slate-600 p-1 rounded-md hover:bg-slate-300">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-700 truncate">{doc.name}</p>
                                <p className="text-xs text-slate-400 flex gap-2">
                                  <span>{(doc.metadata.size / 1024).toFixed(1)} KB</span>
                                  <span>•</span>
                                  <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePreview(doc.name)}
                            className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Vista previa"
                          >
                            <Eye size={20} />
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditingName(doc.name);
                              setNewName(doc.name);
                            }}
                            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Renombrar"
                          >
                            <Edit3 size={20} />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.name)}
                            className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Vista Previa con Overlay */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="bg-white rounded-3xl w-full h-full max-w-6xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Eye size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Visualizador de Documentos</h3>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href={previewUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <Download size={18} /> Descargar Original
                </a>
                <button 
                  onClick={() => setPreviewUrl(null)} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-50 relative">
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none" 
                title="Vista previa del documento" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;