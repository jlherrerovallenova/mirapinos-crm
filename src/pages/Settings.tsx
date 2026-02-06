// src/pages/Settings.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UploadCloud, FileText, Trash2, Download } from 'lucide-react';

export default function Settings() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    const { data } = await supabase.from('documents').select('*');
    if (data) setDocuments(data);
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    const filePath = `general/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('crm-docs').upload(filePath, file);
    
    if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('crm-docs').getPublicUrl(filePath);
        await supabase.from('documents').insert([{ name, category: 'General', url: publicUrl }]);
        fetchDocs();
        setFile(null);
        setName('');
        alert('Subido correctamente');
    } else {
        alert('Error subiendo: ' + uploadError.message);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
      if(!confirm('¿Borrar?')) return;
      await supabase.from('documents').delete().eq('id', id);
      fetchDocs();
  };

  return (
    <div className="p-8 animate-in fade-in">
       <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-widest text-sm mb-8">Configuración & Documentos</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm h-fit">
             <h3 className="font-bold flex items-center gap-2 mb-4"><UploadCloud className="text-emerald-500"/> Subir Archivo</h3>
             <form onSubmit={handleUpload} className="space-y-4">
                <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm" required />
                <input placeholder="Nombre visible" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl" required />
                <button disabled={uploading} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">
                    {uploading ? 'Subiendo...' : 'Guardar'}
                </button>
             </form>
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-50 bg-slate-50/50 font-bold text-slate-700">Documentos Disponibles</div>
             <div className="divide-y divide-slate-50">
                {documents.map(doc => (
                   <div key={doc.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FileText size={20}/></div>
                         <div><p className="font-bold text-slate-800">{doc.name}</p><p className="text-xs text-slate-400">{doc.category}</p></div>
                      </div>
                      <div className="flex gap-2">
                         <a href={doc.url} target="_blank" className="p-2 text-slate-400 hover:text-emerald-600"><Download size={18}/></a>
                         <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18}/></button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}