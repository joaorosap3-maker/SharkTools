import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export const useReports = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["reports", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID not found");

      // 1. Fetch Revenue Data (Invoices)
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("total, issued_at")
        .eq("company_id", companyId)
        .eq("status", "paid");

      if (invError) throw invError;

      // 2. Fetch Inventory Status
      const { data: inventory, error: invenError } = await supabase
        .from("equipment_assets")
        .select("status")
        .eq("company_id", companyId);

      if (invenError) throw invenError;

      // 3. Fetch Top Tools (Rentals)
      const { data: rentals, error: rentError } = await supabase
        .from("rentals")
        .select(`
          equipment_assets (name)
        `)
        .eq("company_id", companyId);

      if (rentError) throw rentError;

      // Process Revenue by Month
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const revenueByMonth: Record<string, number> = {};
      
      invoices?.forEach(inv => {
        const date = new Date(inv.issued_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (Number(inv.total) || 0);
      });

      const revenueData = Object.keys(revenueByMonth).map(key => ({
        name: key,
        Receita: revenueByMonth[key]
      })).slice(-6);

      // Process Inventory Status
      const statusCounts = {
        available: inventory?.filter(i => i.status === 'available' || i.status === 'disponivel').length || 0,
        rented: inventory?.filter(i => i.status === 'rented' || i.status === 'alugada').length || 0,
        maintenance: inventory?.filter(i => i.status === 'maintenance' || i.status === 'manutencao').length || 0,
      };

      const toolsStatusData = [
        { name: 'Disponível', value: statusCounts.available, color: '#10b981' },
        { name: 'Alugada', value: statusCounts.rented, color: '#3b82f6' },
        { name: 'Manutenção', value: statusCounts.maintenance, color: '#f59e0b' },
      ];

      // Process Top Tools
      const toolCounts: Record<string, number> = {};
      rentals?.forEach((r: any) => {
        const name = r.equipment_assets?.name;
        if (name) toolCounts[name] = (toolCounts[name] || 0) + 1;
      });

      const topToolsData = Object.keys(toolCounts)
        .map(name => ({ name, Locações: toolCounts[name] }))
        .sort((a, b) => b.Locações - a.Locações)
        .slice(0, 5);

      return {
        revenueData,
        toolsStatusData,
        topToolsData,
        stats: {
          totalRevenue: invoices?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0,
          activeRentals: rentals?.length || 0,
          totalTools: inventory?.length || 0,
        }
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
