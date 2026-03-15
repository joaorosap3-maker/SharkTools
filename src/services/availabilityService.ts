import { supabase } from "./supabaseClient";

export interface AvailabilityConflict {
  type: 'rental' | 'maintenance';
  id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  client_name?: string;
  title?: string;
}

export const availabilityService = {
  /**
   * Checks if an equipment is available for a given period.
   * Returns null if available, or the first conflicting record found.
   */
  async checkAvailability(
    equipmentId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AvailabilityConflict | null> {
    // 0. Check if equipment is retired
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_assets')
      .select('status, name')
      .eq('id', equipmentId)
      .single();

    if (eqError) throw eqError;
    
    if (equipment.status === 'retired') {
      return {
        type: 'maintenance', // Treat as permanent maintenance/retired
        id: equipmentId,
        start_date: '2000-01-01',
        end_date: null,
        status: 'retired',
        title: 'EQUIPAMENTO APOSENTADO (RETIRED)'
      };
    }

    // Range overlap logic: (StartA <= EndB) AND (EndA >= StartB)
    
    // 1. Check Rentals
    // We only care about rentals that are not completed or cancelled
    const { data: rentals, error: rentalError } = await supabase
      .from('rentals')
      .select(`
        id, 
        start_date, 
        end_date, 
        status,
        clients (name)
      `)
      .eq('equipment_id', equipmentId)
      .not('status', 'in', '("completed","cancelled")')
      .lte('start_date', endDate)
      .or(`end_date.gte.${startDate},end_date.is.null`);

    if (rentalError) throw rentalError;

    if (rentals && rentals.length > 0) {
      const r = rentals[0];
      return {
        type: 'rental',
        id: r.id,
        start_date: r.start_date,
        end_date: r.end_date,
        status: r.status,
        client_name: (r.clients as any)?.name
      };
    }

    // 2. Check Maintenance Orders
    // We only care about maintenance that is not completed or cancelled
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_orders')
      .select('id, title, start_date, end_date, status')
      .eq('equipment_id', equipmentId)
      .not('status', 'in', '("completed","cancelled")')
      .lte('start_date', endDate)
      .or(`end_date.gte.${startDate},end_date.is.null`);

    if (maintenanceError) throw maintenanceError;

    if (maintenance && maintenance.length > 0) {
      const m = maintenance[0];
      return {
        type: 'maintenance',
        id: m.id,
        start_date: m.start_date,
        end_date: m.end_date,
        status: m.status,
        title: m.title
      };
    }

    return null;
  },

  /**
   * Returns all bookings/maintenance for an equipment within a date range (for the timeline)
   */
  async getEquipmentEvents(equipmentId: string, fromDate: string, toDate: string) {
    const [rentals, maintenance] = await Promise.all([
      supabase
        .from('rentals')
        .select(`id, start_date, end_date, status, clients (name)`)
        .eq('equipment_id', equipmentId)
        .gte('end_date', fromDate)
        .lte('start_date', toDate),
      supabase
        .from('maintenance_orders')
        .select('id, title, start_date, end_date, status')
        .eq('equipment_id', equipmentId)
        .gte('end_date', fromDate)
        .lte('start_date', toDate)
    ]);

    if (rentals.error) throw rentals.error;
    if (maintenance.error) throw maintenance.error;

    return {
      rentals: rentals.data.map(r => ({ ...r, eventType: 'rental' })),
      maintenance: maintenance.data.map(m => ({ ...m, eventType: 'maintenance' }))
    };
  }
};
