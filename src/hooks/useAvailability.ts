import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export const useAvailability = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const useAvailabilityMetrics = () => {
    return useQuery({
      queryKey: ["availability-metrics", companyId],
      queryFn: async () => {
        if (!companyId) throw new Error("Company ID not found");

        const { data, error } = await supabase
          .from("equipment_assets")
          .select("id, name, status, category")
          .eq("company_id", companyId);

        if (error) throw error;

        const metrics: Record<string, any> = {};

        data.forEach((item: any) => {
          if (!metrics[item.name]) {
            metrics[item.name] = {
              name: item.name,
              total: 0,
              rented: 0,
              maintenance: 0,
              available: 0,
              category: item.category
            };
          }

          metrics[item.name].total++;
          if (item.status === 'rented') metrics[item.name].rented++;
          else if (item.status === 'maintenance') metrics[item.name].maintenance++;
          else if (item.status === 'available') metrics[item.name].available++;
        });

        return Object.values(metrics);
      },
      enabled: !!companyId,
    });
  };

  const useEquipmentTimeline = (equipmentId: string, from: string, to: string) => {
    return useQuery({
      queryKey: ["equipment-timeline", equipmentId, from, to],
      queryFn: async () => {
        const [rentals, maintenance] = await Promise.all([
          supabase
            .from("rentals")
            .select("*, clients(name)")
            .eq("equipment_id", equipmentId)
            .gte("start_date", from)
            .lte("start_date", to),
          supabase
            .from("maintenance_orders")
            .select("*")
            .eq("equipment_id", equipmentId)
            .gte("start_date", from)
            .lte("start_date", to)
        ]);

        return {
          rentals: (rentals.data || []).map(r => ({ ...r, eventType: 'rental' })),
          maintenance: (maintenance.data || []).map(m => ({ ...m, eventType: 'maintenance' }))
        };
      },
      enabled: !!equipmentId
    });
  };

  const checkAvailability = async (equipmentId: string, start: string, end: string) => {
    // Check if equipment is available in the given range
    const { data: conflicts } = await supabase
      .from("rentals")
      .select("*")
      .eq("equipment_id", equipmentId)
      .neq("status", "cancelled")
      .or(`start_date.lte.${end},end_date.gte.${start}`);

    if (conflicts && conflicts.length > 0) {
      return conflicts[0];
    }

    const { data: equipment } = await supabase
      .from("equipment_assets")
      .select("status")
      .eq("id", equipmentId)
      .single();

    if (equipment?.status !== 'available') {
      return true; // Simple "not available" indicator if no specific conflict
    }

    return null;
  };

  return { useAvailabilityMetrics, useEquipmentTimeline, checkAvailability };
};
