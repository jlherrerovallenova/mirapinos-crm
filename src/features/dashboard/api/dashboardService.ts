import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

export type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null;
};

export type EmailTrackingItem = any;

export const dashboardService = {
  async getLeadsStats() {
    const { data, error } = await supabase.from('leads').select('source');
    if (error) throw error;

    const total = data.length;
    const sourceCounts: Record<string, number> = {};
    data.forEach((lead: any) => {
      const source = lead.source ? lead.source.trim() : 'Desconocido';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const sortedSources = Object.entries(sourceCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { totalLeads: total, topSources: sortedSources };
  },

  async getRecentLeads(limit = 5) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, source, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getPendingAgenda() {
    const { data, error } = await supabase
      .from('agenda')
      .select('*, leads(name)')
      .eq('completed', false)
      .order('due_date', { ascending: true });
    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      leads: Array.isArray(item.leads) ? item.leads[0] : item.leads
    })) as AgendaItem[];
  },

  async getNoActivityLeads(limit = 50) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, source, created_at, agenda(id)');
    if (error) throw error;

    return (data || [])
      .filter((l: any) => !l.agenda || l.agenda.length === 0)
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        source: l.source,
        created_at: l.created_at
      }))
      .slice(0, limit);
  },

  async getEmailTracking(limit = 50) {
    const { data, error } = await (supabase as any)
      .from('email_tracking')
      .select('*, leads(name, phone)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      leads: Array.isArray(item.leads) ? item.leads[0] : item.leads
    })) as EmailTrackingItem[];
  },

  async toggleAgendaStatus(id: number, completed: boolean) {
    const { error } = await (supabase as any)
      .from('agenda')
      .update({ completed })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteAgendaItem(id: number) {
    const { error } = await (supabase as any)
      .from('agenda')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getFeedbackLeads() {
    let feedbackData: any[] = [];
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, source, created_at, status, feedback_sent, feedback_rating, feedback_responded_at')
      .or('status.in.(visiting,closed),feedback_rating.not.is.null');
    
    if (!error && data) {
      feedbackData = data;
    } else {
      const { data: fallbackData } = await supabase
        .from('leads')
        .select('id, name, email, source, created_at, status, feedback_sent')
        .in('status', ['visiting', 'closed'])
        .eq('feedback_sent', false);
      feedbackData = fallbackData || [];
    }
    const now = new Date();
    return feedbackData
      .map((l: any) => {
        const daysSinceCreated = Math.floor((now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return { ...l, daysSinceCreated };
      })
      .sort((a: any, b: any) => {
        if (a.feedback_responded_at && b.feedback_responded_at) {
          return new Date(b.feedback_responded_at).getTime() - new Date(a.feedback_responded_at).getTime();
        }
        if (a.feedback_responded_at) return -1;
        if (b.feedback_responded_at) return 1;
        return b.daysSinceCreated - a.daysSinceCreated;
      });
  }
};
