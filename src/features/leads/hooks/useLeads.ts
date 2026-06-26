// src/features/leads/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService } from '../api/leadsService';
import type { LeadUpdate, LeadInsert, FetchLeadsParams } from '../api/leadsService';

export const LEADS_QUERY_KEY = ['leads'];

export function useLeads(params: FetchLeadsParams) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, params],
    queryFn: async () => {
      return await leadsService.fetchLeads(params);
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LeadUpdate }) => {
      return await leadsService.updateLead(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      queryClient.setQueryData(['lead', data.id], data);
    }
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLead: LeadInsert) => {
      return await leadsService.createLead(newLead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await leadsService.deleteLead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    }
  });
}
