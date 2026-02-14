// src/components/leads/EmailComposerModal.tsx
import { useState } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Mail
} from 'lucide-react';
import emailjs from '@emailjs/browser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  leadEmail: string | null;
  availableDocs: { name: string; url: string }[];
}

export default function EmailComposerModal({ 
  isOpen, 
  onClose, 
  leadName, 
  leadEmail, 
  availableDocs 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [subject, setSubject] = useState(`Información de Mirapinos para ${leadName}`);
  const [message, setMessage] = useState(
    `Hola ${leadName},\n\nEs un placer saludarte. Te adjunto la información solicitada sobre nuestras propiedades en Mirapinos.\n\nQuedo a tu disposición para cualquier duda.`
  );

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;

    setLoading(true);
    setStatus('idle');

    try {
      // Configuración de EmailJS
      // Debes configurar estos IDs en tu cuenta de EmailJS (https://www.emailjs.com/)
      const result = await emailjs.send(
        'YOUR_SERVICE_ID', 
        'YOUR_TEMPLATE_ID', 
        {
          to_name: leadName,
          to_email: leadEmail,
          subject: subject,
          message: message,
          from_name: 'Mirapinos CRM'
        },
        'YOUR_PUBLIC_KEY'
      );

      if (result.status === 200) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          setStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al enviar email:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const insertDocLink = (url: string) => {
    setMessage(prev => prev + `\n\nDocumento adjunto: ${url}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Enviar Correo</h2>
              <p className="text-sm text-slate-500 font-medium">Para: {leadEmail || 'Sin correo configurado'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSendEmail} className="p-8 space-y-6">
          {!leadEmail ? (
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 text-red-700">
              <AlertCircle size={24} />
              <p className="font-bold text-sm">Este lead no tiene un correo electrónico configurado. Actualízalo en la ficha del cliente.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700"
                  placeholder="Asunto del mensaje"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-slate-700 resize-none"
                />
              </div>

              {/* Selector de Documentos */}
              {availableDocs.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Insertar Documentos</label>
                  <div className="flex flex-wrap gap-2">
                    {availableDocs.map((doc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => insertDocLink(doc.url)}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-bold text-slate-500 transition-all border border-transparent hover:border-blue-100"
                      >
                        <Paperclip size={14} /> {doc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado del Envío */}
              {status === 'success' && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-bold text-sm border border-emerald-100">
                  <CheckCircle2 size={20} /> ¡Correo enviado correctamente!
                </div>
              )}
              {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 font-bold text-sm border border-red-100">
                  <AlertCircle size={20} /> Error al enviar. Revisa la configuración.
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading || status === 'success'}
                  className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  Enviar Ahora
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}