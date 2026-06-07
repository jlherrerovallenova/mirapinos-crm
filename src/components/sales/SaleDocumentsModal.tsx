import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Loader2, Trash2, Eye, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type SaleBase = Database['public']['Tables']['sales']['Row'];
type LeadBase = Database['public']['Tables']['leads']['Row'];
type PropertyBase = Database['public']['Tables']['inventory']['Row'];
type SaleDocument = Database['public']['Tables']['sale_documents']['Row'];

type Sale = SaleBase & {
  lead: LeadBase;
  property: PropertyBase;
};

interface SaleDocumentsModalProps {
  sale: Sale;
  onClose: () => void;
}

export default function SaleDocumentsModal({ sale, onClose }: SaleDocumentsModalProps) {
  const [documents, setDocuments] = useState<SaleDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchDocuments(sale.id);
  }, [sale.id]);

  async function fetchDocuments(saleId: string) {
    setLoadingDocs(true);
    const { data } = await (supabase as any)
      .from('sale_documents')
      .select('*')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false });
    
    if (data) setDocuments(data);
    setLoadingDocs(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El tamaño máximo es 10MB.');
      e.target.value = '';
      return;
    }

    setUploadingSlot(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sale.id}/${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('sale-documents')
        .upload(filePath, file);

      if (storageError) {
        if (storageError.message?.includes('Bucket not found') || (storageError as any).status === 400 || (storageError as any).status === 404) {
          throw new Error('El bucket de almacenamiento "sale-documents" no existe en Supabase.');
        }
        throw storageError;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await (supabase as any)
        .from('sale_documents')
        .insert([{
          sale_id: sale.id,
          name: file.name,
          file_path: filePath,
          document_type: type,
          file_size: file.size,
          uploaded_by: user?.id || null
        }]);

      if (dbError) throw dbError;

      await fetchDocuments(sale.id);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert('Error al subir el archivo: ' + (error.message || error));
    } finally {
      e.target.value = '';
      setUploadingSlot(null);
    }
  }

  async function handleDownload(filePath: string, name: string) {
    try {
      const { data, error } = await supabase.storage
        .from('sale-documents')
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.target = '_blank';
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el archivo: ' + (error.message || error));
    }
  }

  async function handlePreview(filePath: string, name: string) {
    setPreviewName(name);
    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.storage
        .from('sale-documents')
        .createSignedUrl(filePath, 600);

      if (error) throw error;
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      } else {
        setPreviewName(null);
      }
    } catch (error: any) {
      console.error('Error generating preview URL:', error);
      alert('Error al abrir la vista previa: ' + (error.message || error));
      setPreviewName(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleDelete(docId: string, filePath: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) return;
    
    setDeletingId(docId);
    try {
      const { error: storageError } = await supabase.storage
        .from('sale-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await (supabase as any)
        .from('sale_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      await fetchDocuments(sale.id);
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el archivo: ' + (error.message || error));
    } finally {
      setDeletingId(null);
    }
  }

  const hasJointBuyer = !!(sale.lead as any)?.joint_buyer_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-emerald-500" size={24} />
              Detalles y Documentos de la Operación
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Cliente: <span className="text-slate-700 font-bold">{sale.lead.name}</span> | {sale.property.modelo === 'PARCELA' ? 'Parcela' : 'Vivienda'}: <span className="text-slate-700 font-bold">{sale.property.numero_vivienda}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingDocs ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                {
                  type: 'dni_comprador',
                  title: 'DNI Compradores (Titular)',
                  description: 'Documento de identidad del titular.',
                },
                ...(hasJointBuyer ? [{
                  type: 'dni_cotitular',
                  title: 'DNI Compradores (Cotitular)',
                  description: 'Documento de identidad del cotitular.',
                }] : []),
                {
                  type: 'banco',
                  title: 'Certificado de Titularidad',
                  description: 'Justificante o certificado bancario.',
                },
                {
                  type: 'reserva',
                  title: 'Copia del Documento de Reserva',
                  description: 'Documento de reserva firmado.',
                },
                {
                  type: 'contrato',
                  title: 'Copia del Contrato de Compraventa',
                  description: '(Cuando corresponda)',
                },
                {
                  type: 'pbc',
                  title: 'Documento PBC',
                  description: 'Prevención de Blanqueo de Capitales.',
                },
              ].map(slot => {
                const doc = documents.find(d => d.document_type === slot.type);
                const isUploading = uploadingSlot === slot.type;
                const isDeleting = doc ? deletingId === doc.id : false;

                return (
                  <div
                    key={slot.type}
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      doc
                        ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200/80 shadow-sm shadow-emerald-50/10'
                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${
                        doc 
                          ? 'bg-emerald-100/60 border-emerald-200/50 text-emerald-700' 
                          : 'bg-white border-slate-100 text-slate-400'
                      }`}>
                        {doc ? <FileText size={18} /> : <Upload size={18} />}
                      </div>
                      
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 truncate">{slot.title}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            doc
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200/60'
                          }`}>
                            {doc ? 'Subido' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {doc ? doc.name : slot.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100/50 pt-3">
                      {doc ? (
                        <>
                          <button
                            onClick={() => handlePreview(doc.file_path, doc.name)}
                            disabled={loadingPreview}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Vista Previa"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.file_path, doc.name)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Descargar"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.file_path)}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            onChange={(e) => handleFileUpload(e, slot.type)}
                            disabled={isUploading}
                          />
                          <button 
                            className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-1.5"
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {isUploading ? 'Subiendo...' : 'Subir Documento'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* OTROS (Multiple) */}
              <div className="col-span-1 lg:col-span-2 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Otros Documentos Adicionales</h3>
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      onChange={(e) => handleFileUpload(e, 'otros')}
                      disabled={uploadingSlot === 'otros'}
                    />
                    <button 
                      className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                      disabled={uploadingSlot === 'otros'}
                    >
                      {uploadingSlot === 'otros' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingSlot === 'otros' ? 'Subiendo...' : 'Subir Otro Documento'}
                    </button>
                  </div>
                </div>

                {documents.filter(d => d.document_type === 'otros').length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-400">No hay documentos adicionales.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.filter(d => d.document_type === 'otros').map(doc => {
                      const isDeleting = deletingId === doc.id;
                      return (
                        <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</p>
                              <p className="text-[10px] text-slate-400">{((doc.file_size || 0) / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString('es-ES')}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-auto pt-2 border-t border-slate-50">
                            <button
                              onClick={() => handlePreview(doc.file_path, doc.name)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownload(doc.file_path, doc.name)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id, doc.file_path)}
                              disabled={isDeleting}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Vista Previa */}
        {previewUrl && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col animate-in fade-in duration-200 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
              <h3 className="text-white font-medium truncate pr-4 text-sm">{previewName}</h3>
              <button 
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName(null);
                }} 
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-black p-4 md:p-8 flex items-center justify-center min-h-0">
              {previewUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-full rounded-xl bg-white" title={previewName || ''} />
              ) : previewUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                <img src={previewUrl} alt={previewName || ''} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
              ) : (
                <div className="text-white/70 text-center flex flex-col items-center gap-3">
                  <FileText size={48} className="opacity-50" />
                  <p className="text-sm font-medium">No hay vista previa disponible para este formato.</p>
                  <button 
                    onClick={() => handleDownload(previewUrl, previewName || 'document')}
                    className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Descargar Archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
