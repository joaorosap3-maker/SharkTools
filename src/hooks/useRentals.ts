import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rentalService, Rental } from "../services/rentalService";
import { useAuth } from "../components/AuthProvider";

export const useRentals = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const useRentalsList = () => {
    return useQuery({
      queryKey: ["rentals", companyId],
      queryFn: () => rentalService.getAll(),
      enabled: !!companyId,
    });
  };

  const useRental = (id: string) => {
    return useQuery({
      queryKey: ["rental", id],
      queryFn: () => rentalService.getById(id),
      enabled: !!id,
    });
  };

  const createMutation = useMutation({
    mutationFn: (rental: Omit<Rental, 'id' | 'created_at'>) => 
      rentalService.create(rental),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_assets"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rental }: { id: string, rental: Partial<Rental> }) => 
      rentalService.update(id, rental),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      queryClient.invalidateQueries({ queryKey: ["rental", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["equipment_assets"] });
    },
  });

  return {
    useRentalsList,
    useRental,
    createRental: createMutation.mutateAsync,
    updateRental: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};
