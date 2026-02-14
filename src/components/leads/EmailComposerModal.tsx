// src/components/leads/EmailComposerModal.tsx
import { useState } from 'react';
import { 
  X, 
  Mail, 
  MessageCircle, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  availableDocs: { name: string; url: string }[];
  onSentSuccess?: () => void;
}

export default function EmailComposerModal({ 
  isOpen, 
  onClose, 
  leadId,
  leadName, 
  leadEmail, 
  leadPhone,
  availableDocs,
  onSentSuccess
}: Props) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [subject, setSubject] = useState(`Documentación MIRAPINOS para ${leadName}`);
  const [message, setMessage] = useState(
    `Hola ${leadName},\n\nSegún acordamos, adjunto la documentación sobre MIRAPINOS.\n\nQuedo a tu disposición para cualquier duda.`
  );
  
  const [selectedDocs, setSelectedDocs] = useState<{ name: string; url: string }[]>([]);

  if (!isOpen) return null;

  const toggleDoc = (doc: { name: string; url: string }) => {
    setSelectedDocs(prev => 
      prev.find(d => d.url === doc.url) 
        ? prev.filter(d => d.url !== doc.url)
        : [...prev, doc]
    );
  };

  // Función para registrar el envío en la tabla sent_documents
  const saveHistory = async (sentMethod: 'email' | 'whatsapp') => {
    if (selectedDocs.length === 0) return;

    try {
      const records = selectedDocs.map(doc => ({
        lead_id: leadId,
        doc_name: doc.name,
        method: sentMethod,
        sent_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('sent_documents')
        .insert(records);

      if (error) throw error;
      
      // Notificamos al componente padre para que refresque el historial
      if (onSentSuccess) onSentSuccess();
    } catch (error) {
      console.error('Error al guardar el historial:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      if (method === 'email') {
        const htmlDocs = selectedDocs.length > 0 
          ? `<br><br><strong>Documentos adjuntos:</strong><br>` + 
            selectedDocs.map(d => 
              `<a href="${d.url}" style="color: #10b981; font-weight: bold; text-decoration: underline;">${d.name}</a>`
            ).join('<br>')
          : '';

        const templateParams = {
          to_name: leadName,
          to_email: leadEmail,
          subject: subject,
          message: message.replace(/\n/g, '<br>'), 
          html_docs: htmlDocs, 
        };

        const result = await emailjs.send(
          'service_w8zzkn8', 
          'template_t3fn5js', 
          templateParams,
          'UsY6LDpIJtiB91VMI'
        );

        if (result.status === 200) {
          await saveHistory('email');
          setStatus('success');
          setTimeout(onClose, 2000);
        }
      } else {
        // Lógica WhatsApp
        if (!leadPhone) {
          alert("El cliente no tiene teléfono configurado.");
          setLoading(false);
          return;
        }

        let cleanPhone = leadPhone.replace(/\D/g, '');
        if (cleanPhone.length === 9) cleanPhone = '34' + cleanPhone;

        const docsText = selectedDocs.length > 0 
          ? `\n\n📄 *Documentación adjunta:*` + selectedDocs.map(d => `\n- ${d.name}: ${d.url}`).join('')
          : '';
        
        const fullMessage = `${message}${docsText}`;
        const encodedMsg = encodeURIComponent(fullMessage);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
        
        window.open(whatsappUrl, '_blank');
        
        // En WhatsApp registramos el historial inmediatamente al abrir la pestaña
        await saveHistory('whatsapp');
        setStatus('success');
        setTimeout(onClose, 1000);
      }
    } catch (error) {
      console.error('Error en el proceso de envío:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        <div className="flex border-b border-slate-100">
          <button 
            type="button"
            onClick={() => setMethod('email')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-xs transition-all ${method === 'email' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <Mail size={16} /> EMAIL
          </button>
          <button 
            type="button"
            onClick={() => setMethod('whatsapp')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-xs transition-all ${method === 'whatsapp' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <MessageCircle size={16} /> WHATSAPP
          </button>
        </div>

        <form onSubmit={handleSend} className="p-8 space-y-6">
          <div className="space-y-4">
            {method === 'email' && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-2 px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje personalizado</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-200 outline-none font-medium text-slate-700 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Documentación a enviar</label>
              <div className="grid grid-cols-2 gap-2">
                {availableDocs.map((doc, idx) => {
                  const isSelected = selectedDocs.find(d => d.url === doc.url);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDoc(doc)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                        isSelected 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Paperclip size={14} className={isSelected ? 'text-emerald-500' : 'text-slate-300'} />
                      <span className="text-xs font-bold truncate">{doc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex-1">
              {status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 size={18} /> ¡Enviado con éxito!
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                  <AlertCircle size={18} /> Error al procesar el envío
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-xs">
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loading || status === 'success'}
                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
                  method === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Documentación'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}