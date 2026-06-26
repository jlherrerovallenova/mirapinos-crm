// src/features/inventory/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../api/inventoryService';

/**
 * Hook para obtener el listado del Inventario 
 */
export function useInventory() {
    return useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            return await inventoryService.fetchProperties();
        },
    });
}

/**
 * Mutación para eliminar una propiedad del inventario
 */
export function useDeleteProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await inventoryService.deleteProperty(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
