import { supabase } from "./supabaseClient";

export interface QuoteItem {
  id?: string;
  equipment_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quote {
  id?: string;
  company_id: string;
  client_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  total_value: number;
  valid_until?: string;
  items?: QuoteItem[];
  created_at?: string;
  updated_at?: string;
}

export const quoteService = {
  async getAll() {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients(name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (quoteError) throw quoteError;

    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id);

    if (itemsError) throw itemsError;

    return { ...quote, items };
  },

  async create(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>, items: Omit<QuoteItem, 'id'>[]) {
    // 1. Create the quote
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert([quote])
      .select()
      .single();

    if (quoteError) throw quoteError;

    // 2. Create the items
    const itemsWithQuoteId = items.map(item => ({
      ...item,
      quote_id: newQuote.id,
      company_id: quote.company_id
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsWithQuoteId);

    if (itemsError) throw itemsError;

    return newQuote;
  },

  async update(id: string, quote: Partial<Quote>, items?: QuoteItem[]) {
    // 1. Update quote
    const { error: quoteError } = await supabase
      .from('quotes')
      .update(quote)
      .eq('id', id);

    if (quoteError) throw quoteError;

    if (items) {
      // For simplicity in this version, we'll delete and re-insert items
      // In a production app, we'd do a more sophisticated upsert/delete sync
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', id);

      if (deleteError) throw deleteError;

      const itemsWithQuoteId = items.map(item => ({
        ...item,
        id: undefined, // Let DB generate new IDs
        quote_id: id,
        company_id: quote.company_id || (items[0] as any).company_id
      }));

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(itemsWithQuoteId);

      if (insertError) throw insertError;
    }

    return true;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async convertToRental(quoteId: string) {
    const quote = await this.getById(quoteId);
    
    if (quote.status !== 'approved') {
      throw new Error('Apenas orçamentos aprovados podem ser convertidos em locação.');
    }

    const rentals = quote.items?.filter(item => item.equipment_id).map(item => ({
      company_id: quote.company_id,
      client_id: quote.client_id,
      equipment_id: item.equipment_id,
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      total_value: item.total_price // Or some other logic for rental price
    })) || [];

    if (rentals.length === 0) {
      throw new Error('O orçamento não contém equipamentos para locação.');
    }

    const { data: newRentals, error: rentalError } = await supabase
      .from('rentals')
      .insert(rentals)
      .select();

    if (rentalError) throw rentalError;

    // Optional: Update quote status to recorded/converted if you had a status for it
    await this.update(quoteId, { status: 'approved' }); // Keep as approved or change to 'converted'

    return newRentals;
  }
};
