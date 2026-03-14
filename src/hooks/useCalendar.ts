import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export const useCalendar = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["calendar-events", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID not found");

      const { data, error } = await supabase
        .from("rentals")
        .select(`
          *,
          clients (name, email, phone),
          equipment_assets (name),
          invoices (total)
        `)
        .eq("company_id", companyId);

      if (error) throw error;

      return data.map((rental: any) => ({
        id: rental.id,
        title: `${rental.clients?.name.split(' ')[0] || 'Cliente'} - ${rental.equipment_assets?.name.split(' ')[0] || 'Item'}`,
        start: new Date(`${rental.start_date}T12:00:00`),
        end: new Date(`${rental.end_date}T12:00:00`),
        status: rental.status,
        rental: {
            ...rental,
            clientId: rental.client_id,
            startDate: rental.start_date,
            endDate: rental.end_date,
            total: rental.invoices?.[0]?.total || 0
        }
      }));
    },
    enabled: !!companyId,
  });
};
