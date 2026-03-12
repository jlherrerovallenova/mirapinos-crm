// src/components/leads/EmailComposerModal.tsx
import { useState } from 'react';
import {
  Mail,
  MessageCircle,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import emailjs from '@emailjs/browser';

import { supabase } from '../../lib/supabase';
import { useDialog } from '../../context/DialogContext';

// Importamos la imagen de la firma (asegúrate de que la ruta sea correcta según tu estructura)
// import firmaImg from '../../assets/Firma.png';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  availableDocs: { name: string; url: string; category?: string }[];
  onSentSuccess?: () => void;
  initialMethod?: 'email' | 'whatsapp';
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
  const { showAlert } = useDialog();
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [subject, setSubject] = useState(`Documentación MIRAPINOS para ${leadName}`);
  const [message, setMessage] = useState(
    `Hola ${leadName},\n\nSegún acordamos, adjunto la documentación sobre MIRAPINOS.\n\nQuedo a tu disposición para cualquier duda.`
  );

  const [selectedDocs, setSelectedDocs] = useState<{ name: string; url: string; category?: string }[]>([]);

  if (!isOpen) return null;

  // Función para convertir la firma a Base64 para que sea visible en el email
  // Eliminada para no saturar EmailJS (Error 422 por payload demasiado grande)
  const getSignatureHtml = (): string => {
    return `
      <div style="font-family: sans-serif; font-size: 14px; color: #475569;">
        <p style="margin: 0; font-weight: bold; color: #0f172a;">Equipo Mirapinos CRM</p>
        <p style="margin: 0;">Mirapinos</p>
      </div>
    `;
  };

  const toggleDoc = (doc: { name: string; url: string; category?: string }) => {
    setSelectedDocs(prev =>
      prev.find(d => d.url === doc.url)
        ? prev.filter(d => d.url !== doc.url)
        : [...prev, doc]
    );
  };

  const saveHistory = async (sentMethod: 'email' | 'whatsapp') => {
    if (selectedDocs.length === 0) return;

    try {
      const records = selectedDocs.map(doc => ({
        lead_id: leadId,
        doc_name: doc.name,
        method: sentMethod,
        sent_at: new Date().toISOString()
      }));

      const { error } = await (supabase as any)
        .from('sent_documents')
        .insert(records as any);

      if (error) throw error;

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
        if (!leadEmail) {
          await showAlert({ title: 'Atención', message: 'El cliente no tiene email configurado.' });
          setLoading(false);
          return;
        }

        // Obtenemos la firma en HTML ligero en lugar de Base64
        const signatureHtml = getSignatureHtml();

        const htmlDocs = selectedDocs.length > 0
          ? `<br><br><strong>Documentos adjuntos:</strong><br>` +
          selectedDocs.map(d =>
            `<a href="${d.url}" style="color: #10b981; font-weight: bold; text-decoration: underline;">${d.name}</a>`
          ).join('<br>')
          : '';

        // Construimos el cuerpo HTML incluyendo la firma al final
        const htmlFullMessage = `
          <div style="font-family: sans-serif; line-height: 1.5; color: #334155;">
            ${message.replace(/\n/g, '<br>')}
            ${htmlDocs}
            <br><br>
            <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              ${signatureHtml}
            </div>
          </div>
        `;

        const templateParams = {
          to_name: leadName,
          to_email: leadEmail,
          subject: subject,
          message_html: htmlFullMessage,
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
        // Lógica WhatsApp (se mantiene igual ya que WhatsApp no soporta firmas HTML/Base64)
        if (!leadPhone) {
          await showAlert({ title: 'Atención', message: 'El cliente no tiene teléfono configurado.' });
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
        await saveHistory('whatsapp');
        setStatus('success');
        setTimeout(onClose, 1000);
      }
    } catch (error: any) {
      console.error('Error en el proceso de envío:', error);
      const msg = error?.text || error?.message || 'No se pudo enviar. Revisa la consola.';
      await showAlert({ title: 'Error de envío', message: msg });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

        {/* HEADER */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Enviar a</p>
            <h2 className="text-white font-bold text-base leading-tight">{leadName}</h2>
          </div>
          {/* TABS como píldoras en el header */}
          <div className="flex items-center gap-1 bg-emerald-700/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${method === 'email' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white'}`}
            >
              <Mail size={13} /> Email
            </button>
            <button
              type="button"
              onClick={() => setMethod('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${method === 'whatsapp' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white'}`}
            >
              <MessageCircle size={13} /> WhatsApp
            </button>
          </div>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* CAMPOS */}
          <div className="space-y-4">
            {method === 'email' && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-semibold text-sm text-slate-800 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensaje personalizado</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 outline-none font-medium text-sm text-slate-700 resize-none transition-all"
              />
            </div>
          </div>

          {/* DOCUMENTOS */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Documentación a enviar</label>
            <div className="space-y-3">
              {['Documentos Olivo', 'Documentos Arce', 'Parcelas', 'Renders-Fotos', 'Sin Categoría'].map(cat => {
                const catDocs = availableDocs.filter(d => (d.category || 'Sin Categoría') === cat);
                if (catDocs.length === 0) return null;

                return (
                  <div key={cat} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{cat}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-slate-100">
                      {catDocs.map((doc, idx) => {
                        const isSelected = selectedDocs.find(d => d.url === doc.url);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleDoc(doc)}
                            className={`flex items-center gap-2.5 px-4 py-3 text-left transition-all ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Paperclip size={13} className={isSelected ? 'text-emerald-500 shrink-0' : 'text-slate-300 shrink-0'} />
                            <span className="text-xs font-semibold truncate" title={doc.name}>{doc.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex-1">
              {status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 size={17} /> ¡Enviado correctamente!
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                  <AlertCircle size={17} /> Error al procesar el envío
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-500 font-semibold text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || status === 'success'}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm text-white flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-sm ${
                  method === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Enviar Documentación'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}