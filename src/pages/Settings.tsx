// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import CreatePropertyModal from '../components/inventory/CreatePropertyModal';
import {
  Save,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  Loader2,
  Search,
  Download,
  X,
  Settings as SettingsIcon,
  User as UserIcon,
  FolderOpen,
  Upload,
  FolderLock,
  KeyRound,
  CheckCircle2,
  Mail,
  Map,
  Plus,
  Copy,
  Home,
  Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { useDocuments, DOCUMENT_CATEGORIES } from '../hooks/useDocuments';
import type { SystemDocument } from '../hooks/useDocuments';
import { useQueryClient } from '@tanstack/react-query';
import ExportLeadsModal from '../components/leads/ExportLeadsModal';
import ImportLeadsModal from '../components/leads/ImportLeadsModal';

const Settings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { showConfirm, showAlert } = useDialog();
  const queryClient = useQueryClient();

  // Estados de Navegación y UI
  const [activeTab, setActiveTab] = useState<'profile' | 'housing' | 'documents' | 'integrations' | 'data'>('profile');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Estados de Integraciones
  const [resendApiKey, setResendApiKey] = useState('');
  const [unlayerProjectId, setUnlayerProjectId] = useState('');
  const [isSavingResend, setIsSavingResend] = useState(false);
  const [isSavingUnlayer, setIsSavingUnlayer] = useState(false);
  const [showResendApiKey, setShowResendApiKey] = useState(false);

  // Estados de Documentos
  const { data: documents = [], isLoading: loadingDocs } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Categoría seleccionada por defecto para subir
  const [uploadCategory, setUploadCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);

  // Renombrado
  const [isEditingDoc, setIsEditingDoc] = useState<{ fullPath: string; category: string } | null>(null);
  const [newName, setNewName] = useState('');

  // Estados de Formulario de Perfil
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    if (profile?.phone !== undefined) {
      setProfilePhone(profile.phone || '');
    }
    fetchIntegrations();
    fetchProperties();
  }, [profile]);

  // --- Lógica de Clientes (Admin) ---
  const [settingsLeads, setSettingsLeads] = useState<any[]>([]);
  const [loadingSettingsLeads, setLoadingSettingsLeads] = useState(false);
  const [searchClientQuery, setSearchClientQuery] = useState('');

  const fetchSettingsLeads = async () => {
    try {
      setLoadingSettingsLeads(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSettingsLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingSettingsLeads(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const leadToDelete = settingsLeads.find(l => l.id === leadId);
    if (leadToDelete && leadToDelete.sale_status) {
      showAlert({ 
        title: 'Operación denegada', 
        message: 'No puedes borrar este cliente porque tiene una operación de compra en curso o finalizada.' 
      });
      return;
    }

    const password = window.prompt("Por seguridad, introduce la contraseña de administrador para borrar este cliente:");
    if (password !== "mirapinos2026") {
      if (password !== null) {
        showAlert({ title: 'Error', message: 'Contraseña incorrecta. Operación cancelada.' });
      }
      return;
    }

    const confirmed = await showConfirm({
      title: 'Eliminar Cliente',
      message: '¿Estás seguro de que deseas eliminar este cliente y TODA su agenda asociada? Esta acción es irreversible.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    try {
      // Borrar tareas asociadas primero
      await supabase.from('agenda').delete().eq('lead_id', leadId);
      
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
      
      showAlert({ title: 'Éxito', message: 'Cliente eliminado correctamente.' });
      fetchSettingsLeads();
    } catch (err: any) {
      console.error('Error eliminando lead:', err);
      showAlert({ title: 'Error', message: 'No se pudo eliminar el cliente: ' + (err.message || 'Error desconocido') });
    }
  };

  useEffect(() => {
    if (activeTab === 'data') {
      fetchSettingsLeads();
    }
  }, [activeTab]);

  // --- Lógica de Viviendas (Admin) ---
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('numero_vivienda', { ascending: true });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleDeleteProperty = async (property: any) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Vivienda',
      message: `¿Estás seguro de que deseas eliminar la vivienda ${property.numero_vivienda}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', property.id);

      if (error) throw error;
      setProperties(prev => prev.filter(p => p.id !== property.id));
      await showAlert({ title: 'Éxito', message: 'Vivienda eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting property:', error);
      await showAlert({ title: 'Error', message: 'No se pudo eliminar la vivienda' });
    }
  };

  const handleCloneProperty = (property: any) => {
    const { id, created_at, ...cloneData } = property;
    setEditingProperty(cloneData);
    setIsPropertyModalOpen(true);
  };

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['resend_api_key', 'unlayer_project_id']);

      if (error) throw error;
      if (data) {
        const resend = data.find((s: any) => s.key === 'resend_api_key') as any;
        const unlayer = data.find((s: any) => s.key === 'unlayer_project_id') as any;
        if (resend) setResendApiKey(resend.value || '');
        if (unlayer) setUnlayerProjectId(unlayer.value || '');
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        // @ts-expect-error
        .update({ full_name: fullName, phone: profilePhone || null })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      await showAlert({ title: 'Éxito', message: 'Perfil actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      await showAlert({ title: 'Error', message: 'No se pudo actualizar el perfil' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Lógica de Integraciones ---
  const handleSaveIntegration = async (key: string, value: string, setLoading: (l: boolean) => void) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) throw error;
      await showAlert({ title: 'Éxito', message: 'Configuración guardada correctamente' });
    } catch (err) {
      console.error(`Error saving ${key}:`, err);
      await showAlert({ title: 'Error', message: `No se pudo guardar la integración` });
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (doc: SystemDocument, newCategory: string) => {
    if (doc.category === newCategory) return;

    const newFullPath = newCategory === 'Sin Categorizar' ? doc.name : `${newCategory}/${doc.name}`;

    try {
      const { error } = await supabase.storage.from('documents').move(doc.fullPath, newFullPath);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['system_documents'] });
    } catch (error) {
      console.error('Error moviendo documento:', error);
      await showAlert({ title: 'Error', message: 'El archivo ya existe en el destino o hubo un error de red.' });
    }
  };

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize('NFD')                     // Descompone caracteres con acento (ej: Ó -> O + ´)
      .replace(/[\u0300-\u036f]/g, '')       // Elimina los acentos
      .replace(/[^a-zA-Z0-9.-]/g, '_');      // Reemplaza espacios y caracteres especiales por guiones bajos
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const duplicateFiles: string[] = [];
      const errorFiles: { name: string; error: string }[] = [];

      const uploadPromises = Array.from(files).map(async (file) => {
        const cleanName = sanitizeFileName(file.name);
        const fullPath = `${uploadCategory}/${cleanName}`;
        
        // Usamos upsert: true para permitir sobrescribir si el usuario lo desea
        const { error } = await supabase.storage.from('documents').upload(fullPath, file, {
          upsert: true
        });

        if (error) {
          // @ts-ignore
          if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
            duplicateFiles.push(file.name);
          } else {
            console.error(`Error al subir ${file.name} como ${cleanName}:`, error);
            errorFiles.push({ name: file.name, error: error.message });
          }
        }
      });

      await Promise.all(uploadPromises);

      if (errorFiles.length > 0) {
        const errorList = errorFiles.map(f => `- ${f.name}: ${f.error}`).join('\n');
        await showAlert({
          title: 'Error en la Subida',
          message: `Hubo problemas con algunos archivos:\n\n${errorList}\n\nRevisa si existe el bucket "documents" en Supabase.`
        });
      } else if (duplicateFiles.length > 0) {
        await showAlert({
          title: 'Archivos Omitidos',
          message: `Los siguientes archivos ya existían y se omitieron:\n\n${duplicateFiles.join(', ')}`
        });
      } else {
        await showAlert({ title: 'Éxito', message: 'Archivos subidos correctamente' });
      }

      queryClient.invalidateQueries({ queryKey: ['system_documents'] });
    } catch (error: any) {
      console.error('Error general de subida:', error);
      await showAlert({ title: 'Error Crítico', message: 'Error de red o configuración: ' + (error.message || 'Desconocido') });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (doc: SystemDocument) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Archivo',
      message: `¿Estás seguro de que deseas eliminar "${doc.name}" de la categoría "${doc.category}"? Esta acción será para todos los usuarios.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.storage.from('documents').remove([doc.fullPath]);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['system_documents'] });
    } catch (error) {
      console.error('Error al borrar documento:', error);
      await showAlert({ title: 'Error', message: 'El archivo está bloqueado o hubo un error de red.' });
    }
  };

  const handlePreview = async (fullPath: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(fullPath, 60);
      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (ignore) {
      await showAlert({ title: 'Error', message: 'No se pudo generar la vista temporizada del archivo.' });
    }
  };

  const handleRename = async (oldDoc: { fullPath: string; category: string; name: string }) => {
    if (!newName || oldDoc.name === newName) {
      setIsEditingDoc(null);
      return;
    }

    try {
      const newFullPath = `${oldDoc.category}/${newName}`;
      const { error } = await supabase.storage.from('documents').move(oldDoc.fullPath, newFullPath);
      if (error) throw error;

      setIsEditingDoc(null);
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['system_documents'] });
    } catch (error) {
      console.error('Error renombrando documento:', error);
      await showAlert({ title: 'Error', message: 'Error renombrando el archivo o extensión inválida.' });
    }
  };

  // Filtrado de la lista por término de búsqueda antes de agruparlos
  const searchedDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Navegación Lateral (Sidebar) */}
        <div className="w-full md:w-56 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
              }`}
          >
            <UserIcon size={16} />
            <span className="font-medium">Mi Perfil</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'documents'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
              }`}
          >
            <FolderOpen size={16} />
            <span className="font-medium">Documentos Venta</span>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'integrations'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
              }`}
          >
            <SettingsIcon size={16} />
            <span className="font-medium">Integraciones</span>
          </button>
          
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'data'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
              }`}
          >
            <Database size={16} />
            <span className="font-medium">Clientes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('housing')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'housing'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
              }`}
          >
            <Map size={16} />
            <span className="font-medium">Viviendas</span>
          </button>
        </div>

        {/* Panel de Contenido */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">

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
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Ej: +34 600 123 456"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Email (Cuenta)</label>
                  <div className="p-2.5 text-sm bg-slate-50 border rounded-lg text-slate-400 italic truncate">
                    {profile?.email || 'Sin email registrado'}
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

          {/* VISTA: INTEGRACIONES */}
          {activeTab === 'integrations' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              <div className="border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">Integraciones de Terceros</h2>
                <p className="text-xs text-slate-500">Configura las claves API para los servicios externos que utiliza el CRM.</p>
              </div>

              <div className="space-y-6 max-w-2xl">
                {/* Unlayer Project ID */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        Unlayer Project ID
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Necesario para el editor visual de Newsletters.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={unlayerProjectId}
                      onChange={(e) => setUnlayerProjectId(e.target.value)}
                      className="flex-1 p-2.5 text-sm border bg-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                      placeholder="Ej. 285017"
                    />
                    <button
                      onClick={() => handleSaveIntegration('unlayer_project_id', unlayerProjectId, setIsSavingUnlayer)}
                      disabled={isSavingUnlayer}
                      className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isSavingUnlayer ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
                    </button>
                  </div>
                </div>

                {/* Resend API Key */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <Mail size={17} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Resend API Key</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Necesaria para el envío de emails transaccionales desde el CRM.</p>
                      </div>
                    </div>
                    {resendApiKey && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                        <CheckCircle2 size={12} /> Configurada
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave API (Backend)</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                          type={showResendApiKey ? 'text' : 'password'}
                          value={resendApiKey}
                          onChange={(e) => setResendApiKey(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 bg-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-slate-700"
                          placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResendApiKey(!showResendApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          title={showResendApiKey ? 'Ocultar' : 'Mostrar'}
                        >
                          {showResendApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <button
                        onClick={() => handleSaveIntegration('resend_api_key', resendApiKey, setIsSavingResend)}
                        disabled={isSavingResend || !resendApiKey.trim()}
                        className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSavingResend ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
                        {isSavingResend ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1">
                      Esta clave se almacena de forma segura en la base de datos para que las funciones del servidor puedan enviar correos.
                      Obtenla en{' '}
                      <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-medium">resend.com/api-keys</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: VIVIENDAS (ADMIN) */}
          {activeTab === 'housing' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Gestión de Inventario</h2>
                  <p className="text-xs text-slate-500">Administra las propiedades, clona registros para nuevos modelos o elimina activos.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setIsPropertyModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Plus size={16} /> Añadir Nueva
                </button>
              </div>

              <div className="flex-1 overflow-auto p-0">
                {loadingProperties ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                    <span className="text-sm font-medium text-slate-400">Cargando viviendas...</span>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center opacity-60">
                    <Home size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold">No hay viviendas en el catálogo</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viv.</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelo</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones de Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {properties.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-black text-slate-700">#{p.numero_vivienda}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.modelo}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.precio)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleCloneProperty(p)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Clonar para nuevo registro"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProperty(p);
                                  setIsPropertyModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar datos"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(p)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Eliminar definitivamente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Modal de Vivienda (Solo si existe CreatePropertyModal como componente exportado) */}
              {isPropertyModalOpen && (
                <CreatePropertyModal
                  isOpen={isPropertyModalOpen}
                  onClose={() => {
                    setIsPropertyModalOpen(false);
                    setEditingProperty(null);
                  }}
                  onSuccess={() => {
                    fetchProperties();
                    setIsPropertyModalOpen(false);
                  }}
                  initialData={editingProperty}
                />
              )}
            </div>
          )}

          {/* VISTA: DOCUMENTOS CLASIFICADOS */}
          {activeTab === 'documents' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              {/* Barra de Herramientas superior */}
              <div className="p-4 border-b bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Repositorio de Archivos</h2>
                  <p className="text-[11px] text-slate-500">Documentos que se podrán adjuntar en Emails y WhatsApps a los clientes.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                  {/* Buscador */}
                  <div className="relative w-full sm:w-56 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Selector de Categoría para Subida */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 bg-white border pr-1 rounded-lg">
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="opacity-90 outline-none text-sm font-medium bg-transparent border-none py-2 px-3 text-slate-700 w-full sm:w-auto cursor-pointer"
                    >
                      {DOCUMENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <label className={`flex items-center justify-center gap-1.5 px-3 py-1.5 my-1 ml-1 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'}`}>
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>Subir</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Listado de Documentos Agrupados por Categoría */}
              <div className="overflow-x-auto flex-1">
                {loadingDocs ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                    <span className="text-sm font-medium text-slate-400 animate-pulse">Explorando carpetas de Supabase...</span>
                  </div>
                ) : searchedDocs.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center opacity-60">
                    <FolderLock size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">Sin Documentos</p>
                    <p className="text-slate-400 text-sm mt-1">No hay archivos coincidentes en el servidor central o en tu búsqueda.</p>
                  </div>
                ) : (
                  <div className="pb-10">
                    {['Sin Categorizar', ...DOCUMENT_CATEGORIES].map(categoryName => {
                      const categoryDocs = searchedDocs.filter(d => d.category === categoryName);
                      if (categoryDocs.length === 0) return null;

                      return (
                        <div key={categoryName} className="mb-6">
                          <div className="bg-slate-100/80 px-4 py-2 flex items-center gap-2 border-y border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
                            <FolderOpen size={16} className={categoryName === 'Sin Categorizar' ? 'text-amber-600' : 'text-emerald-700'} />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{categoryName}</h3>
                            <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold ml-auto">
                              {categoryDocs.length} archivo{categoryDocs.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <table className="w-full text-left border-collapse table-fixed">
                            <tbody className="divide-y divide-slate-50">
                              {categoryDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-emerald-50/20 transition-colors group">
                                  <td className="px-6 py-3 w-1/2">
                                    <div className="flex items-center gap-3">
                                      <FileText size={18} className="text-slate-400 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                      {isEditingDoc?.fullPath === doc.fullPath ? (
                                        <div className="flex items-center gap-1 flex-1">
                                          <input
                                            autoFocus
                                            className="text-sm font-medium border-emerald-500 border-2 rounded px-2 py-1 outline-none w-full bg-white shadow-inner"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleRename({ fullPath: doc.fullPath, category: doc.category, name: doc.name });
                                              if (e.key === 'Escape') setIsEditingDoc(null);
                                            }}
                                          />
                                          <button onClick={() => handleRename({ fullPath: doc.fullPath, category: doc.category, name: doc.name })} className="text-emerald-600 p-1 hover:bg-emerald-100 rounded shrink-0"><Save size={16} /></button>
                                          <button onClick={() => setIsEditingDoc(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded shrink-0"><X size={16} /></button>
                                        </div>
                                      ) : (
                                        <span className="text-sm font-medium text-slate-700 truncate block" title={doc.name}>{doc.name}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-medium text-slate-400 w-24 hidden sm:table-cell">
                                    {doc.metadata?.size ? (doc.metadata.size / 1024).toFixed(1) : 'N/A'} KB
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-400 w-32 hidden md:table-cell">
                                    {new Date(doc.updated_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      {/* Selector de reubicación */}
                                      <select
                                        value={doc.category}
                                        onChange={(e) => handleMove(doc, e.target.value)}
                                        className="text-xs bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600 outline-none hover:border-emerald-400 hover:text-emerald-700 cursor-pointer mr-2 max-w-[120px] truncate"
                                        title="Mover a otra categoría"
                                      >
                                        <option value="Sin Categorizar">Mover a...</option>
                                        {DOCUMENT_CATEGORIES.map(c => (
                                          <option key={c} value={c}>{c}</option>
                                        ))}
                                      </select>

                                      <button
                                        onClick={() => handlePreview(doc.fullPath)}
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-md"
                                        title="Previsualizar"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button
                                        onClick={() => { setIsEditingDoc({ fullPath: doc.fullPath, category: doc.category }); setNewName(doc.name); }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md"
                                        title="Renombrar Archivo"
                                      >
                                        <Edit3 size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(doc)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-md"
                                        title="Borrar Archivo"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA: CLIENTES (IMPORTAR / EXPORTAR / BORRAR) */}
          {activeTab === 'data' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              <div className="border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">Clientes</h2>
                <p className="text-xs text-slate-500">Herramientas administrativas para la importación y exportación masiva de contactos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* Importar */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 transition-all flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Upload size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">Importar Clientes</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Carga masiva de contactos a través de archivos Excel o CSV. Mapea columnas para importar nombres, emails, teléfonos y orígenes de forma automatizada.
                    </p>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      <Upload size={16} />
                      Importar CSV
                    </button>
                  </div>
                </div>

                {/* Exportar */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Download size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">Exportar Clientes</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Descarga un respaldo completo o parcial de todos tus contactos registrados en formato CSV, listo para usar en otras herramientas o mantener un backup local.
                    </p>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      <Download size={16} />
                      Exportar Listado
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Clientes para Borrar */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-800 whitespace-nowrap">Gestión de Clientes</h3>
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Buscar cliente para eliminar..." 
                      value={searchClientQuery}
                      onChange={(e) => setSearchClientQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-400 font-bold uppercase tracking-widest border-b border-slate-200">
                        <th className="py-3 px-6">Nombre</th>
                        <th className="py-3 px-6">Email</th>
                        <th className="py-3 px-6">Teléfono</th>
                        <th className="py-3 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingSettingsLeads ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            Cargando clientes...
                          </td>
                        </tr>
                      ) : searchClientQuery.trim().length < 2 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            Escribe al menos 2 letras en el buscador para encontrar un cliente.
                          </td>
                        </tr>
                      ) : (() => {
                        const filtered = settingsLeads.filter(lead => 
                          (lead.name?.toLowerCase().includes(searchClientQuery.toLowerCase())) ||
                          (lead.email?.toLowerCase().includes(searchClientQuery.toLowerCase())) ||
                          (lead.phone?.includes(searchClientQuery))
                        );
                        
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400">
                                No se encontraron clientes con "{searchClientQuery}".
                              </td>
                            </tr>
                          );
                        }
                        
                        return filtered.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-6 text-sm font-medium text-slate-800">{lead.name || '-'}</td>
                            <td className="py-3 px-6 text-sm text-slate-500">{lead.email || '-'}</td>
                            <td className="py-3 px-6 text-sm text-slate-500">{lead.phone || '-'}</td>
                            <td className="py-3 px-6 text-right">
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
                                title="Eliminar Cliente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
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
                <span className="text-sm font-bold text-slate-700">Visor de Documentación</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Download size={14} /> Abrir Externa
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

      {/* MODALES DE IMPORTACIÓN Y EXPORTACIÓN */}
      <ExportLeadsModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          showAlert({ title: 'Éxito', message: 'Los clientes han sido importados correctamente.' });
        }}
      />
    </div>
  );
};

export default Settings;