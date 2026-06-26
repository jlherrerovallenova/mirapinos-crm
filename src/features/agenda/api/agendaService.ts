import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

export type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null;
};

export interface FetchAgendaParams {
  filterStatus?: 'all' | 'pending' | 'completed';
  selectedAgentId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  viewMode?: 'list' | 'calendar';
  currentDate?: Date;
  page?: number;
  itemsPerPage?: number;
  leadId?: string;
}

export const agendaService = {
  async fetchItems(params: FetchAgendaParams) {
    let query = supabase
      .from('agenda')
      .select('*, leads(name)', { count: 'exact' })
      .order('due_date', { ascending: true });

    if (params.filterStatus === 'pending') query = query.eq('completed', false);
    if (params.filterStatus === 'completed') query = query.eq('completed', true);

    if (params.leadId) {
      query = query.eq('lead_id', params.leadId);
    } else {
      if (params.isAdmin) {
        if (params.selectedAgentId && params.selectedAgentId !== 'all') {
          query = query.eq('user_id', params.selectedAgentId);
        }
      } else {
        if (params.currentUserId) {
          query = query.eq('user_id', params.currentUserId);
        }
      }
    }

    if (params.viewMode === 'calendar' && params.currentDate) {
      const year = params.currentDate.getFullYear();
      const month = params.currentDate.getMonth();
      const firstDay = new Date(year, month - 1, 20).toISOString();
      const lastDay = new Date(year, month + 1, 10).toISOString();
      query = query.gte('due_date', firstDay).lte('due_date', lastDay);
    } else if (params.page && params.itemsPerPage) {
      const from = (params.page - 1) * params.itemsPerPage;
      const to = from + params.itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const formattedData = (data || []).map(item => {
      const itemWithLeads = item as typeof item & {
        leads: { name: string } | { name: string }[] | null;
      };
      const leads = Array.isArray(itemWithLeads.leads)
        ? itemWithLeads.leads[0]
        : itemWithLeads.leads;
      return {
        ...itemWithLeads,
        leads: leads ? { name: leads.name } : null
      } as AgendaItem;
    });

    return { data: formattedData, count };
  },

  async toggleStatus(id: number, completed: boolean) {
    const { data, error } = await supabase
      .from('agenda')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItem(id: number) {
    const { error } = await supabase.from('agenda').delete().eq('id', id);
    if (error) throw error;
  },

  async createItem(newItem: Database['public']['Tables']['agenda']['Insert']) {
    const { data, error } = await supabase
      .from('agenda')
      .insert([newItem])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAgents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');
    if (error) throw error;
    return data || [];
  }
};
