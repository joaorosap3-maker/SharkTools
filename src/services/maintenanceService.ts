import { supabase } from "./supabaseClient";

export interface MaintenanceOrder {
  id?: string;
  company_id: string;
  equipment_id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  cost?: number;
  technician?: string;
  created_at?: string;
  updated_at?: string;
}

export const maintenanceService = {
  async getAll() {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select(`
        *,
        equipment_assets(name, code)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select(`
        *,
        equipment_assets(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByEquipment(equipmentId: string) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(order: Omit<MaintenanceOrder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert([order])
      .select()
      .single();

    if (error) throw error;

    // Update equipment status if maintenance starts
    if (order.status === 'in_progress') {
      await supabase
        .from('equipment_assets')
        .update({ status: 'maintenance' })
        .eq('id', order.equipment_id);
    }

    return data;
  },

  async update(id: string, order: Partial<MaintenanceOrder>) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .update(order)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update equipment status based on maintenance status
    if (order.status === 'in_progress') {
      await supabase
        .from('equipment_assets')
        .update({ status: 'maintenance' })
        .eq('id', data.equipment_id);
    } else if (order.status === 'completed' || order.status === 'cancelled') {
        // If maintenance is over, set back to 'available' 
        // (This is a simplification, might need more check if it was 'available' or 'rented' before)
        await supabase
          .from('equipment_assets')
          .update({ status: 'available' })
          .eq('id', data.equipment_id);
    }

    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
