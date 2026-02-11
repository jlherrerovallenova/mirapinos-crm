// src/components/leads/LeadDetailModal.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { StageBadge } from '../Shared';
import { 
  X, Edit2, Trash2, Save, User, Mail, Phone, Calendar, 
  FileText, Check, MessageCircle, History, Globe, File
} from 'lucide-react';
import { Database } from '../../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

interface LeadDetailModalProps {
  lead: Lead;
  availableDocs: any[];
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onOpenEmail: (selectedDocs: string[]) => void;
}

export default function LeadDetailModal({ lead, availableDocs, onClose, onUpdate, onDelete, onOpenEmail }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Lead>(lead);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    setFormData(lead);
    setSelectedDocs([]);
    setIsEditing(false);
  }, [lead]);

  const handleSave = async () => {
    const { error } = await supabase.from('leads').update({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status, // Campo correcto en DB
      source: formData.source
    }).eq('id', lead.id);

    if (!error) {
      setIsEditing(false);
      onUpdate();
    } else {
      alert(`Error al actualizar: ${error.message}`);
    }
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const handleWhatsApp = async () => {
    const text = `Hola ${formData.name}, te contacto desde Mirapinos.`;
    const cleanPhone = formData.phone?.replace(/\s/g, '') || '';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-white px-8 py-5 border-b border-slate-200 flex justify-between items-start shrink-0">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3 max-w-md">
                   <input 
                     className="input-std font-bold text-lg" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})} 
                     placeholder="Nombre Completo" 
                   />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{formData.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <StageBadge stage={formData.status || 'new'} />
                  <span className="text-slate-400 text-xs flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded">
                    <Globe size={12} /> {formData.source}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button onClick={handleSave} className="btn-icon bg-emerald-600 text-white hover:bg-emerald-700"><Save size={18} /></button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-icon text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"><Edit2 size={18} /></button>
            )}
            <button onClick={onDelete} className="btn-icon text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={18} /></button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="btn-icon text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        {/* BODY CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA: DATOS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tarjeta de Contacto */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={14} /> Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={<Mail size={16}/>} label="Email" value={formData.email} isEditing={isEditing} 
                   onChange={(val: string) => setFormData({...formData, email: val})} />
                
                <InfoItem icon={<Phone size={16}/>} label="Teléfono" value={formData.phone} isEditing={isEditing} 
                   onChange={(val: string) => setFormData({...formData, phone: val})} />
                
                <div className="col-span-2 md:col-span-1">
                   <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1">Estado</p>
                   {isEditing ? (
                     <select 
                        className="input-std text-sm w-full" 
                        value={formData.status || 'new'} 
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                     >
                       <option value="new">Nuevo</option>
                       <option value="contacted">Contactado</option>
                       <option value="qualified">Cualificado</option>
                       <option value="proposal">Propuesta</option>
                       <option value="negotiation">Negociación</option>
                       <option value="closed">Ganado</option>
                       <option value="lost">Perdido</option>
                     </select>
                   ) : (
                     <div className="mt-1">
                       <StageBadge stage={formData.status || 'new'} />
                     </div>
                   )}
                </div>

                <div className="col-span-2 md:col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1">Registrado</p>
                    <div className="flex items-center gap-2 p-2 text-sm text-slate-600">
                        <Calendar size={16} className="text-slate-400"/>
                        {new Date(formData.created_at).toLocaleDateString()}
                    </div>
                </div>
              </div>
            </div>

            {/* Sección Documentos (Placeholder) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Documentación
                  </h3>
                  {selectedDocs.length > 0 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{selectedDocs.length} seleccionados</span>}
               </div>
               
               <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                  {availableDocs.length === 0 ? (
                    <p className="text-sm text-slate-400 italic p-6 text-center">No hay documentos cargados en el sistema.</p>
                  ) : (
                    availableDocs.map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => toggleDoc(doc.id)} 
                        className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${selectedDocs.includes(doc.id) ? 'bg-emerald-50/30' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedDocs.includes(doc.id) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                             <File size={16} />
                          </div>
                          <span className={`text-sm font-medium ${selectedDocs.includes(doc.id) ? 'text-emerald-900' : 'text-slate-600'}`}>{doc.name}</span>
                        </div>
                        {selectedDocs.includes(doc.id) && <Check size={16} className="text-emerald-600" />}
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
          
          {/* COLUMNA DERECHA: ACCIONES RÁPIDAS */}
          <div className="lg:col-span-5 space-y-6">
             <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                   <button 
                      onClick={handleWhatsApp} 
                      className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                   >
                      <MessageCircle size={18} /> Enviar por WhatsApp
                   </button>
                   <button 
                      onClick={() => onOpenEmail(selectedDocs)} 
                      className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                   >
                      <Mail size={18} /> Enviar por Email
                   </button>
                </div>
             </div>

             <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-64 overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><History size={14}/> Actividad</h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                   {/* Placeholder de actividad */}
                   <div className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                      <div>
                         <p className="text-xs font-bold text-slate-700">Ficha visualizada</p>
                         <p className="text-[10px] text-slate-400">Hace un momento</p>
                      </div>
                   </div>
                   <div className="flex gap-3 opacity-60">
                      <div className="mt-1 w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>
                      <div>
                         <p className="text-xs font-bold text-slate-700">Lead creado</p>
                         <p className="text-[10px] text-slate-400">{new Date(formData.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Estilos locales para inputs */}
      <style>{`
        .input-std {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          outline: none;
          transition: all 0.2s;
        }
        .input-std:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }
        .btn-icon {
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
      `}</style>
    </div>
  );
}

// Subcomponente auxiliar
function InfoItem({ icon, label, value, isEditing, onChange }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-400 uppercase font-bold ml-1">{label}</p>
      {isEditing ? (
        <input className="input-std text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <div className="flex items-center gap-2 p-2">
          <div className="text-slate-400">{icon}</div>
          <p className="text-sm font-medium text-slate-700 truncate">{value || '-'}</p>
        </div>
      )}
    </div>
  );
}