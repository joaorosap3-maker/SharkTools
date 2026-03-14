import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';

export type PlanFeatures = {
  max_assets: number;
  max_clients: number;
  pdf_contracts: boolean;
  advanced_reports: boolean;
  whatsapp_notif: boolean;
};

export type SubscriptionData = {
  planName: string;
  status: string;
  features: PlanFeatures;
};

export const useSubscription = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ['subscription', companyId],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!companyId) throw new Error('Company ID not found');

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          status,
          plans (
            name,
            features
          )
        `)
        .eq('company_id', companyId)
        .single();

      if (error) {
        // Fallback for companies without subscription yet
        return {
          planName: 'Básico (Legacy)',
          status: 'active',
          features: {
            max_assets: 10,
            max_clients: 50,
            pdf_contracts: false,
            advanced_reports: false,
            whatsapp_notif: false
          }
        };
      }

      const plan: any = data.plans;
      return {
        planName: plan.name,
        status: data.status,
        features: plan.features as PlanFeatures
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
