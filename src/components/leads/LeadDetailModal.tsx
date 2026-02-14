import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Globe, Trash2, Save, FileText, Loader2, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StageBadge } from '../Shared';
import type { Database } from '../../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

interface Props {
  lead: Lead;
  isOpen: boolean; // Aseguramos que se use la prop isOpen si se requiere
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: (id: string) => void;
  // availableDocs ahora tiene un valor por defecto para evitar errores de .length
  availableDocs?: { name: string; url: string }[]; 
  onOpenEmail?: (docs: string[]) => void;
}

export default function LeadDetailModal({ 
  lead, 
  onClose, 
  onUpdate, 
  onDelete,
  availableDocs = [], // Valor por defecto para evitar el error de 'undefined'
  onOpenEmail 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead>(lead);

  // Sincronizar el estado interno si el lead cambia
  useEffect(() => {
    setEditedLead(lead);
  }, [lead]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editedLead.name,
          email: editedLead.email,
          phone: editedLead.phone,
          status: editedLead.status,
          source: editedLead.source
        })
        .eq('id', lead.id);

      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("No se pudo actualizar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {isEditing ? 'Editar Contacto' : lead.name}
              </h2>
              {!isEditing && <StageBadge stage={lead.status || 'new'} />}
            </div>
            <p className="text-slate-400 text-sm font-medium">ID de Cliente: {lead.id.substring(0, 8)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* SECCIÓN INFORMACIÓN BÁSICA */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Información de contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                {isEditing ? (
                  <input 
                    className="w-full bg-transparent font-bold text-slate-700 outline-none"
                    value={editedLead.email || ''}
                    onChange={e => setEditedLead({...editedLead, email: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Mail size={14} className="text-emerald-500" />
                    {lead.email || 'Sin correo'}
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                {isEditing ? (
                  <input 
                    className="w-full bg-transparent font-bold text-slate-700 outline-none"
                    value={editedLead.phone || ''}
                    onChange={e => setEditedLead({...editedLead, phone: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Phone size={14} className="text-emerald-500" />
                    {lead.phone || 'Sin teléfono'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN DOCUMENTOS DISPONIBLES */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Documentación compartida ({availableDocs.length})
              </h3>
            </div>
            
            {availableDocs.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {availableDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{doc.name}</span>
                    </div>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      VER ARCHIVO
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-sm italic">No hay documentos disponibles en el sistema.</p>
              </div>
            )}
          </section>
        </div>

        {/* FOOTER ACCIONES */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <button 
            onClick={() => onDelete && onDelete(lead.id)}
            className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-sm transition-colors"
          >
            <Trash2 size={18} /> ELIMINAR CLIENTE
          </button>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-700"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  GUARDAR CAMBIOS
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  EDITAR PERFIL
                </button>
                <button 
                  onClick={() => onOpenEmail && onOpenEmail([])}
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                  <Send size={18} /> ENVIAR EMAIL
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}