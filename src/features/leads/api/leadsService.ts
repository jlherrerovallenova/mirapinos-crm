import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export interface FetchLeadsParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string;
  sourceFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const leadsService = {
  async fetchLeads(params: FetchLeadsParams) {
    const { page, pageSize, searchTerm, statusFilter, sourceFilter, sortField = 'created_at', sortDirection = 'desc' } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    query = query.order(sortField as any, { ascending: sortDirection === 'asc' });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    if (sourceFilter) {
      query = query.ilike('source', `%${sourceFilter}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return {
      leads: (data || []) as Lead[],
      totalCount: count || 0
    };
  },

  async updateLead(id: string, updates: LeadUpdate) {
    const { data, error } = await (supabase as any)
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  async createLead(newLead: LeadInsert) {
    const { data, error } = await (supabase as any)
      .from('leads')
      .insert([newLead])
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  async deleteLead(id: string) {
    const { error } = await (supabase as any)
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async checkEmailDuplicate(email: string) {
    if (!email) return false;
    const { data, error } = await supabase.from('leads').select('id').eq('email', email).limit(1);
    if (error) throw error;
    return data && data.length > 0;
  },

  async checkPhoneDuplicate(phone: string) {
    if (!phone) return false;
    const { data, error } = await supabase.from('leads').select('id').eq('phone', phone).limit(1);
    if (error) throw error;
    return data && data.length > 0;
  }
};
