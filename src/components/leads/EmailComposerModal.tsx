import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '../../lib/supabase';
import { X, Send, Link as LinkIcon, Loader2 } from 'lucide-react';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_w8zzkn8";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_t3fn5js";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "UsY6LDpIJtiB91VMI";

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  selectedDocIds: string[];
  allDocs: any[];
  onSuccess: () => void;
}

export default function EmailComposerModal({ 
  isOpen, 
  onClose, 
  lead, 
  selectedDocIds, 
  allDocs, 
  onSuccess 
}: EmailComposerModalProps) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
        setBody(`Hola ${lead.firstName},\n\nTal como acordamos, te envío la documentación de Finca Mirapinos.\n\nQuedo a tu disposición.\n\nUn saludo.`);
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleSend = async () => {
    setSending(true);
    
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        alert("Error de Configuración: Faltan las claves de EmailJS.");
        setSending(false);
        return;
    }

    // GESTIÓN DE DOCUMENTOS: Filtramos y generamos los enlaces
    const docs = allDocs.filter(d => selectedDocIds.includes(d.id));
    const docLinks = docs.map(d => `• ${d.name}: ${d.url}`).join('\n');
    
    // CONSTRUCCIÓN DEL MENSAJE COMPLETO
    const fullMessage = `${body}\n\n--------------------------------\nDOCUMENTACIÓN:\n\n${docLinks}\n--------------------------------`;

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          subject: "DOCUMENTACIÓN FINCA MIRAPINOS",
          to_name: `${lead.firstName} ${lead.lastName}`,
          to_email: lead.email,
          message: fullMessage, // Esta variable debe coincidir con {{message}} en tu plantilla de EmailJS
          reply_to: 'info@mirapinos.com',
      }, PUBLIC_KEY);

      await supabase.from('events').insert([{
        leadId: lead.id, 
        type: 'Documentación', 
        description: `Email enviado: ${docs.map(d => d.name).join(', ')}`, 
        date: new Date().toISOString()
      }]);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error EmailJS:", err);
      const errMsg = err?.text || "Verifica la consola para más detalles.";
      alert(`Error al enviar email: ${errMsg}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-xl text-slate-900">Redactar Email</h3>
             <p className="text-xs text-slate-500">Para: {lead.email}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
             <textarea 
               rows={6} 
               className="w-full p-6 bg-slate-50 rounded-3xl resize-none outline-none focus:ring-2 focus:ring-pine-600/10 transition-all" 
               value={body} 
               onChange={e => setBody(e.target.value)} 
             />
           </div>

           <div className="bg-blue-50 p-4 rounded-3xl text-blue-700 text-[10px] uppercase font-bold flex items-center gap-2 border border-blue-100">
             <LinkIcon size={12}/> Se adjuntarán {selectedDocIds.length} enlaces automáticamente al final
           </div>

           <button 
             onClick={handleSend} 
             disabled={sending} 
             className="w-full py-5 bg-pine-900 text-white rounded-2xl font-black text-xs uppercase flex justify-center gap-3 hover:bg-black transition-all disabled:opacity-50"
           >
             {sending ? <Loader2 className="animate-spin" /> : <><Send size={18} /> ENVIAR EMAIL</>}
           </button>
        </div>
      </div>
    </div>
  );
}