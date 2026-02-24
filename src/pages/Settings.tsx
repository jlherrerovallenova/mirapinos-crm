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
    const ivaRate = 0.10;
    const priceIva = price * ivaRate;
    const totalConIva = price + priceIva;
    
    // Basado en el documento "Forma pago Mirapinos.pdf"
    const reserva = 6000;
    const diezPorCientoTotal = totalConIva * 0.10;
    const pagoContrato = diezPorCientoTotal - reserva;
    
    const diezPorCientoAplazado = totalConIva * 0.10;
    const cuotaMensual = diezPorCientoAplazado / 18;
    
    const ochentaPorCientoFinal = totalConIva * 0.80;

    return {
      totalConIva,
      reserva,
      pagoContrato,
      cuotaMensual,
      pagoFinal: ochentaPorCientoFinal
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

      setNotification({ show: true, message: 'Documento subido con éxito', type: 'success' });
      fetchDocuments();
    } catch (error) {
      setNotification({ show: true, message: 'Error al subir el documento', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (name: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return;
    try {
      const { error } = await supabase.storage.from('system-documents').remove([name]);
      if (error) throw error;
      setNotification({ show: true, message: 'Documento eliminado', type: 'success' });
      setDocuments(docs => docs.filter(d => d.name !== name));
    } catch (error) {
      setNotification({ show: true, message: 'Error al eliminar', type: 'error' });
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Configuración</h1>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Simulador */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-blue-700">
              <Calculator size={22} />
              <h2 className="text-xl font-bold">Cálculo de Forma de Pago</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">Precio Base de la Vivienda (sin IVA)</label>
              <div className="relative max-w-sm">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={basePrice || ''}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  placeholder="Introduce el precio..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-blue-50 rounded-xl focus:border-blue-400 outline-none text-lg transition-all"
                />
              </div>
            </div>

            {payments ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-500">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total (IVA Incl. 10%)</p>
                  <p className="text-xl font-bold text-gray-900">{payments.totalConIva.toLocaleString('es-ES')} €</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase">Firma Contrato (10%)</p>
                  <p className="text-xl font-bold text-blue-800">{payments.pagoContrato.toLocaleString('es-ES')} €</p>
                  <p className="text-[10px] text-blue-500">Ya descontados 6.000€ de reserva</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 uppercase">18 Cuotas Mensuales</p>
                  <p className="text-xl font-bold text-indigo-800">{payments.cuotaMensual.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-bold text-green-600 uppercase">Escritura Final (80%)</p>
                  <p className="text-xl font-bold text-green-800">{payments.pagoFinal.toLocaleString('es-ES')} €</p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center bg-blue-50/30 border-2 border-dashed border-blue-100 rounded-xl">
                <p className="text-blue-400 text-sm">Introduce un importe para desglosar los pagos según la promoción Mirapinos</p>
              </div>
            )}
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileCode size={20} className="text-blue-600" />
                Documentos del Sistema
              </h2>
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg cursor-pointer transition-all">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={18} />}
                <span className="text-sm font-bold">Subir Archivo</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            
            <div className="p-4 bg-gray-50/50">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Filtrar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {filteredDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDocs.map((doc, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between group shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="text-gray-400" size={18} />
                          <span className="text-xs font-medium truncate">{doc.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <a href={doc.url} download className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Download size={14} /></a>
                          <button onClick={() => handleDeleteDocument(doc.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm py-4">No hay archivos coincidentes</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Ajustes */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Ajustes Generales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Empresa</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                <span className="text-sm">Notificaciones Email</span>
                <input
                  type="checkbox"
                  checked={formData.email_notifications}
                  onChange={(e) => setFormData({...formData, email_notifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                <span className="text-sm">Asignación Automática</span>
                <input
                  type="checkbox"
                  checked={formData.auto_assignment}
                  onChange={(e) => setFormData({...formData, auto_assignment: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
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