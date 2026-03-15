import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export const useMasterData = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const useClients = () => {
    return useQuery({
      queryKey: ["master-clients", companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("clients")
          .select("id, name, document, email, phone")
          .eq("company_id", companyId)
          .order("name");
        if (error) throw error;
        return data;
      },
      enabled: !!companyId,
    });
  };

  const useEquipment = () => {
    return useQuery({
      queryKey: ["master-equipment", companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("equipment_assets")
          .select("id, name, code, daily_price")
          .eq("company_id", companyId)
          .order("name");
        if (error) throw error;
        return data;
      },
      enabled: !!companyId,
    });
  };

  return { useClients, useEquipment };
};
