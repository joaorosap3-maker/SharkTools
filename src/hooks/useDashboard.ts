import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export interface DashboardStats {
  totalRevenue: number;
  activeRentals: number;
  availableEquipment: number;
  overdueRentals: number;
  recentRentals: any[];
}

export const useDashboard = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery<DashboardStats>({
    queryKey: ["dashboard", companyId],
    queryFn: async () => {
      console.log("[useDashboard] Fetching stats for company:", companyId);
      
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // 1. Fetch Stats (Parallel)
      const [rentalsRes, equipmentRes, revenueRes] = await Promise.all([
        supabase
          .from("rentals")
          .select("id, status")
          .eq("company_id", companyId),
        supabase
          .from("equipment_assets")
          .select("id, status")
          .eq("company_id", companyId),
        supabase
          .from("invoices")
          .select("total")
          .eq("company_id", companyId)
          .eq("status", "paid")
      ]);

      if (rentalsRes.error) throw rentalsRes.error;
      if (equipmentRes.error) throw equipmentRes.error;
      if (revenueRes.error) throw revenueRes.error;

      // 2. Fetch Recent Rentals
      const { data: recent, error: recentError } = await supabase
        .from("rentals")
        .select(`
          id,
          start_date,
          status,
          clients (name),
          equipment_assets (name)
        `)
        .eq("company_id", companyId)
        .order("start_date", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const stats: DashboardStats = {
        totalRevenue: revenueRes.data.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
        activeRentals: rentalsRes.data.filter(r => r.status === "active").length,
        availableEquipment: equipmentRes.data.filter(e => e.status === "available").length,
        overdueRentals: rentalsRes.data.filter(r => r.status === "overdue").length,
        recentRentals: recent || [],
      };

      return stats;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
