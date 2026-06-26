import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

export type Property = Database['public']['Tables']['inventory']['Row'] & { estado_vivienda?: string };

export const inventoryService = {
  async fetchProperties() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('numero_vivienda', { ascending: true });

    if (error) throw error;

    // Numerical sorting
    const sortedData = (data as Property[] || []).sort((a, b) => {
      const numA = parseInt(a.numero_vivienda || '');
      const numB = parseInt(b.numero_vivienda || '');
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return (a.numero_vivienda || '').localeCompare(b.numero_vivienda || '', undefined, { numeric: true });
    });

    return sortedData;
  },

  async deleteProperty(id: string) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
