import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // CORRECCIÓN: Dos puntos (../../) para subir dos niveles
import { StageBadge } from '../Shared';
import { X, Edit2, Trash2, Save, User, Mail, Phone, Calendar, FileText, Check, MessageCircle, History, Globe } from 'lucide-react';

interface LeadDetailModalProps {
  lead: any;
  availableDocs: any[];
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onOpenEmail: (selectedDocs: string[]) => void;
}

export default function LeadDetailModal({ lead, availableDocs, onClose, onUpdate, onDelete, onOpenEmail }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(lead);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Sincronizar estado cuando cambia el lead
  useEffect(() => {
    setFormData(lead);
    setSelectedDocs([]);
    setIsEditing(false);
  }, [lead]);

  const handleSave = async () => {
    const { error } = await supabase.from('leads').update({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      stage: formData.stage,
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
    const docsToSend = availableDocs.filter(d => selectedDocs.includes(d.id));
    
    // NOTA: WhatsApp no soporta HTML, enviamos enlaces en texto plano
    const docLinks = docsToSend.map(d => `• ${d.name}: ${d.url}`).join('\n');
    const text = `Hola ${formData.firstName}, aquí tienes la documentación de Finca Mirapinos:\n\n${docLinks}`;
    
    // Limpieza básica del teléfono
    const cleanPhone = formData.phone?.replace(/\s/g, '') || '';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    // Registrar evento
    await supabase.from('events').insert([{
        leadId: lead.id, 
        type: 'Documentación', 
        description: `Envío vía WhatsApp: ${docsToSend.map(d=>d.name).join(', ')}`, 
        date: new Date().toISOString()
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-[48px] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* HEADER CON EDICIÓN/VISUALIZACIÓN */}
        <div className="bg-pine-900 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start sticky top-0 z-10 shadow-lg">
          <div className="flex-1 w-full">
            {isEditing ? (
              <div className="space-y-4 w-full md:w-2/3">
                <div className="grid grid-cols-2 gap-4">
                   <input className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xl font-bold outline-none focus:bg-white/20 w-full placeholder-white/30 text-white" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Nombre" />
                   <input className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xl font-bold outline-none focus:bg-white/20 w-full placeholder-white/30 text-white" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Apellidos" />
                </div>
                <div className="flex gap-4">
                  <select className="bg-pine-800 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-white" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                    {['Prospecto', 'Visitando', 'Interés', 'Cierre'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="bg-pine-800 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-white" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                    {['Web', 'Instagram', 'Telefónico', 'Referido', 'Portal Inmobiliario', 'Idealista'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl md:text-5xl font-poppins font-bold tracking-tighter mb-2">{formData.firstName} {formData.lastName}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <StageBadge stage={formData.stage} />
                  <span className="text-pine-300 text-sm font-medium flex items-center gap-1"><Globe size={14} /> {formData.source}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-6 md:mt-0 self-end md:self-start">
            {isEditing ? (
              <button onClick={handleSave} className="p-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white transition-all shadow-lg hover:shadow-emerald-500/30"><Save size={24} /></button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-white transition-all"><Edit2 size={24} /></button>
            )}
            <button onClick={onDelete} className="p-4 bg-rose-500/20 hover:bg-rose-500 text-white rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={24} /></button>
            <button onClick={onClose} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={24} /></button>
          </div>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white">
          <div className="lg:col-span-7 space-y-12">
            
            {/* SECCIÓN 1: INFO CONTACTO */}
            <section className="space-y-6">
              <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.3em] flex items-center gap-2 px-2"><User size={14} /> Información de Contacto</h3>
              <div className="bg-slate-50/50 border border-pine-50 p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</p>
                   {isEditing ? <input className="w-full p-3 bg-white rounded-xl border border-pine-100 outline-none focus:border-pine-400" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /> : 
                   <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.open(`mailto:${formData.email}`)}>
                      <Mail size={16} className="text-pine-400 group-hover:text-pine-600" />
                      <p className="font-bold text-slate-700 truncate group-hover:text-pine-900 transition-colors">{formData.email}</p>
                   </div>}
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono</p>
                   {isEditing ? <input className="w-full p-3 bg-white rounded-xl border border-pine-100 outline-none focus:border-pine-400" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /> : 
                   <div className="flex items-center gap-2">
                      <Phone size={16} className="text-pine-400" />
                      <p className="font-bold text-slate-700">{formData.phone}</p>
                   </div>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fecha Registro</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-pine-400" />
                    <p className="font-bold text-slate-700">{formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: DOCUMENTOS */}
            <section className="space-y-6">
               <div className="flex justify-between items-end px-2">
                  <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.3em] flex items-center gap-2"><FileText size={14} /> Envío de Documentación</h3>
                  {selectedDocs.length > 0 && <span className="text-[10px] font-black text-white bg-pine-600 px-3 py-1 rounded-full animate-in fade-in zoom-in">{selectedDocs.length} seleccionados</span>}
               </div>
               <div className="grid grid-cols-1 gap-3">
                  {availableDocs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-4">No hay documentos disponibles. Súbelos desde Ajustes.</p>
                  ) : (
                    availableDocs.map(doc => (
                      <div key={doc.id} onClick={() => toggleDoc(doc.id)} className={`flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer select-none ${selectedDocs.includes(doc.id) ? 'bg-pine-900 border-pine-900 text-white shadow-lg' : 'bg-white border-pine-100 text-slate-600 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${selectedDocs.includes(doc.id) ? 'bg-white/10' : 'bg-pine-50 text-pine-600'}`}><FileText size={20} /></div>
                          <span className="font-bold text-sm">{doc.name}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedDocs.includes(doc.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                          {selectedDocs.includes(doc.id) && <Check size={14} strokeWidth={4} />}
                        </div>
                      </div>
                    ))
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4 pt-4">
                  <button onClick={handleWhatsApp} disabled={selectedDocs.length === 0} className="flex items-center justify-center gap-3 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase hover:bg-emerald-600 disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"><MessageCircle size={18} /> WhatsApp</button>
                  <button onClick={() => onOpenEmail(selectedDocs)} disabled={selectedDocs.length === 0} className="flex items-center justify-center gap-3 py-5 bg-pine-900 text-white rounded-[24px] font-black text-xs uppercase hover:bg-black disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-pine-900/20"><Mail size={18} /> Enviar Email</button>
               </div>
            </section>
          </div>
          
          {/* SECCIÓN 3: HISTORIAL */}
          <div className="lg:col-span-5 space-y-8">
             <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.3em] flex items-center gap-2 px-2"><History size={14} /> Historial</h3>
             <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                <div className="relative group">
                  <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-white border-4 border-pine-600 shadow-sm z-10"></div>
                  <p className="text-[10px] font-black text-pine-600 uppercase tracking-widest mb-1">Sesión Actual</p>
                  <p className="text-sm text-slate-700 font-bold leading-relaxed tracking-tight">Ficha de cliente activa en pantalla.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}