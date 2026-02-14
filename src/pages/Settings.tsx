// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Shield, 
  FileText, 
  Upload, 
  Trash2, 
  ExternalLink,
  Loader2,
  Save,
  Bell
} from 'lucide-react';
import { AppNotification } from '../components/Shared';

interface Document {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export default function Settings() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // 1. Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from('docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('docs')
        .getPublicUrl(filePath);

      // 3. Registrar en base de datos
      const { error: dbError } = await supabase
        .from('documents')
        .insert([{ name: file.name, url: urlData.publicUrl }]);

      if (dbError) throw dbError;

      showNotif('Éxito', 'Archivo subido correctamente', 'success');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading:', error);
      showNotif('Error', 'No se pudo subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string, url: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      setDocuments(documents.filter(d => d.id !== id));
      showNotif('Eliminado', 'Documento borrado', 'success');
    } catch (error) {
      showNotif('Error', 'No se pudo eliminar', 'error');
    }
  };

  const showNotif = (title: string, message: string, type: 'success' | 'error') => {
    setNotification({ show: true, title, message, type });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header>
        <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Panel de Usuario</p>
        <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Configuración</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Perfil */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Información del Perfil</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Acceso</label>
                <div className="mt-2 flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl text-slate-500 font-medium">
                  <Mail size={18} /> {session?.user?.email}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol de Usuario</label>
                <div className="mt-2 flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl text-slate-500 font-medium italic">
                  <Shield size={18} /> Administrador de Sistema
                </div>
              </div>
            </div>
          </section>

          {/* Gestión de Documentos */}
          <section className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Biblioteca de Archivos</h2>
              </div>
              
              <label className="cursor-pointer px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-sm shadow-lg shadow-slate-200">
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                SUBIR
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg text-slate-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm line-clamp-1">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-500"><ExternalLink size={18}/></a>
                    <button onClick={() => deleteDocument(doc.id, doc.url)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <p className="text-center py-10 text-slate-400 text-sm italic">No hay documentos subidos</p>}
            </div>
          </section>
        </div>

        {/* Sidebar de Ajustes Rápidos */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Bell size={18} className="text-emerald-400" /> Notificaciones</h3>
            <div className="space-y-4">
              <Toggle label="Nuevos Leads" checked={true} />
              <Toggle label="Ventas Cerradas" checked={true} />
              <Toggle label="Alertas Stock" checked={false} />
            </div>
          </div>
        </div>
      </div>

      {notification.show && (
        <AppNotification 
          title={notification.title} 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ ...notification, show: false })} 
        />
      )}
    </div>
  );
}

function Toggle({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`}></div>
      </div>
    </div>
  );
}