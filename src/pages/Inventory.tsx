// src/pages/Inventory.tsx
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Home,
  BedDouble,
  Bath,
  AlertTriangle,
  Filter,
  Copy,
  FileText,
  CreditCard
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import CreatePropertyModal from '../components/inventory/CreatePropertyModal';
import { useDialog } from '../context/DialogContext';

interface Property {
  id: string;
  modelo: string;
  numero_vivienda: string;
  superficie_parcela: number;
  superficie_util: number;
  superficie_construida: number;
  habitaciones: number;
  banos: number;
  precio: number;
  estado_vivienda?: string;
  created_at: string;
}

export default function Inventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const { showAlert } = useDialog();

  // Estados para el nuevo modal de confirmación de borrado
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formatSurface = (num: number) => {
    return new Intl.NumberFormat('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num || 0) + ' m²';
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('numero_vivienda', { ascending: true });

      if (error) throw error;

      // Orden numérico manual para evitar el orden alfabético (1, 10, 2...)
      const sortedData = (data as Property[] || []).sort((a, b) => {
        const numA = parseInt(a.numero_vivienda);
        const numB = parseInt(b.numero_vivienda);
        
        // Si ambos son números, comparar numéricamente
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // Si no, usar comparación de strings (como respaldo para letras)
        return a.numero_vivienda.localeCompare(b.numero_vivienda, undefined, { numeric: true });
      });

      setProperties(sortedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', propertyToDelete.id);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      await showAlert({ title: 'Error', message: 'Error al intentar eliminar el registro.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = (property: Property) => {
    // Para clonar, pasamos los datos pero SIN el ID
    const { id, created_at, ...cloneData } = property;
    setEditingProperty(cloneData as any);
    setIsModalOpen(true);
  };

  const filteredProperties = properties.filter(p => {
    const modelMatch = (p.modelo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const numberMatch = (p.numero_vivienda || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = modelMatch || numberMatch;
    const matchesState = stateFilter === '' || p.estado_vivienda === stateFilter;
    return matchesSearch && matchesState;
  });

  const handleExportPDF = async () => {
    if (filteredProperties.length === 0) return;

    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Función para cargar imagen de forma asíncrona y convertirla a base64 preservando calidad y fondo
      const getBase64Image = (url: string): Promise<{ data: string, width: number, height: number } | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // 1. Rellenar con blanco (para PNGs transparentes)
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              // 2. Dibujar imagen
              ctx.drawImage(img, 0, 0);
              // 3. Exportar como JPEG (máxima compatibilidad)
              const dataURL = canvas.toDataURL('image/jpeg', 0.95);
              resolve({ data: dataURL, width: img.width, height: img.height });
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const logoInfo = await getBase64Image('/logo-mirapinos.png');
      
      // Función para añadir cabecera premium
      const addHeader = () => {
        // Franja superior blanca para el logotipo
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 297, 20, 'F');
        
        // Líneas decorativas inferiores
        doc.setFillColor(15, 23, 42); // Slate-900
        doc.rect(0, 20, 297, 0.5, 'F');
        
        doc.setFillColor(16, 185, 129); // Emerald-500
        doc.rect(0, 20.5, 297, 1.5, 'F');

        // Logo si existe
        if (logoInfo) {
          const targetHeight = 10; // Altura fija deseada en mm
          const aspectRatio = logoInfo.width / logoInfo.height;
          const targetWidth = targetHeight * aspectRatio;
          
          // Centrado vertical en la franja de 20mm
          doc.addImage(logoInfo.data, 'JPEG', 14, (20 - targetHeight) / 2, targetWidth, targetHeight);
        } else {
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(10);
          doc.text('MIRAPINOS', 14, 12);
        }

        // Título y Subtítulo
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('CATÁLOGO DE VIVIENDAS', 14, 30);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const statusText = stateFilter === '' ? 'TODOS LOS ESTADOS' : stateFilter.toUpperCase();
        doc.text(`INVENTARIO ACTUAL - MODO: ${statusText}`, 14, 37);

        // Fecha y página (derecha)
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 240, 30);
        doc.text(`Total registros: ${filteredProperties.length}`, 240, 35);
      };

      addHeader();

    // Preparar datos
    const tableColumn = ["№", "MODELO", "PARCELA", "ÚTIL", "HAB/BAÑOS", "PRECIO", "ESTADO"];
    const tableRows = filteredProperties.map(p => [
      p.numero_vivienda,
      p.modelo,
      formatSurface(p.superficie_parcela),
      formatSurface(p.superficie_util),
      `${p.habitaciones} / ${p.banos}`,
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p.precio),
      (p.estado_vivienda || 'DISPONIBLE').toUpperCase()
    ]);

    // Generar tabla con estilo corporativo
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129], 
        textColor: 255, 
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 4,
        valign: 'middle',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 15 },
        1: { fontStyle: 'bold', cellWidth: 35 },
        6: { fontStyle: 'bold', textColor: [15, 23, 42] }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        // Colorear celda de estado
        if (data.section === 'body' && data.column.index === 7) {
          const status = data.cell.raw as string;
          if (status === 'DISPONIBLE') data.cell.styles.textColor = [16, 185, 129];
          if (status === 'RESERVADA') data.cell.styles.textColor = [245, 158, 11];
          if (['BLOQUEADA', 'NO DISPONIBLE'].includes(status)) data.cell.styles.textColor = [239, 68, 68];
        }
      }
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 270, 200);
    }

    // Generar el PDF y abrirlo en una nueva pestaña (más fiable para depuración y visualización)
    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
    
    // También guardarlo por si el usuario lo prefiere
    doc.save(`listado_viviendas_${stateFilter || 'todas'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      await showAlert({ 
        title: 'Error de Exportación', 
        message: 'No se pudo generar el documento PDF correctamente.' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePaymentForm = async (property: Property) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const getBase64Image = (url: string): Promise<{ data: string, width: number, height: number } | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              resolve({
                data: canvas.toDataURL('image/jpeg', 0.95),
                width: img.width,
                height: img.height
              });
            } else resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const logoMirapinos = await getBase64Image('/logo-mirapinos.png');

      const margin = 15;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);
      
      // Colores Premium
      const emeraldPrimary = [5, 150, 105];   // Emerald-600
      const slateDark = [15, 23, 42];         // Slate-900
      const grayLight = [241, 245, 249];      // Slate-100
      
      const formatCurrency = (num: number) => {
        const parts = num.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts.join(',') + ' \u20AC';
      };

      // --- CABECERA LIMPIA (FONDO BLANCO) ---
      
      // Logo centrado y ampliado (110mm)
      let logoYEnd = 45; // Valor por defecto si no hay logo
      if (logoMirapinos) {
        const maxWidth = 110;
        const ratio = logoMirapinos.height / logoMirapinos.width;
        const finalHeight = maxWidth * ratio;
        const logoY = 15; // Bajamos de 12 a 15
        
        doc.addImage(logoMirapinos.data, 'JPEG', (pageWidth/2) - (maxWidth/2), logoY, maxWidth, finalHeight);
        
        // Línea verde centrada debajo del logo
        logoYEnd = logoY + finalHeight + 8;
        doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
        doc.rect((pageWidth/2) - (maxWidth/2), logoYEnd, maxWidth, 1.5, 'F');
      }

      // --- TÍTULO PRINCIPAL (Bajamos para dejar espacio a la nueva línea) ---
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      const titleY = logoYEnd + 15;
      doc.text('PLAN DE PAGOS', margin, titleY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Vivienda No. ${property.numero_vivienda} | Modelo ${property.modelo} | ${new Date().toLocaleDateString('es-ES')}`, margin, titleY + 6);

      // --- RESUMEN DE IMPORTES (CARD) ---
      const summaryY = titleY + 15;
      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
      doc.roundedRect(margin, summaryY, contentWidth, 25, 3, 3, 'F');

      const basePrice = property.precio;
      const iva = basePrice * 0.1;
      const total = basePrice + iva;

      // Importe Base
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('IMPORTE BASE', margin + 10, summaryY + 10);
      doc.setFontSize(12);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(basePrice), margin + 10, summaryY + 17);

      // IVA
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      doc.text('IVA (10%)', margin + (contentWidth/3) + 10, summaryY + 10);
      doc.setFontSize(12);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(iva), margin + (contentWidth/3) + 10, summaryY + 17);

      // TOTAL DESTACADO
      doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
      doc.roundedRect(margin + (contentWidth * 2/3), summaryY, (contentWidth/3), 25, 3, 3, 'F');
      doc.setTextColor(255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL VIVIENDA', margin + contentWidth - 10, summaryY + 10, { align: 'right' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(total), margin + contentWidth - 10, summaryY + 18, { align: 'right' });

      // --- HITOS DE PAGO ---
      let currentY = 115;
      const renderPhase = (num: string, title: string, amount: number, subtitle: string, isLast = false, hideBreakdown = false) => {
        const cardHeight = hideBreakdown ? 25 : 35;
        
        // Círculo del número
        doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
        doc.circle(margin + 5, currentY + 5, 5, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(num, margin + 5, currentY + 6.5, { align: 'center' });

        // Título
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.setFontSize(14);
        doc.text(title, margin + 15, currentY + 6);

        // Si ocultamos el desglose, ponemos el total en la misma línea que el título
        if (hideBreakdown) {
          doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`TOTAL ${formatCurrency(amount)}`, margin + contentWidth, currentY + 6, { align: 'right' });
        }

        // Subtítulo
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(subtitle, margin + 15, currentY + 11);

        if (!hideBreakdown) {
          // Desglose Base / IVA / Total
          const breakdownY = currentY + 18;
          const colW = (contentWidth - 15) / 3;
          
          // Base
          doc.setFontSize(8);
          doc.text('BASE', margin + 15, breakdownY);
          doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(formatCurrency(amount / 1.1), margin + 15, breakdownY + 6);

          // IVA
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120);
          doc.text('IVA 10%', margin + 15 + colW, breakdownY);
          doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(formatCurrency(amount - (amount/1.1)), margin + 15 + colW, breakdownY + 6);

          // Subtotal Phase (Alineado a la derecha totalmente)
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120);
          doc.text('TOTAL', margin + contentWidth, breakdownY, { align: 'right' });
          doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(formatCurrency(amount), margin + contentWidth, breakdownY + 6, { align: 'right' });
        }

        // Línea divisoria si no es el último
        if (!isLast) {
          doc.setDrawColor(230, 230, 230);
          doc.line(margin + 5, currentY + cardHeight - 3, margin + contentWidth, currentY + cardHeight - 3);
        }
        
        currentY += cardHeight + 5;
      };

      const hito1 = 6000;
      const hito2 = (total * 0.1) - 6000;
      const hito3 = (total * 0.1);
      const hito4 = (total * 0.8);

      renderPhase('1', 'RESERVA DE VIVIENDA', hito1, 'Pago inicial para bloqueo de unidad en inventario.', false, true);
      renderPhase('2', 'FIRMA DE CONTRATO', hito2, 'A la firma del contrato privado de compraventa (10% - Reserva).');
      
      // Especial para cuotas
      const cuota = hito3 / 24;
      renderPhase('3', 'PAGOS APLAZADOS', hito3, `24 Cuotas mensuales de ${formatCurrency(cuota)} cada una.`);
      
      renderPhase('4', 'ESCRITURA PÚBLICA', hito4, 'Entrega de llaves y firma ante notario (80% restante).', true);

      // --- PIE DE PÁGINA ---
      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
      doc.rect(0, 265, pageWidth, 32, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      const footerMsg = "Este documento es meramente informativo y no constituye una oferta contractual oficial.\nTodos los importes incluyen IVA al 10% sujeto a variaciones legales.";
      doc.text(footerMsg, pageWidth / 2, 275, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
      doc.text("MIRAPINOS CRM | GESTIÓN PROFESIONAL", pageWidth / 2, 285, { align: 'center' });

      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating payment form:', error);
      await showAlert({ title: 'Error', message: 'No se pudo generar la forma de pago.' });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario de Viviendas</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestión profesional del catálogo de activos.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          <button
            onClick={handleExportPDF}
            disabled={loading || isExporting || filteredProperties.length === 0}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-3 rounded-2xl font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 min-w-[150px]"
            title="Descargar Listado PDF"
          >
            {isExporting ? <Loader2 className="animate-spin text-emerald-600" size={20} /> : <FileText size={20} className="text-red-500" />}
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
          <button
            onClick={() => {
              setEditingProperty(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus size={20} />
            Añadir Propiedad
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por modelo o número de vivienda..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full pl-12 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer text-slate-700 font-medium font-bold"
          >
            <option value="">Cualquier Estado</option>
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="NO DISPONIBLE">NO DISPONIBLE</option>
            <option value="BLOQUEADA">BLOQUEADA</option>
            <option value="RESERVADA">RESERVADA</option>
            <option value="CONTRATO CV">CONTRATO CV</option>
            <option value="ESCRITURADA">ESCRITURADA</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
            <p className="text-slate-400 font-medium">Cargando inventario...</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Vivienda</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Modelo</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Parcela</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Útil</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Hab / Baños</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Precio</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          {property.numero_vivienda}
                        </div>
                        <span className="font-bold text-slate-900">Urb. Mirapinos</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-600 text-center">{property.modelo}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500 text-center">{formatSurface(property.superficie_parcela)}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500 text-center">{formatSurface(property.superficie_util)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <BedDouble size={16} />
                          <span className="font-bold">{property.habitaciones}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath size={16} />
                          <span className="font-bold">{property.banos}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-sm">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(property.precio)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        property.estado_vivienda === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-700' :
                        property.estado_vivienda === 'RESERVADA' ? 'bg-amber-100 text-amber-700' :
                        property.estado_vivienda === 'BLOQUEADA' || property.estado_vivienda === 'NO DISPONIBLE' ? 'bg-red-100 text-red-700' :
                        property.estado_vivienda === 'CONTRATO CV' ? 'bg-blue-100 text-blue-700' :
                        property.estado_vivienda === 'ESCRITURADA' ? 'bg-slate-100 text-slate-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {property.estado_vivienda || 'DISPONIBLE'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleGeneratePaymentForm(property)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Generar Forma de Pago"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button
                          onClick={() => handleClone(property)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Clonar Vivienda"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProperty(property);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setPropertyToDelete(property)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <Home size={40} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">No se encontraron propiedades</p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Borrado Profesional */}
      {propertyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">¿Eliminar vivienda?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Estás a punto de borrar la vivienda <span className="text-slate-900 font-bold">{propertyToDelete.numero_vivienda}</span> (Modelo {propertyToDelete.modelo}). Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPropertyToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CreatePropertyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            fetchProperties();
            setIsModalOpen(false);
          }}
          initialData={editingProperty}
        />
      )}
    </div>
  );
}