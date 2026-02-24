import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Save, 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Settings as SettingsIcon,
  FileCode,
  Loader2,
  Calculator,
  Euro
} from 'lucide-react';
import { AppNotification } from '../components/AppNotification';

interface SystemDocument {
  name: string;
  url: string;
  size?: number;
  created_at?: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<SystemDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    company_name: '',
    email_notifications: true,
    auto_assignment: false,
    default_language: 'es'
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchDocuments();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFormData({
          company_name: data.company_name || '',
          email_notifications: data.email_notifications ?? true,
          auto_assignment: data.auto_assignment ?? false,
          default_language: data.default_language || 'es'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('system-documents')
        .list();

      if (error) throw error;

      if (data) {
        const docs = await Promise.all(
          data.map(async (file) => {
            const { data: { publicUrl } } = supabase.storage
              .from('system-documents')
              .getPublicUrl(file.name);
            
            return {
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size,
              created_at: file.created_at
            };
          })
        );
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 1,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setNotification({
        show: true,
        message: 'Configuración guardada correctamente',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error al guardar la configuración',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePayments = (price: number) => {
    const iva = price * 0.10;
    const totalWithIva = price + iva;
    const reserva = 6000;
    const contrato10 = (price * 0.10) - reserva;
    const contratoIva = (price * 0.10) * 0.10;
    const cuotas10 = price * 0.10;
    const cuotaMensualTotal = (cuotas10 + (cuotas10 * 0.10)) / 18;
    const escritura80 = price * 0.80;
    const escrituraIva = escritura80 * 0.10;

    return {
      totalWithIva,
      reserva,
      contratoTotal: contrato10 + contratoIva,
      cuotaMensualTotal,
      escrituraTotal: escritura80 + escrituraIva
    };
  };

  const payments = basePrice > 0 ? calculatePayments(basePrice) : null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from('system-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setNotification({ show: true, message: 'Documento subido', type: 'success' });
      fetchDocuments();
    } catch (error) {
      setNotification({ show: true, message: 'Error al subir', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (name: string) => {
    if (!window.confirm('¿Eliminar documento?')) return;
    try {
      const { error } = await supabase.storage.from('system-documents').remove([name]);
      if (error) throw error;
      setDocuments(docs => docs.filter(d => d.name !== name));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          Guardar cambios
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Lógica de Forma de Pago PREVIA al resto */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold">Simulador Forma de Pago (Mirapinos)</h2>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Introduzca el precio base de la vivienda</label>
              <div className="relative max-w-xs">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={basePrice || ''}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  placeholder="Ej: 395000"
                  className="w-full pl-10 pr-4 py-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none text-lg font-medium transition-all"
                />
              </div>
            </div>

            {payments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total con IVA (10%)</p>
                  <p className="text-lg font-bold text-gray-900">{payments.totalWithIva.toLocaleString('es-ES')} €</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Contrato (10%)</p>
                  <p className="text-lg font-bold text-blue-700">{payments.contratoTotal.toLocaleString('es-ES')} €</p>
                  <p className="text-[10px] text-blue-500 mt-1">(-6.000€ reserva incl.)</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-bold uppercase mb-1">18 Cuotas Mensuales</p>
                  <p className="text-lg font-bold text-indigo-700">{payments.cuotaMensualTotal.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</p>
                  <p className="text-[10px] text-indigo-500 mt-1">IVA Incluido cada mes</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Escritura (80%)</p>
                  <p className="text-lg font-bold text-green-700">{payments.escrituraTotal.toLocaleString('es-ES')} €</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400">Introduzca un precio para ver el desglose automático de pagos</p>
              </div>
            )}
          </div>

          {/* Documentos del Sistema */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileCode size={20} className="text-blue-600" />
                  Documentos del Sistema
                </h2>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-all border border-blue-200">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={18} />}
                <span className="text-sm font-bold">Subir</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            
            <div className="p-4 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map((doc, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between group hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-3 truncate">
                      <FileText className="text-blue-500 shrink-0" size={20} />
                      <span className="text-sm font-medium truncate text-gray-700">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={doc.url} download className="p-2 text-gray-400 hover:text-blue-600"><Download size={16} /></a>
                      <button onClick={() => handleDeleteDocument(doc.name)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuración General */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Ajustes Generales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="text-sm text-gray-700">Notificaciones</span>
                <input
                  type="checkbox"
                  checked={formData.email_notifications}
                  onChange={(e) => setFormData({...formData, email_notifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification.show && (
        <AppNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
};

export default Settings; 