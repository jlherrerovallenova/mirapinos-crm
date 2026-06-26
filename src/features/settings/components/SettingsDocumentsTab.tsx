import React, { useState } from 'react';
import { Search, Upload, Loader2, FolderLock, FolderOpen, FileText, Save, X, Eye, Edit3, Trash2, Download } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useDialog } from '../../../context/DialogContext';
import { useDocuments, DOCUMENT_CATEGORIES } from '../../../hooks/useDocuments';
import type { SystemDocument } from '../../../hooks/useDocuments';
import { useQueryClient } from '@tanstack/react-query';

const SettingsDocumentsTab: React.FC = () => {
  const { showConfirm, showAlert } = useDialog();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading: loadingDocs } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingDoc, setIsEditingDoc] = useState<{ fullPath: string; category: string } | null>(null);
  const [newName, setNewName] = useState('');

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
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

  const searchedDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-4 border-b bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Repositorio de Archivos</h2>
          <p className="text-[11px] text-slate-500">Documentos que se podrán adjuntar en Emails y WhatsApps a los clientes.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
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
    </div>
  );
};

export default SettingsDocumentsTab;
