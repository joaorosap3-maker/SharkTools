import { supabase } from "./supabaseClient";

export interface Rental {
  id?: string;
  company_id: string;
  client_id: string;
  equipment_id: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  created_at?: string;
  notes?: string;
}

export const rentalService = {
  async getAll() {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        clients (id, name, email, phone),
        equipment_assets (id, name, code)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        clients (*),
        equipment_assets (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(rental: Omit<Rental, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('rentals')
      .insert([rental])
      .select()
      .single();

    if (error) throw error;

    // Update equipment status
    await supabase
      .from('equipment_assets')
      .update({ status: 'rented' })
      .eq('id', rental.equipment_id);

    return data;
  },

  async update(id: string, rental: Partial<Rental>) {
    const { data, error } = await supabase
      .from('rentals')
      .update(rental)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If completed or cancelled, free the equipment
    if (rental.status === 'completed' || rental.status === 'cancelled') {
        await supabase
          .from('equipment_assets')
          .update({ status: 'available' })
          .eq('id', data.equipment_id);
    }

    return data;
  }
};
