// src/components/leads/EmailComposerModal.tsx
import { useState } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import emailjs from '@emailjs/browser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  availableDocs: { name: string; url: string }[];
}

export default function EmailComposerModal({ 
  isOpen, 
  onClose, 
  leadName, 
  leadEmail, 
  leadPhone,
  availableDocs 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [subject, setSubject] = useState(`Información de interés para ${leadName}`);
  const [message, setMessage] = useState(
    `Hola ${leadName},\n\nEs un placer saludarte. Te adjunto la documentación que comentamos sobre nuestras propiedades en Mirapinos.\n\nQuedo a tu disposición.`
  );
  
  // Estado para los documentos seleccionados
  const [selectedDocs, setSelectedDocs] = useState<{ name: string; url: string }[]>([]);

  if (!isOpen) return null;

  const toggleDoc = (doc: { name: string; url: string }) => {
    setSelectedDocs(prev => 
      prev.find(d => d.url === doc.url) 
        ? prev.filter(d => d.url !== doc.url)
        : [...prev, doc]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    if (method === 'email') {
      try {
        // Generamos el cuerpo HTML con hipervínculos para los documentos
        const docsHtml = selectedDocs.length > 0 
          ? `<br><br><strong>Documentación adjunta:</strong><ul>${selectedDocs.map(d => 
              `<li><a href="${d.url}" style="color: #10b981; font-weight: bold; text-decoration: none;">${d.name}</a></li>`
            ).join('')}</ul>`
          : '';

        const fullHtmlMessage = `${message.replace(/\n/g, '<br>')}${docsHtml}`;

        const result = await emailjs.send(
          'YOUR_SERVICE_ID', 
          'YOUR_TEMPLATE_ID', 
          {
            to_name: leadName,
            to_email: leadEmail,
            subject: subject,
            message_html: fullHtmlMessage, // Usar este campo en tu plantilla de EmailJS
            from_name: 'Mirapinos CRM'
          },
          'YOUR_PUBLIC_KEY'
        );

        if (result.status === 200) setStatus('success');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    } else {
      // Lógica para WhatsApp (Link directo)
      const docsText = selectedDocs.length > 0 
        ? `\n\nDocumentación:\n${selectedDocs.map(d => `- ${d.name}: ${d.url}`).join('\n')}`
        : '';
      
      const encodedMsg = encodeURIComponent(`${message}${docsText}`);
      const whatsappUrl = `https://wa.me/${leadPhone?.replace(/\D/g, '')}?text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');
      setStatus('success');
    }
    
    setLoading(false);
    if (method === 'whatsapp' || status === 'success') {
        setTimeout(onClose, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Selector de Método */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setMethod('email')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-sm transition-all ${method === 'email' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <Mail size={18} /> EMAIL
          </button>
          <button 
            onClick={() => setMethod('whatsapp')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-sm transition-all ${method === 'whatsapp' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <MessageCircle size={18} /> WHATSAPP
          </button>
        </div>

        <form onSubmit={handleSend} className="p-8 space-y-6">
          {/* Alertas de contacto */}
          {method === 'email' && !leadEmail && (
            <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center gap-3 text-xs font-bold">
              <AlertCircle size={18} /> El cliente no tiene email configurado.
            </div>
          )}
          {method === 'whatsapp' && !leadPhone && (
            <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center gap-3 text-xs font-bold">
              <AlertCircle size={18} /> El cliente no tiene teléfono configurado.
            </div>
          )}

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje Personalizado</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-200 outline-none font-medium text-slate-700 resize-none"
              />
            </div>

            {/* Biblioteca de Documentos */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Seleccionar Documentos de la Biblioteca</label>
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
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                        <Paperclip size={14} />
                      </div>
                      <span className="text-xs font-bold truncate">{doc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Estado y Acciones */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              {status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in">
                  <CheckCircle2 size={18} /> Enviado con éxito
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-xl transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (method === 'email' && !leadEmail) || (method === 'whatsapp' && !leadPhone)}
                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-30 ${
                  method === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (method === 'email' ? <Mail size={18} /> : <MessageCircle size={18} />)}
                {method === 'email' ? 'Enviar Email' : 'Abrir WhatsApp'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}