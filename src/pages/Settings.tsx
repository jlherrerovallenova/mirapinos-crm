// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Save, 
  Loader2, 
  Camera,
  Bell,
  Palette,
  Upload,
  Trash2,
  FileText
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
}

interface AppDocument {
  name: string;
  url: string;
}

export default function Settings() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: '',
    email: '',
    full_name: '',
    avatar_url: '',
    role: 'agent'
  });

  // Estados para la gestión de documentos
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile();
      fetchDocuments();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) {
        console.warn('No se encontró perfil, usando datos de sesión.');
        setProfile(prev => ({ ...prev, id: session!.user.id, email: session!.user.email || '' }));
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const { data, error } = await supabase.storage.from('documents').list();
      
      if (error) throw error;

      if (data) {
        const validFiles = data.filter(file => file.name !== '.emptyFolderPlaceholder');
        
        const docsWithUrls = validFiles.map(file => {
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(file.name);
          return { name: file.name, url: publicUrl };
        });
        
        setDocuments(docsWithUrls);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert('Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Hubo un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      // 1. Limpiamos el nombre del archivo de tildes, eñes y caracteres especiales
      const cleanFileName = file.name
        .normalize("NFD") // Separa las letras de sus acentos
        .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
        .replace(/[^a-zA-Z0-9.-]/g, "_"); // Reemplaza espacios y símbolos por guiones bajos

      // 2. Subimos usando el nombre limpio
      const { error } = await supabase.storage
        .from('documents')
        .upload(cleanFileName, file, { 
          upsert: true 
        });

      if (error) throw error;
      
      fetchDocuments();
    } catch (error) {
      console.error('Error subiendo documento:', error);
      alert('Error al subir el documento. Revisa la consola para más detalles.');
    } finally {
      setUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteDocument = async (fileName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el documento "${fileName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.storage.from('documents').remove([fileName]);
      if (error) throw error;
      
      setDocuments(prev => prev.filter(doc => doc.name !== fileName));
    } catch (error) {
      console.error('Error eliminando documento:', error);
      alert('Error al eliminar el documento.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-medium animate-pulse">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-slate-500 mt-1">Gestiona tu cuenta, preferencias y ajustes del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-emerald-700 font-bold rounded-xl border border-emerald-100 shadow-sm transition-all text-sm">
            <User size={18} /> Perfil del Agente
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-medium hover:bg-white hover:text-slate-900 rounded-xl transition-all text-sm">
            <Bell size={18} /> Notificaciones
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-medium hover:bg-white hover:text-slate-900 rounded-xl transition-all text-sm">
            <Palette size={18} /> Apariencia
          </button>
          
          <div className="pt-8 mt-8 border-t border-slate-200">
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all text-sm"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Información Personal</h2>
              <p className="text-sm text-slate-500 mt-1">Actualiza tu foto y nombre para que los clientes te reconozcan.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="p-8 space-y-8">
              
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-slate-300" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL del Avatar</label>
                  <input
                    type="url"
                    value={profile.avatar_url || ''}
                    onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                    placeholder="https://ejemplo.com/mifoto.jpg"
                    className="w-full mt-2 px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      disabled
                      value={profile.email || ''}
                      className="w-full pl-12 pr-5 py-4 bg-slate-100 border-none rounded-2xl text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 ml-1">El email no se puede cambiar aquí.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol en el Sistema</label>
                  <div className="relative mt-2">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <input
                      type="text"
                      disabled
                      value={profile.role?.toUpperCase() || 'AGENTE'}
                      className="w-full pl-12 pr-5 py-4 bg-emerald-50 border-none rounded-2xl text-emerald-700 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Documentos del Sistema</h2>
                <p className="text-sm text-slate-500 mt-1">Archivos disponibles para adjuntar y enviar a los clientes.</p>
              </div>
              
              <div>
                <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${uploadingDoc ? 'opacity-70 pointer-events-none' : ''}`}>
                  {uploadingDoc ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {uploadingDoc ? 'Subiendo...' : 'Subir Documento'}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    disabled={uploadingDoc}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
                  />
                </label>
              </div>
            </div>

            <div className="p-8">
              {loadingDocs ? (
                <div className="flex justify-center items-center py-8 text-slate-400">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm">
                  <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                  No hay documentos almacenados en el sistema.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all bg-slate-50/50 group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-blue-600" />
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-sm font-bold text-slate-700 hover:text-blue-600 truncate transition-colors"
                        >
                          {doc.name}
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.name)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Eliminar documento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}