// src/pages/Inventory.tsx
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Loader2,
  Home,
  BedDouble,
  Bath,
  Filter,
  FileText,
  CreditCard,
  Calculator,
  X
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

  const [isExporting, setIsExporting] = useState(false);
  const [isMortgageModalOpen, setIsMortgageModalOpen] = useState(false);
  const [selectedPropertyForMortgage, setSelectedPropertyForMortgage] = useState<Property | null>(null);

  // Estados para el Simulador
  const [interestRate, setInterestRate] = useState(3.5);
  const [years, setYears] = useState(30);
  const [downPayment, setDownPayment] = useState(20); // Porcentaje

  const formatSurface = (num: number) => {
    return new Intl.NumberFormat('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num || 0);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(num || 0);
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

      // Orden numérico manual
      const sortedData = (data as Property[] || []).sort((a, b) => {
        const numA = parseInt(a.numero_vivienda);
        const numB = parseInt(b.numero_vivienda);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.numero_vivienda.localeCompare(b.numero_vivienda, undefined, { numeric: true });
      });

      setProperties(sortedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
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
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const getBase64Image = (url: string): Promise<{ data: string, width: number, height: number } | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              resolve({ data: canvas.toDataURL('image/jpeg', 0.95), width: img.width, height: img.height });
            } else resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const logoInfo = await getBase64Image('/logo-mirapinos.png');
      const addHeader = () => {
        doc.setFillColor(255, 255, 255); doc.rect(0, 0, 297, 20, 'F');
        doc.setFillColor(15, 23, 42); doc.rect(0, 20, 297, 0.5, 'F');
        doc.setFillColor(16, 185, 129); doc.rect(0, 20.5, 297, 1.5, 'F');
        if (logoInfo) {
          const targetHeight = 10; const aspectRatio = logoInfo.width / logoInfo.height;
          const targetWidth = targetHeight * aspectRatio;
          doc.addImage(logoInfo.data, 'JPEG', 14, (20 - targetHeight) / 2, targetWidth, targetHeight);
        }
        doc.setTextColor(15, 23, 42); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('CATÁLOGO DE VIVIENDAS', 14, 30);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
        doc.text(`INVENTARIO ACTUAL - MODO: ${stateFilter.toUpperCase() || 'TODOS'}`, 14, 37);
      };
      addHeader();
      const tableColumn = ["№", "MODELO", "PARCELA (m²)", "ÚTIL (m²)", "HAB/BAÑOS", "PRECIO", "ESTADO"];
      const tableRows = filteredProperties.map(p => [
        p.numero_vivienda, p.modelo, formatSurface(p.superficie_parcela), formatSurface(p.superficie_util),
        `${p.habitaciones} / ${p.banos}`, formatCurrency(p.precio), (p.estado_vivienda || 'DISPONIBLE').toUpperCase()
      ]);
      autoTable(doc, {
        head: [tableColumn], body: tableRows, startY: 45, theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 11, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, cellPadding: 4, valign: 'middle', halign: 'center' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 15 }, 1: { fontStyle: 'bold', cellWidth: 35 } },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      const pdfOutput = doc.output('bloburl');
      window.open(pdfOutput, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      await showAlert({ title: 'Error', message: 'No se pudo generar el documento PDF.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePaymentForm = async (property: Property) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const getBase64Image = (url: string): Promise<{ data: string, width: number, height: number } | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              resolve({ data: canvas.toDataURL('image/jpeg', 0.95), width: img.width, height: img.height });
            } else resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const logoMirapinos = await getBase64Image('/logo-mirapinos.png');
      const margin = 15; const pageWidth = 210; const contentWidth = pageWidth - (margin * 2);
      const emeraldPrimary = [5, 150, 105]; const slateDark = [15, 23, 42]; const grayLight = [241, 245, 249];
      
      const formatLocalCurrency = (num: number) => {
        const parts = num.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts.join(',') + ' \u20AC';
      };

      let logoYEnd = 45;
      if (logoMirapinos) {
        const maxWidth = 110; const ratio = logoMirapinos.height / logoMirapinos.width;
        const finalHeight = maxWidth * ratio; const logoY = 15;
        doc.addImage(logoMirapinos.data, 'JPEG', (pageWidth/2) - (maxWidth/2), logoY, maxWidth, finalHeight);
        logoYEnd = logoY + finalHeight + 8;
        doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
        doc.rect((pageWidth/2) - (maxWidth/2), logoYEnd, maxWidth, 1.5, 'F');
      }

      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFontSize(26); doc.setFont('helvetica', 'bold');
      const titleY = logoYEnd + 15;
      doc.text('PLAN DE PAGOS', margin, titleY);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
      doc.text(`Vivienda No. ${property.numero_vivienda} | Modelo ${property.modelo} | ${new Date().toLocaleDateString('es-ES')}`, margin, titleY + 6);

      const summaryY = titleY + 15;
      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
      doc.roundedRect(margin, summaryY, contentWidth, 25, 3, 3, 'F');

      const basePrice = property.precio; const iva = basePrice * 0.1; const ajd = basePrice * 0.015; const total = basePrice + iva;
      const colWSummary = contentWidth / 3;

      doc.setFontSize(9); doc.setTextColor(120); doc.text('IMPORTE BASE', margin + 8, summaryY + 10);
      doc.setFontSize(12); doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]); doc.setFont('helvetica', 'bold');
      doc.text(formatLocalCurrency(basePrice), margin + 8, summaryY + 17);

      doc.setFontSize(9); doc.setTextColor(120); doc.setFont('helvetica', 'normal');
      doc.text('IVA (10%)', margin + colWSummary + 8, summaryY + 10);
      doc.setFontSize(12); doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]); doc.setFont('helvetica', 'bold');
      doc.text(formatLocalCurrency(iva), margin + colWSummary + 8, summaryY + 17);

      doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
      doc.roundedRect(margin + (colWSummary * 2), summaryY, colWSummary, 25, 3, 3, 'F');
      doc.setTextColor(255); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('TOTAL VIVIENDA', margin + contentWidth - 10, summaryY + 10, { align: 'right' });
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text(formatLocalCurrency(total), margin + contentWidth - 10, summaryY + 18, { align: 'right' });

      doc.setFontSize(8); doc.setTextColor(150); doc.setFont('helvetica', 'italic');
      doc.text(`* El impuesto de AJD (1,5% s/base) no está incluido: ${formatLocalCurrency(ajd)}`, margin, summaryY + 30);

      let currentY = 115;
      const renderPhase = (num: string, title: string, amount: number, subtitle: string, isLast = false, hideBreakdown = false) => {
        const cardHeight = hideBreakdown ? 25 : 35;
        doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]); doc.circle(margin + 5, currentY + 5, 5, 'F');
        doc.setTextColor(255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(num, margin + 5, currentY + 6.5, { align: 'center' });
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]); doc.setFontSize(14); doc.text(title, margin + 15, currentY + 6);
        if (hideBreakdown) {
          doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
          doc.text(`TOTAL ${formatLocalCurrency(amount)}`, margin + contentWidth, currentY + 6, { align: 'right' });
        }
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120); doc.text(subtitle, margin + 15, currentY + 11);
        if (!hideBreakdown) {
          const breakdownY = currentY + 18; const colW = (contentWidth - 15) / 3;
          doc.setFontSize(8); doc.text('BASE', margin + 15, breakdownY);
          doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]); doc.setFont('helvetica', 'bold');
          doc.text(formatLocalCurrency(amount / 1.1), margin + 15, breakdownY + 6);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(120); doc.text('IVA 10%', margin + 15 + colW, breakdownY);
          doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]); doc.setFont('helvetica', 'bold');
          doc.text(formatLocalCurrency(amount - (amount/1.1)), margin + 15 + colW, breakdownY + 6);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(120); doc.text('TOTAL', margin + contentWidth, breakdownY, { align: 'right' });
          doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
          doc.text(formatLocalCurrency(amount), margin + contentWidth, breakdownY + 6, { align: 'right' });
        }
        if (!isLast) { doc.setDrawColor(230, 230, 230); doc.line(margin + 5, currentY + cardHeight - 3, margin + contentWidth, currentY + cardHeight - 3); }
        currentY += cardHeight + 5;
      };

      const hito1 = 6000; const hito2 = (total * 0.1) - 6000; const hito3 = (total * 0.1); const hito4 = (total * 0.8);
      renderPhase('1', 'RESERVA DE VIVIENDA', hito1, 'Pago inicial para bloqueo de vivienda', false, true);
      renderPhase('2', 'FIRMA DE CONTRATO', hito2, 'A la firma del contrato privado (10% - Reserva).');
      const cuota = hito3 / 24; renderPhase('3', 'PAGOS APLAZADOS', hito3, `24 Cuotas mensuales de ${formatLocalCurrency(cuota)} cada una.`);
      renderPhase('4', 'ESCRITURA PÚBLICA', hito4, 'Entrega de llaves y firma ante notario (80%).', true);

      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]); doc.rect(0, 265, pageWidth, 32, 'F');
      doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'normal');
      doc.text("Este documento es informativo. Incluye IVA al 10%.", pageWidth / 2, 275, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
      doc.text("FINCA MIRAPINOS - www.mirapinos.com", pageWidth / 2, 285, { align: 'center' });

      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Error generating payment form:', error);
      await showAlert({ title: 'Error', message: 'No se pudo generar la forma de pago.' });
    }
  };

  const handleExportMortgagePDF = async (property: Property, rate: number, termYears: number, downPaymentPct: number) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      const emeraldPrimary = [5, 150, 105];
      const slateDark = [15, 23, 42];
      const slateLight = [100, 116, 139];
      const grayUltraLight = [248, 250, 252];

      const formatLocalCurrency = (num: number) => new Intl.NumberFormat('es-ES', { 
        style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(num || 0);

      const addHeaderStyle = (title: string, subtitle: string) => {
        doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setTextColor(255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160);
        doc.text(subtitle, margin, 34);
        doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
        doc.rect(margin, 38, 40, 1.5, 'F');
      };

      const principal = property.precio * (1 - downPaymentPct / 100);
      const monthlyRate = (rate / 100) / 12;
      const numberOfPayments = termYears * 12;
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      // --- PÁGINA 1: HIPOTECA ---
      addHeaderStyle('PLAN DE FINANCIACIÓN', `SIMULACIÓN HIPOTECARIA | Viv. No. ${property.numero_vivienda} | ${new Date().toLocaleDateString('es-ES')}`);
      let currentY = 60;

      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('DATOS DE LA OPERACIÓN', margin, currentY);
      currentY += 10;
      autoTable(doc, {
        startY: currentY,
        head: [['Parámetro', 'Valor']],
        body: [
          ['Precio Venta', formatLocalCurrency(property.precio)],
          ['Entrada Solicitada', formatLocalCurrency(property.precio * (downPaymentPct / 100))],
          ['Capital a Financiar', formatLocalCurrency(principal)],
          ['Tipo Interés Aplicado', `${rate.toFixed(2)} %`],
          ['Plazo del Préstamo', `${termYears} años`],
        ],
        theme: 'plain', styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        didParseCell: (data) => {
          if (data.section === 'head' && data.column.index === 1) {
            data.cell.styles.halign = 'right';
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFillColor(grayUltraLight[0], grayUltraLight[1], grayUltraLight[2]);
      doc.roundedRect(margin, currentY, contentWidth, 35, 4, 4, 'FD');
      doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
      doc.setFontSize(10); doc.text('MENSUALIDAD ESTIMADA', pageWidth / 2, currentY + 12, { align: 'center' });
      doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
      doc.setFontSize(28); doc.text(formatLocalCurrency(monthlyPayment), pageWidth / 2, currentY + 26, { align: 'center' });

      doc.setFontSize(8); doc.setTextColor(150);
      doc.text("Página 1 de 2 | Documento de carácter informativo.", pageWidth / 2, pageHeight - 10, { align: 'center' });

      // --- PÁGINA 2: GASTOS DE COMPRAVENTA ---
      doc.addPage();
      addHeaderStyle('GASTOS DE COMPRAVENTA', 'Resumen de impuestos y gastos asociados a la adquisición.');
      
      currentY = 60;
      const ajdAmount = property.precio * 0.015;
      const notaryAmount = property.precio * 0.005;
      const registryAmount = property.precio * 0.003;
      const gestoriaAmount = 450;
      const tasacionAmount = 400;
      const totalExpenses = ajdAmount + notaryAmount + registryAmount + gestoriaAmount + tasacionAmount;

      autoTable(doc, {
        startY: currentY,
        head: [['Concepto', 'Base / Tipo', 'Importe']],
        body: [
          ['I.T.P / A.J.D', '1.50 %', formatLocalCurrency(ajdAmount)],
          ['Notaría (Estimado)', 'Aranceles', formatLocalCurrency(notaryAmount)],
          ['Registro de la Propiedad', 'Aranceles', formatLocalCurrency(registryAmount)],
          ['Gestoría Técnica', 'Fijo', formatLocalCurrency(gestoriaAmount)],
          ['Tasación Oficial', 'Fijo Est.', formatLocalCurrency(tasacionAmount)],
        ],
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.section === 'head' && data.column.index === 2) {
            data.cell.styles.halign = 'right';
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F');
      doc.setTextColor(255); doc.setFontSize(12);
      doc.text('TOTAL GASTOS COMPRAVENTA (ESTIMADOS)', margin + 8, currentY + 12.5);
      doc.setFontSize(14); doc.text(formatLocalCurrency(totalExpenses), margin + contentWidth - 8, currentY + 12.5, { align: 'right' });

      doc.setFontSize(8); doc.setTextColor(150);
      doc.text("Página 2 de 2 | FINCA MIRAPINOS - www.mirapinos.com", pageWidth / 2, pageHeight - 10, { align: 'center' });

      window.open(doc.output('bloburl'), '_blank');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
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
          >
            {isExporting ? <Loader2 className="animate-spin text-emerald-600" size={20} /> : <FileText size={20} className="text-red-500" />}
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
          <button
            onClick={() => { setEditingProperty(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus size={20} /> Añadir Propiedad
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por modelo o número de vivienda..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none transition-all font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full pl-12 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none cursor-pointer text-slate-700 font-bold"
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
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-24">Viv.</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-32">Modelo</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Parcela / Útil</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Hab / Baños</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-32">Precio</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-40">Estado</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-40">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 text-center font-bold text-slate-700">{property.numero_vivienda}</td>
                    <td className="px-6 py-5 font-semibold text-slate-600 text-center">{property.modelo}</td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-800">
                      {formatSurface(property.superficie_parcela)} / {formatSurface(property.superficie_util)} <span className="text-[10px] normal-case text-slate-400">m²</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1.5"><BedDouble size={16} /><span className="font-bold">{property.habitaciones}</span></div>
                        <div className="flex items-center gap-1.5"><Bath size={16} /><span className="font-bold">{property.banos}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center"><span className="inline-flex px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-sm">{formatCurrency(property.precio)}</span></td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        property.estado_vivienda === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-700' :
                        property.estado_vivienda === 'RESERVADA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>{property.estado_vivienda || 'DISPONIBLE'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleGeneratePaymentForm(property)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Forma de Pago"><CreditCard size={18} /></button>
                        <button onClick={() => { setSelectedPropertyForMortgage(property); setIsMortgageModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Simulator"><Calculator size={18} /></button>
                        <button onClick={() => { setEditingProperty(property); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center"><Home size={40} className="text-slate-200 mb-4" /><p className="text-slate-500 font-bold">No se encontraron propiedades</p></div>
        )}
      </div>

      {isModalOpen && (
        <CreatePropertyModal
          isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProperty(null); }}
          onSuccess={() => { fetchProperties(); setIsModalOpen(false); }}
          initialData={editingProperty}
        />
      )}

      {isMortgageModalOpen && selectedPropertyForMortgage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
              <div><h3 className="text-xl font-bold">Simulador Hipotecario</h3><p className="text-emerald-50 text-xs">Viv. #{selectedPropertyForMortgage.numero_vivienda}</p></div>
              <button onClick={() => setIsMortgageModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-[10px] font-black text-slate-400 block mb-1">PRECIO</label><div className="p-3 bg-slate-50 rounded-2xl font-bold text-slate-800">{formatCurrency(selectedPropertyForMortgage.precio)}</div></div>
                <div><label className="text-[10px] font-black text-slate-400 block mb-1">ENTRADA (%)</label><input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full p-3 border rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20" /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-[10px] font-black text-slate-400 block mb-1">INTERÉS (%)</label><input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full p-3 border rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20" /></div>
                <div><label className="text-[10px] font-black text-slate-400 block mb-1">PLAZO (AÑOS)</label><input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full p-3 border rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20" /></div>
              </div>
              <div className="pt-6 border-t flex flex-col items-center">
                <p className="text-slate-500 text-sm mb-2">Cuota mensual estimada</p>
                <div className="bg-emerald-50 px-8 py-4 rounded-3xl text-4xl font-black text-emerald-700">
                  {(() => {
                    const principal = selectedPropertyForMortgage.precio * (1 - downPayment / 100);
                    const monthlyRate = (interestRate / 100) / 12;
                    const numberOfPayments = years * 12;
                    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
                    return formatCurrency(monthlyPayment || 0);
                  })()}
                </div>
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl w-full space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Capital a financiar:</span>
                    <span className="text-slate-900">{formatCurrency(selectedPropertyForMortgage.precio * (1 - downPayment/100))}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Entrada ({downPayment}%):</span>
                    <span className="text-slate-900">{formatCurrency(selectedPropertyForMortgage.precio * (downPayment/100))}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                      <span>Notaría, Registro, Gestoría (est.):</span>
                      <span>{formatCurrency((selectedPropertyForMortgage.precio * 0.0065) + 450)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => handleExportMortgagePDF(selectedPropertyForMortgage, interestRate, years, downPayment)} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 flex items-center justify-center gap-2"><FileText size={20} />Exportar PDF Profesional</button>
              <button onClick={() => setIsMortgageModalOpen(false)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}