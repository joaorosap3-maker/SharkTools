import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractService, ContractTemplate } from "../services/contractService";
import { useAuth } from "../components/AuthProvider";

export const useContracts = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.company_id;

  const useTemplates = () => {
    return useQuery({
      queryKey: ["contract-templates", tenantId],
      queryFn: () => contractService.getTemplates(tenantId!),
      enabled: !!tenantId,
    });
  };

  const useRentalContracts = (rentalId: string) => {
    return useQuery({
      queryKey: ["contracts", rentalId],
      queryFn: () => contractService.getContractsByRental(rentalId),
      enabled: !!rentalId,
    });
  };

  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>) => 
      contractService.saveTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string, template: Partial<ContractTemplate> }) => 
      contractService.updateTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: ({ rentalId, templateId }: { rentalId: string, templateId: string }) => 
      contractService.generateRentalContract(rentalId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts", variables.rentalId] });
    },
  });

  return {
    useTemplates,
    useRentalContracts,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    generateContract: generateContractMutation.mutateAsync,
    isGenerating: generateContractMutation.isPending,
  };
};
