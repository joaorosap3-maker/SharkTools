import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceService, MaintenanceOrder } from "../services/maintenanceService";
import { useAuth } from "../components/AuthProvider";

export const useMaintenance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const useMaintenanceList = () => {
    return useQuery({
      queryKey: ["maintenance", companyId],
      queryFn: () => maintenanceService.getAll(),
      enabled: !!companyId,
    });
  };

  const useMaintenanceOrder = (id: string) => {
    return useQuery({
      queryKey: ["maintenance-order", id],
      queryFn: () => maintenanceService.getById(id),
      enabled: !!id,
    });
  };

  const useEquipmentMaintenance = (equipmentId: string) => {
    return useQuery({
      queryKey: ["equipment-maintenance", equipmentId],
      queryFn: () => maintenanceService.getByEquipment(equipmentId),
      enabled: !!equipmentId,
    });
  };

  const createMutation = useMutation({
    mutationFn: (order: Omit<MaintenanceOrder, 'id' | 'created_at' | 'updated_at'>) => 
      maintenanceService.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_assets"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, order }: { id: string, order: Partial<MaintenanceOrder> }) => 
      maintenanceService.update(id, order),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["equipment_assets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_assets"] });
    },
  });

  return {
    useMaintenanceList,
    useMaintenanceOrder,
    useEquipmentMaintenance,
    createOrder: createMutation.mutateAsync,
    updateOrder: updateMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
