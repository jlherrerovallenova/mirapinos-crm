import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Property } from '../api/inventoryService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export default function MortgageSimulatorModal({ isOpen, onClose, property }: Props) {
  const [interestRate, setInterestRate] = useState(3.5);
  const [years, setYears] = useState(30);
  const [downPayment, setDownPayment] = useState(20); // Percentage

  if (!isOpen) return null;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(num || 0);
  };

  const handleExportMortgagePDF = async () => {
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

      const principal = property.precio * (1 - downPayment / 100);
      const monthlyRate = (interestRate / 100) / 12;
      const numberOfPayments = years * 12;
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
          ['Entrada Solicitada', formatLocalCurrency(property.precio * (downPayment / 100))],
          ['Capital a Financiar', formatLocalCurrency(principal)],
          ['Tipo Interés Aplicado', `${interestRate.toFixed(2)} %`],
          ['Plazo del Préstamo', `${years} años`],
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

      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('GASTOS ASOCIADOS A LA OPERACIÓN', margin, currentY);

      currentY += 10;
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

      const fileName = `Simulacion_hipotecaria_Mirapinos_Chalet_n_${property.numero_vivienda}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error(e);
    }
  };

  const principal = property.precio * (1 - downPayment / 100);
  const monthlyRate = (interestRate / 100) / 12;
  const numberOfPayments = years * 12;
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative">
          <div>
            <h3 className="text-xl font-display font-bold">Simulador Hipotecario</h3>
            <p className="text-emerald-400 text-xs font-semibold">Chalet #{property.numero_vivienda} ({property.modelo})</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">PRECIO DEL CHALET</label>
            <div className="p-4 bg-slate-50 rounded-2xl font-display font-bold text-lg text-slate-800 border border-slate-100">
              {formatCurrency(property.precio)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">ENTRADA ({downPayment}%)</label>
              <input 
                type="number" 
                value={downPayment}
                onChange={(e) => setDownPayment(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">PLAZO (AÑOS)</label>
              <input 
                type="number" 
                value={years}
                onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">TIPO DE INTERÉS (%)</label>
            <input 
              type="number" 
              step="0.05"
              value={interestRate}
              onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Results Summary Box */}
          <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Capital a financiar:</span>
              <span className="text-slate-900 font-bold">{formatCurrency(property.precio * (1 - downPayment/100))}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Entrada aportada:</span>
              <span className="text-slate-900 font-bold">{formatCurrency(property.precio * (downPayment/100))}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Gastos compraventa est. (AJD + Notaría...):</span>
              <span className="text-slate-900 font-bold">{formatCurrency((property.precio * 0.023) + 450)}</span>
            </div>
            
            <div className="border-t border-emerald-100/70 pt-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mb-1">Mensualidad Estimada</span>
              <span className="text-2xl font-display font-black text-emerald-600">{formatCurrency(monthlyPayment)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button 
            onClick={handleExportMortgagePDF}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-sm font-display"
          >
            <FileText size={18} />
            Generar PDF Informativo
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
