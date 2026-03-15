import { supabase } from './supabaseClient';

export interface PortalToken {
  id: string;
  tenant_id: string;
  client_id: string;
  token: string;
  expires_at: string;
}

export const clientPortalService = {
  async generatePortalLink(clientId: string, tenantId: string) {
    // Generate a secure 32-character token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Token expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from('client_portal_tokens')
      .insert({
        client_id: clientId,
        tenant_id: tenantId,
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return `${window.location.origin}/portal-access/${token}`;
  },

  async validateToken(token: string) {
    const { data, error } = await supabase
      .from('client_portal_tokens')
      .select(`
        *,
        client:clients (
          name,
          document,
          company:companies (
            name,
            logo_url
          )
        )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) return null;
    return data;
  },

  async getPortfolioData(clientId: string, tenantId: string) {
    // Fetch Rentals
    const rentalsPromise = supabase
      .from('rentals')
      .select(`
        *,
        equipment:equipment_assets(name, code, daily_price)
      `)
      .eq('client_id', clientId)
      .eq('company_id', tenantId)
      .order('created_at', { ascending: false });

    // Fetch Contracts
    const contractsPromise = supabase
      .from('contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('rental_id', (
        await supabase
          .from('rentals')
          .select('id')
          .eq('client_id', clientId)
          .eq('company_id', tenantId)
      ).data?.map(r => r.id) || [])
      .order('created_at', { ascending: false });

    // Fetch Invoices
    const invoicesPromise = supabase
      .from('invoices')
      .select('*')
      .eq('company_id', tenantId)
      .in('rental_id', (
        await supabase
          .from('rentals')
          .select('id')
          .eq('client_id', clientId)
          .eq('company_id', tenantId)
      ).data?.map(r => r.id) || [])
      .order('issued_at', { ascending: false });

    const [rentals, contracts, invoices] = await Promise.all([
      rentalsPromise,
      contractsPromise,
      invoicesPromise
    ]);

    return {
      rentals: rentals.data || [],
      contracts: contracts.data || [],
      invoices: invoices.data || []
    };
  }
};
