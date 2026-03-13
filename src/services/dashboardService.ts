import { supabase } from './supabaseClient';

export const getDashboardMetrics = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const todayStr = new Date().toISOString().split('T')[0];

    // Locações Ativas
    const { count: activeRentals } = await supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'ativa', 'em andamento']);

    // Ferramentas Disponíveis / Alugadas
    const { count: availableTools } = await supabase
      .from('equipment_assets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');

    const { count: rentedTools } = await supabase
      .from('equipment_assets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented');

    // Clientes no Mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Faturamento dia e mês
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, issued_at')
      .eq('status', 'paid');

    let faturamentoDia = 0;
    let recebimentosMes = 0;

    if (invoices) {
      invoices.forEach(inv => {
        const invDate = new Date(inv.issued_at);
        if (invDate >= startOfMonth) {
          recebimentosMes += Number(inv.total || 0);
        }
        if (inv.issued_at.startsWith(todayStr)) {
          faturamentoDia += Number(inv.total || 0);
        }
      });
    }

    return {
      faturamentoDia,
      locacoesAtivas: activeRentals || 0,
      ferramentasAlugadas: rentedTools || 0,
      ferramentasDisponiveis: availableTools || 0,
      clientesMes: newClients || 0,
      recebimentosMes,
    };
  } catch (error) {
    console.error('Error fetching metrics', error);
    return {
      faturamentoDia: 0,
      locacoesAtivas: 0,
      ferramentasAlugadas: 0,
      ferramentasDisponiveis: 0,
      clientesMes: 0,
      recebimentosMes: 0,
    };
  }
};

export const getFaturamentoMensal = async () => {
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, issued_at')
      .eq('status', 'paid');

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(6).fill(0);

    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      let monthTotal = 0;
      if (invoices) {
        invoices.forEach(inv => {
          const d = new Date(inv.issued_at);
          if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
            monthTotal += Number(inv.total || 0);
          }
        });
      }

      monthlyData[5 - i] = {
        month: new Date(targetYear, targetMonth, 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        total: monthTotal
      };
    }
    return monthlyData;
  } catch (error) {
    console.error('Error fetching monthly revenue', error);
    return [];
  }
};

export const getLocacoesPorCategoria = async () => {
  try {
    // Assuming type/category is on equipment_assets and related to rentals
    const { data: rentals } = await supabase
      .from('rentals')
      .select('equipment_assets(type)');

    if (!rentals) return { categories: [], total: 0 };

    const categoryCounts: Record<string, number> = {};
    let totalItems = 0;

    rentals.forEach((r: any) => {
      const category = r.equipment_assets?.type || 'Outros';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      totalItems++;
    });

    return {
      categories: Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
        percentage: totalItems > 0 ? Math.round((Number(count) / totalItems) * 100) : 0
      })).sort((a, b) => b.count - a.count),
      total: totalItems
    };
  } catch (error) {
    console.error('Error fetching category counts', error);
    return { categories: [], total: 0 };
  }
};

export const getAtividadeRecente = async () => {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
          id,
          start_date,
          status,
          clients (name, document, email, phone),
          equipment_assets (name, code),
          invoices (total)
        `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map(rental => {
      const doc = (rental.clients as any)?.document || (rental.clients as any)?.email || (rental.clients as any)?.phone || '';
      const name = (rental.clients as any)?.name || 'Cliente Desconhecido';

      let invTotal = 0;
      if (rental.invoices && Array.isArray(rental.invoices)) {
        invTotal = rental.invoices.reduce((acc, inv) => acc + Number(inv.total || 0), 0);
      } else if (rental.invoices && typeof rental.invoices === 'object') {
        invTotal = Number((rental.invoices as any).total || 0);
      }

      return {
        id: rental.id,
        clientName: name,
        clientDoc: doc,
        clientInitials: name.substring(0, 2).toUpperCase(),
        toolName: (rental.equipment_assets as any)?.name || 'Ferramenta Desconhecida',
        toolCode: (rental.equipment_assets as any)?.code || '',
        date: rental.start_date,
        status: rental.status,
        total: invTotal
      };
    });
  } catch (err) {
    console.error(err);
    return [];
  }
}

export const getGlobalSearchResults = async (query: string) => {
  // This could also be wired to Supabase later, returning empty for now
  // as it's not the primary dashboard focus
  return [];
}
