import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export const useCalendar = (dateRange?: { start: Date; end: Date }) => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["calendar-events", companyId, dateRange?.start.toISOString(), dateRange?.end.toISOString()],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID not found");

      let rentalsQuery = supabase
        .from("rentals")
        .select(`
          *,
          clients (name, email, phone),
          equipment_assets (id, name),
          invoices (total)
        `)
        .eq("company_id", companyId)
        .not('status', 'eq', 'cancelled');

      let maintenanceQuery = supabase
        .from("maintenance_orders")
        .select(`
          *,
          equipment_assets (id, name)
        `)
        .eq("company_id", companyId)
        .not('status', 'eq', 'cancelled');

      if (dateRange) {
        const startStr = dateRange.start.toISOString().split('T')[0];
        const endStr = dateRange.end.toISOString().split('T')[0];
        
        rentalsQuery = rentalsQuery.or(`start_date.lte.${endStr},end_date.gte.${startStr}`);
        maintenanceQuery = maintenanceQuery.or(`start_date.lte.${endStr},end_date.gte.${startStr}`);
      }

      const [rentalsRes, maintenanceRes] = await Promise.all([
        rentalsQuery,
        maintenanceQuery
      ]);

      if (rentalsRes.error) throw rentalsRes.error;
      if (maintenanceRes.error) throw maintenanceRes.error;

      const rentalEvents = rentalsRes.data.map((rental: any) => ({
        id: rental.id,
        type: 'rental',
        equipment_id: rental.equipment_id,
        title: `${rental.clients?.name.split(' ')[0] || 'Cliente'} - ${rental.equipment_assets?.name.split(' ')[0] || 'Item'}`,
        start: new Date(`${rental.start_date.split('T')[0]}T12:00:00`),
        end: new Date(`${(rental.end_date || rental.start_date).split('T')[0]}T12:00:00`),
        status: rental.status,
        data: {
            ...rental,
            clientId: rental.client_id,
            startDate: rental.start_date,
            endDate: rental.end_date,
            total: rental.invoices?.[0]?.total || 0,
            equipmentName: rental.equipment_assets?.name
        }
      }));

      const maintenanceEvents = maintenanceRes.data.map((m: any) => ({
        id: m.id,
        type: 'maintenance',
        equipment_id: m.equipment_id,
        title: `🔧 MNT: ${m.equipment_assets?.name.split(' ')[0]}`,
        start: new Date(`${m.start_date}T12:00:00`),
        end: new Date(`${m.end_date || m.start_date}T12:00:00`),
        status: m.status,
        data: {
          ...m,
          equipmentName: m.equipment_assets?.name,
          priority: m.priority
        }
      }));

      return [...rentalEvents, ...maintenanceEvents];
    },
    enabled: !!companyId,
  });
};
