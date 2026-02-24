import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Save, 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Settings as SettingsIcon,
  FileCode
} from 'lucide-react';
import AppNotification from '../components/AppNotification';

interface SystemDocument {
  name: string;
  url: string;
  size?: number;
  created_at?: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<SystemDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    company_name: 'Mirapinos CRM',
    email_notifications: true,
    auto_assignment: false,
    default_language: 'es'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('system-documents')
        .list();

      if (error) throw error;

      if (data) {
        const docs = await Promise.all(
          data.map(async (file) => {
            const { data: { publicUrl } } = supabase.storage
              .from('system-documents')
              .getPublicUrl(file.name);
            
            return {
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size,
              created_at: file.created_at
            };
          })
        );
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('system-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setNotification({
        show: true,
        message: 'Documento subido correctamente',
        type: 'success'
      });
      fetchDocuments();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error al subir el documento',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (name: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    try {
      const { error } = await supabase.storage
        .from('system-documents')
        .remove([name]);

      if (error) throw error;

      setNotification({
        show: true,
        message: 'Documento eliminado correctamente',
        type: 'success'
      });
      fetchDocuments();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error al eliminar el documento',
        type: 'error'
      });
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        </div>
        <button
          onClick={() => setNotification({ show: true, message: 'Configuración guardada', type: 'success' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Save size={20} />
          Guardar cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Izquierdo: General */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <SettingsIcon size={18} className="text-gray-500" />
              General
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma por defecto</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.default_language}
                  onChange={(e) => setFormData({...formData, default_language: e.target.value})}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Preferencias</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Notificaciones Email</span>
                <input
                  type="checkbox"
                  checked={formData.email_notifications}
                  onChange={(e) => setFormData({...formData, email_notifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Asignación automática</span>
                <input
                  type="checkbox"
                  checked={formData.auto_assignment}
                  onChange={(e) => setFormData({...formData, auto_assignment: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Documentos del Sistema */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileCode size={20} className="text-blue-600" />
                    Documentos del Sistema
                  </h2>
                  <p className="text-sm text-gray-500">Gestiona las plantillas y archivos públicos</p>
                </div>
                
                <label className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer border border-gray-300 transition-colors">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <Upload size={18} />
                  )}
                  <span>Subir Documento</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>

              {/* Buscador de documentos */}
              <div className="mt-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Lista de Documentos con Scroll */}
            <div className="p-6 bg-gray-50">
              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDocuments.map((doc, index) => (
                      <div 
                        key={index} 
                        className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-2 bg-blue-50 rounded text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <FileText size={20} />
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-gray-800 truncate" title={doc.name}>
                                {doc.name}
                              </p>
                              {doc.size && (
                                <p className="text-xs text-gray-500">
                                  {(doc.size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={doc.url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Descargar"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <FileText className="mx-auto text-gray-300 mb-2" size={40} />
                    <p className="text-gray-500">No se encontraron documentos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification.show && (
        <AppNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
};

export default Settings; 