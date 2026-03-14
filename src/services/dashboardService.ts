import { supabase } from "./supabaseClient";

export async function getDashboardStats() {
  try {
    const { count: totalClientes } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    const { count: totalEquipamentos } = await supabase
      .from("equipment_assets")
      .select("*", { count: "exact", head: true });

    const { count: totalLocacoes } = await supabase
      .from("rentals")
      .select("*", { count: "exact", head: true });

    const { data: recentRentals } = await supabase
      .from("rentals")
      .select(`
        id,
        start_date,
        status,
        clients(name),
        equipment_assets(name)
      `)
      .order("start_date", { ascending: false })
      .limit(5);

    return {
      totalClientes: totalClientes || 0,
      totalEquipamentos: totalEquipamentos || 0,
      totalLocacoes: totalLocacoes || 0,
      faturamentoMensal: [],
      recentRentals: recentRentals || [],
    };
  } catch (error) {
    console.error("Dashboard service error:", error);

    return {
      totalClientes: 0,
      totalEquipamentos: 0,
      totalLocacoes: 0,
      faturamentoMensal: [],
      recentRentals: [],
    };
  }
}