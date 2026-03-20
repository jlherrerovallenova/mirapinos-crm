// src/components/leads/CreateLeadModal.tsx
import { useState } from 'react';
import { X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

import { useCreateLead } from '../../hooks/useLeads';

export default function CreateLeadModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const createMutation = useCreateLead();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Web',
    interested_in: '',
    notes: ''
  });
  const [magicText, setMagicText] = useState('');
  const [showMagicPaste, setShowMagicPaste] = useState(false);

  if (!isOpen) return null;

  const loading = createMutation.isPending;

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 9;
  };

  const checkDuplicates = async (email: string, phone: string) => {
    if (!email && !phone) return false;
    try {
      if (email) {
        const { data, error } = await supabase.from('leads').select('id').eq('email', email).limit(1);
        if (!error && data && data.length > 0) return true;
      }
      if (phone) {
        const { data, error } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
        if (!error && data && data.length > 0) return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleMagicPaste = () => {
    if (!magicText.trim()) return;
    
    // Patterns for direct emails
    const nameMatch = magicText.match(/Nombre:\s*(.*)/i);
    const phoneMatch = magicText.match(/Teléfono:\s*([0-9\s]+)/i);
    const emailMatch = magicText.match(/Email:\s*([^\s]+@[^\s]+\.[^\s]+)/i);
    const messageMatch = magicText.match(/Mensaje:\s*([\s\S]*)/i);

    // Patterns for Idealista
    const isIdealista = magicText.toLowerCase().includes('idealista');
    
    let updates: any = {};
    
    if (nameMatch) updates.name = nameMatch[1].trim();
    if (phoneMatch) updates.phone = phoneMatch[1].trim();
    if (emailMatch) updates.email = emailMatch[1].trim();
    if (messageMatch) updates.notes = messageMatch[1].trim();
    
    if (isIdealista) {
      updates.source = 'Idealista';
      if (!updates.phone) {
        const idealPhones = magicText.match(/[679][0-9\s]{8,}/);
        if (idealPhones) updates.phone = idealPhones[0].replace(/\s/g, '');
      }
      if (!updates.email) {
        const idealEmails = magicText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (idealEmails) updates.email = idealEmails[0].trim();
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
    setMagicText('');
    setShowMagicPaste(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (!user?.id) throw new Error('Sesión de usuario no detectada.');
      if (!formData.name.trim()) throw new Error('El nombre es obligatorio.');

      if (formData.email && !isValidEmail(formData.email)) {
        throw new Error('El formato del correo electrónico no es válido.');
      }

      if (formData.phone && !isValidPhone(formData.phone)) {
        throw new Error('El teléfono debe tener al menos 9 dígitos.');
      }

      const isDuplicate = await checkDuplicates(formData.email, formData.phone);
      if (isDuplicate) {
        throw new Error('Ya existe un cliente registrado con este email o teléfono.');
      }

      const payload: any = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        source: formData.source,
        interested_in: formData.interested_in || null,
        notes: formData.notes || null,
        status: 'new',
        assigned_to: user.id
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          setFormData({ name: '', email: '', phone: '', source: 'Web', interested_in: '', notes: '' });
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Error al guardar el cliente.');
        }
      });

    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Nuevo Cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-8 pt-6">
          <button 
            type="button"
            onClick={() => setShowMagicPaste(!showMagicPaste)}
            className={`w-full py-4 px-3 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${
              showMagicPaste ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Sparkles size={20} className={showMagicPaste ? 'animate-pulse' : ''} />
            <span className="text-sm font-bold">
              {showMagicPaste ? 'Cerrar Pegado Mágico' : 'Pegado Mágico (Desde Email)'}
            </span>
          </button>

          {showMagicPaste && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in slide-in-from-top-4 duration-300">
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-2">Pega aquí el texto del correo</p>
              <textarea
                autoFocus
                className="w-full h-32 p-3 bg-white border border-emerald-200 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Nombre: Juan Pérez..."
                value={magicText}
                onChange={(e) => setMagicText(e.target.value)}
              />
              <button
                type="button"
                onClick={handleMagicPaste}
                className="w-full mt-3 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-all text-sm"
              >
                Auto-completar Formulario
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700"
              placeholder="Ej. Juan Pérez"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700"
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700"
                placeholder="600 000 000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Origen</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Idealista">Idealista</option>
                <option value="Web">Web</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Referido">Referido</option>
                <option value="Llamada">Llamada</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Interesado en</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                value={formData.interested_in}
                onChange={e => setFormData({ ...formData, interested_in: e.target.value })}
              >
                <option value="">Sin especificar</option>
                <option value="Chalet Olivo">Chalet Olivo</option>
                <option value="Chalet Arce">Chalet Arce</option>
                <option value="Parcelas">Parcelas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Notas / Mensaje</label>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
              rows={3}
              placeholder="Detalles sobre la consulta..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}