// src/components/leads/EmailComposerModal.tsx
import { useState } from 'react';
import {
  Mail,
  MessageCircle,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDialog } from '../../context/DialogContext';
import { useCreateAgendaItem } from '../../hooks/useAgenda';
import { useAuth } from '../../context/AuthContext';

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
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useDialog();
  const [method, setMethod] = useState<'email' | 'whatsapp'>(
    leadEmail ? 'email' : 'whatsapp'
  );
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const createAgendaMutation = useCreateAgendaItem();

  const [subject, setSubject] = useState(`Documentación MIRAPINOS para ${leadName}`);
  const [message, setMessage] = useState(
    `Hola ${leadName},\n\nSegún acordamos, adjunto la documentación sobre MIRAPINOS.\n\nQuedo a tu disposición para cualquier duda.`
  );

  const [selectedDocs, setSelectedDocs] = useState<{ name: string; url: string; category?: string }[]>([]);

  if (!isOpen) return null;

  // Genera la firma dinámica con los datos del comercial que envía
  const getSignatureHtml = (): string => {
    const agentName = profile?.full_name || user?.email || 'Equipo Mirapinos';
    const agentEmail = profile?.email || user?.email || '';
    const agentPhone = profile?.phone || '';

    // Heurística en español para determinar dinámicamente si es Asesor o Asesora
    const getAgentTitle = (name: string): string => {
      const lowerName = name.toLowerCase().trim();
      const firstWord = lowerName.split(/\s+/)[0];
      
      const femaleKeywords = [
        'maria', 'maría', 'carmen', 'isabel', 'pilar', 'mercedes', 
        'dolores', 'luz', 'sol', 'concepcion', 'concepción', 'mar',
        'raquel', 'beatriz', 'esther', 'belen', 'belén', 'inmaculada',
        'consuelo', 'salud', 'amparo', 'remedios', 'socorro', 'milagros'
      ];
      
      const maleExceptions = ['borja', 'luca', 'andrea', 'joshua', 'nikola'];
      
      const isFemale = 
        (firstWord.endsWith('a') && !maleExceptions.includes(firstWord)) ||
        (firstWord.endsWith('á') && !['josé', 'rene', 'rené'].includes(firstWord)) ||
        femaleKeywords.some(keyword => lowerName.includes(keyword));
        
      return isFemale ? 'Asesora Inmobiliaria' : 'Asesor Inmobiliario';
    };

    const agentTitle = getAgentTitle(agentName);

    return `
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
          <tr>
            <td style="padding-right: 16px; border-right: 3px solid #1a5c38; vertical-align: middle;">
              <div style="font-size: 15px; font-weight: 700; color: #1e293b; white-space: nowrap;">${agentName}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${agentTitle}</div>
              <div style="font-size: 13px; font-weight: 700; color: #1a5c38; margin-top: 4px; letter-spacing: 0.05em;">MIRAPINOS</div>
            </td>
            <td style="padding-left: 16px; vertical-align: middle;">
              ${agentPhone ? `<div style="font-size: 12px; color: #475569; margin-bottom: 4px;">&#128222; ${agentPhone}</div>` : ''}
              ${agentEmail ? `<div style="font-size: 12px; color: #475569;">&#9993; ${agentEmail}</div>` : ''}
            </td>
          </tr>
        </table>
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

  const createTaskRecord = async (sentMethod: 'email' | 'whatsapp', trackingId?: string) => {
    try {
      const methodLabel = sentMethod === 'email' ? 'Email' : 'WhatsApp';
      const docNames = selectedDocs.length > 0 
        ? selectedDocs.map(d => d.name).join(', ')
        : 'Documentación manual';
      
      const payload: any = {
        lead_id: leadId,
        user_id: user?.id,
        title: `Envío ${methodLabel}: ${docNames}`,
        type: methodLabel,
        due_date: new Date().toISOString(),
        completed: true
      };

      if (sentMethod === 'email' && trackingId) {
        payload.tracking_id = trackingId;
      }

      try {
        await createAgendaMutation.mutateAsync(payload);
      } catch (err: any) {
        // Si falla por columna tracking_id no existente (por falta de migración),
        // reintentar sin ella para no romper la experiencia
        if (payload.tracking_id && (err?.message?.includes('tracking_id') || err?.message?.includes('schema cache'))) {
          console.warn('Volviendo a intentar sin tracking_id debido a error de base de datos:', err);
          delete payload.tracking_id;
          await createAgendaMutation.mutateAsync(payload);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error('Error al crear tarea de agenda:', error);
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `clientes/${leadId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const newDoc = { name: file.name, url: publicUrl, category: 'Archivo Externo' };
      setSelectedDocs(prev => [...prev, newDoc]);
    } catch (error: any) {
      console.error('Error subiendo archivo:', error);
      await showAlert({ title: 'Error', message: 'No se pudo subir el archivo: ' + error.message });
    } finally {
      setLoading(false);
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

        const htmlDocs = selectedDocs.length > 0
          ? `
            <div style="margin: 28px 0; background: #f8fafb; border-left: 4px solid #1a5c38; border-radius: 0 8px 8px 0; padding: 16px 20px;">
              <div style="font-size: 11px; font-weight: 700; color: #1a5c38; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">📎 Documentos adjuntos</div>
              ${selectedDocs.map(d =>
                `<div style="margin-bottom: 6px;"><a href="${d.url}" style="color: #1a5c38; font-size: 13px; font-weight: 600; text-decoration: underline;">${d.name}</a></div>`
              ).join('')}
            </div>`
          : '';

        // Insertamos en email_tracking para obtener el tracking_id
        const { data: trackingRecord, error: trackingError } = await (supabase as any)
          .from('email_tracking')
          .insert([{ lead_id: leadId, subject: subject }])
          .select()
          .single();

        if (trackingError) {
          console.error("No se pudo registrar el tracking", trackingError);
        }

        const trackingId = trackingRecord?.id;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const pixelHtml = trackingId ? `<img src="${supabaseUrl}/functions/v1/track-pixel?tracking_id=${trackingId}" width="1" height="1" alt="" style="display:none;" />` : '';

        // Construimos el cuerpo HTML con el nuevo diseño profesional Mirapinos
        const htmlFullMessage = `
          <!DOCTYPE html>
          <html>
          <body style="margin:0; padding:0; background-color:#f0f4f0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;">
              <tr>
                <td align="center" style="padding: 32px 16px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- ENCABEZADO MIRAPINOS -->
                    <tr>
                      <td style="background-color:#1a5c38; padding: 28px 40px; text-align:center;">
                        <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 700; color: #ffffff; letter-spacing: 0.12em; text-transform: uppercase;">MIRAPINOS</div>
                      </td>
                    </tr>

                    <!-- CUERPO -->
                    <tr>
                      <td style="padding: 36px 40px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #334155;">
                        ${message.replace(/\n/g, '<br>')}
                        ${htmlDocs}
                        ${getSignatureHtml()}
                      </td>
                    </tr>

                    <!-- PIE -->
                    <tr>
                      <td style="background-color:#1a5c38; padding: 10px 40px;">
                        <div style="height:4px;"></div>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
            ${pixelHtml}
          </body>
          </html>
        `;

        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: leadEmail,
            subject,
            html: htmlFullMessage,
          },
        });

        if (error || data?.error) {
          const msg = data?.error || error?.message || 'Error desconocido';
          throw new Error(msg);
        }

        await saveHistory('email');
        await createTaskRecord('email', trackingId);
        setStatus('success');
        setTimeout(onClose, 2000);
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
        await createTaskRecord('whatsapp');
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
              onClick={() => leadEmail && setMethod('email')}
              disabled={!leadEmail}
              title={!leadEmail ? 'El cliente no tiene email registrado' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                !leadEmail
                  ? 'opacity-40 cursor-not-allowed text-emerald-300'
                  : method === 'email'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Mail size={13} /> Email
            </button>
            <button
              type="button"
              onClick={() => leadPhone && setMethod('whatsapp')}
              disabled={!leadPhone}
              title={!leadPhone ? 'El cliente no tiene teléfono registrado' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                !leadPhone
                  ? 'opacity-40 cursor-not-allowed text-emerald-300'
                  : method === 'whatsapp'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
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
                {['Documentos Olivo', 'Documentos Arce', 'Parcelas', 'Renders-Fotos', 'Sin Categoría', 'Archivo Externo'].map(cat => {
                  const catDocs = (cat === 'Archivo Externo') 
                    ? selectedDocs.filter(d => d.category === 'Archivo Externo')
                    : availableDocs.filter(d => (d.category || 'Sin Categoría') === cat);
                    
                  if (catDocs.length === 0 && cat !== 'Archivo Externo') return null;

                  return (
                    <div key={cat} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{cat}</h4>
                          {expandedCategories.includes(cat) ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                        {cat === 'Archivo Externo' && (
                          <label 
                            className="cursor-pointer flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold hover:bg-emerald-200 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Upload size={10} /> Adjuntar nuevo
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                          </label>
                        )}
                      </div>
                      
                      {expandedCategories.includes(cat) && (
                        <div className="grid grid-cols-2 gap-px bg-slate-100">
                          {catDocs.length === 0 && cat === 'Archivo Externo' ? (
                            <div className="col-span-2 bg-white px-4 py-3 text-center">
                              <p className="text-[10px] text-slate-400 italic">No hay archivos externos adjuntos para este envío.</p>
                            </div>
                          ) : (
                            catDocs.map((doc, idx) => {
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
                            })
                          )}
                        </div>
                      )}
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