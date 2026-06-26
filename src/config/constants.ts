// src/config/constants.ts

// --- LEADS ---
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  VISITING: 'visiting',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED: 'closed',
  LOST: 'lost',
} as const;

export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LEAD_STATUS.NEW]: 'Nuevo',
  [LEAD_STATUS.CONTACTED]: 'Contactado',
  [LEAD_STATUS.QUALIFIED]: 'Cualificado',
  [LEAD_STATUS.VISITING]: 'Visitando',
  [LEAD_STATUS.PROPOSAL]: 'Propuesta',
  [LEAD_STATUS.NEGOTIATION]: 'Negociación',
  [LEAD_STATUS.CLOSED]: 'Ganado',
  [LEAD_STATUS.LOST]: 'Perdido',
};

export const LEAD_STATUS_STAGE_BADGES: Record<string, { label: string; class: string }> = {
  [LEAD_STATUS.NEW]: { label: 'Nuevo', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  [LEAD_STATUS.CONTACTED]: { label: 'Contactado', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  [LEAD_STATUS.QUALIFIED]: { label: 'Cualificado', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  [LEAD_STATUS.VISITING]: { label: 'Visitando', class: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  [LEAD_STATUS.PROPOSAL]: { label: 'Propuesta', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  [LEAD_STATUS.NEGOTIATION]: { label: 'Negociación', class: 'bg-orange-50 text-orange-700 border-orange-200' },
  [LEAD_STATUS.CLOSED]: { label: 'Ganado', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  [LEAD_STATUS.LOST]: { label: 'Perdido', class: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const LEAD_STATUS_DETAILS: Record<string, { dot: string; pill: string; label: string }> = {
  [LEAD_STATUS.NEW]: { dot: 'bg-blue-400', pill: 'bg-blue-900/40 text-blue-200 border border-blue-700/50', label: 'Nuevo' },
  [LEAD_STATUS.CONTACTED]: { dot: 'bg-purple-400', pill: 'bg-purple-900/40 text-purple-200 border border-purple-700/50', label: 'Contactado' },
  [LEAD_STATUS.QUALIFIED]: { dot: 'bg-emerald-400', pill: 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/50', label: 'Cualificado' },
  [LEAD_STATUS.VISITING]: { dot: 'bg-cyan-400', pill: 'bg-cyan-900/40 text-cyan-200 border border-cyan-700/50', label: 'Visitando' },
  [LEAD_STATUS.PROPOSAL]: { dot: 'bg-amber-400', pill: 'bg-amber-900/40 text-amber-200 border border-amber-700/50', label: 'Propuesta' },
  [LEAD_STATUS.NEGOTIATION]: { dot: 'bg-orange-400', pill: 'bg-orange-900/40 text-orange-200 border border-orange-700/50', label: 'Negociación' },
  [LEAD_STATUS.CLOSED]: { dot: 'bg-indigo-400', pill: 'bg-indigo-900/40 text-indigo-200 border border-indigo-700/50', label: 'Venta realizada' },
  [LEAD_STATUS.LOST]: { dot: 'bg-red-400', pill: 'bg-red-900/40 text-red-200 border border-red-700/50', label: 'Perdido' },
};

// --- INVENTORY ---
export const PROPERTY_STATUS = {
  DISPONIBLE: 'DISPONIBLE',
  NO_DISPONIBLE: 'NO DISPONIBLE',
  BLOQUEADA: 'BLOQUEADA',
  RESERVADA: 'RESERVADA',
  CONTRATO_CV: 'CONTRATO CV',
  ESCRITURADA: 'ESCRITURADA',
} as const;

export type PropertyStatus = typeof PROPERTY_STATUS[keyof typeof PROPERTY_STATUS];

export const PROPERTY_MODELS = ['OLIVO', 'ARCE', 'PARCELA'] as const;
export type PropertyModel = typeof PROPERTY_MODELS[number];

// --- DOCUMENTS ---
export const DOCUMENT_CATEGORIES = ['Documentos Olivo', 'Documentos Arce', 'Parcelas', 'Renders-Fotos'] as const;
export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];
