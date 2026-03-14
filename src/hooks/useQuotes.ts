import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quoteService, Quote, QuoteItem } from "../services/quoteService";
import { useAuth } from "../components/AuthProvider";

export const useQuotes = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const useQuotesList = () => {
    return useQuery({
      queryKey: ["quotes", companyId],
      queryFn: () => quoteService.getAll(),
      enabled: !!companyId,
    });
  };

  const useQuote = (id: string) => {
    return useQuery({
      queryKey: ["quote", id],
      queryFn: () => quoteService.getById(id),
      enabled: !!id,
    });
  };

  const createMutation = useMutation({
    mutationFn: ({ quote, items }: { quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>, items: Omit<QuoteItem, 'id'>[] }) => 
      quoteService.create(quote, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quote, items }: { id: string, quote: Partial<Quote>, items?: QuoteItem[] }) => 
      quoteService.update(id, quote, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quoteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => quoteService.convertToRental(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });

  return {
    useQuotesList,
    useQuote,
    createQuote: createMutation.mutateAsync,
    updateQuote: updateMutation.mutateAsync,
    deleteQuote: deleteMutation.mutateAsync,
    convertToRental: convertMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isConverting: convertMutation.isPending,
  };
};
