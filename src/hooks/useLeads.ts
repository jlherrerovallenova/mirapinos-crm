// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type LeadInfo = Database['public']['Tables']['leads']['Row'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

/**
 * Hook para obtener la lista de Leads filtrada por estado y ordenamiento
 */
export function useLeads(filters?: { source?: string, status?: string }) {
    return useQuery({
        queryKey: ['leads', filters],
        queryFn: async () => {
            let query = supabase.from('leads').select('*');

            if (filters?.source && filters.source !== 'All') {
                query = query.eq('source', filters.source);
            }
            if (filters?.status && filters.status !== 'All') {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw new Error(error.message);
            return data as LeadInfo[];
        },
    });
}

/**
 * Hook para obtener los detalles de un Lead específico
 */
export function useLeadDetail(id: string | null) {
    return useQuery({
        queryKey: ['leads', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw new Error(error.message);
            return data as LeadInfo;
        },
        enabled: !!id, // Solo se ejecuta si hay ID
    });
}

/**
 * Hook mutador para actualizar el pipeline (Drag & Drop Optimista) o estados
 */
export function useUpdateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: LeadUpdate }) => {
            const { error } = await (supabase as any)
                .from('leads')
                .update(updates)
                .eq('id', id);

            if (error) throw new Error(error.message);
        },
        // Mutación Optimista para que el Pipeline cambie al vuelo
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['leads'] });

            // Actualizamos TODAS las queries que empiecen por ['leads'] (listas y detalles)
            queryClient.setQueriesData({ queryKey: ['leads'] }, (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.map((lead: any) => lead.id === id ? { ...lead, ...updates } : lead);
                }
                if (old.id === id) {
                    return { ...old, ...updates };
                }
                return old;
            });
        },
        onError: () => {
            // En caso de error, el onSettled invalidará todo y recuperará el valor real
        },
        // Al finalizar o errar, reconciliamos el servidor
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}
