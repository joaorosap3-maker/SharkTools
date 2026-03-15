import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

export default function FinancialDashboard() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['financial-metrics', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID not found");

      // Mocking or calculating real metrics from DB
      // In a real scenario, these would be complex SQL queries or edge functions
      const [rentalsRes, invoicesRes, equipmentRes] = await Promise.all([
        supabase.from('rentals').select('*, equipment_assets(name)').eq('company_id', companyId),
        supabase.from('invoices').select('*').eq('company_id', companyId),
        supabase.from('equipment_assets').select('*').eq('company_id', companyId)
      ]);

      const rentals = rentalsRes.data || [];
      const invoices = invoicesRes.data || [];
      const equipment = equipmentRes.data || [];

      // Calculate simple metrics
      const revenueMonth = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((acc, inv) => acc + Number(inv.total), 0);
      
      const pendingInvoices = invoices
        .filter(inv => inv.status === 'pending')
        .reduce((acc, inv) => acc + Number(inv.total), 0);

      // Usage rate: (rented items) / (total items) - very simplified
      const utilizationRate = equipment.length > 0 
        ? (equipment.filter(e => e.status === 'rented').length / equipment.length) * 100 
        : 0;

      // Charts data
      const monthlyRevenue = [
        { name: 'Jan', value: 4000 },
        { name: 'Fev', value: 3000 },
        { name: 'Mar', value: revenueMonth || 2000 },
      ];

      const topEquipment = rentals.reduce((acc: any, curr: any) => {
        const name = curr.equipment_assets?.name || 'Desconhecido';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const equipmentChartData = Object.entries(topEquipment).map(([name, value]) => ({ name, value }));

      return {
        revenueMonth,
        revenueYear: revenueMonth * 1.5, // Mocked
        pendingInvoices,
        paidInvoices: revenueMonth,
        utilizationRate,
        monthlyRevenue,
        equipmentChartData: equipmentChartData.slice(0, 5)
      };
    },
    enabled: !!companyId
  });

  const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
        <p className="text-slate-500 mt-1">Visão geral de receita, faturamento e utilização.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Receita do Mês', value: formatCurrency(metrics?.revenueMonth || 0), icon: 'payments', color: 'blue' },
          { title: 'Receita do Ano', value: formatCurrency(metrics?.revenueYear || 0), icon: 'trending_up', color: 'emerald' },
          { title: 'Faturas Pendentes', value: formatCurrency(metrics?.pendingInvoices || 0), icon: 'history_edu', color: 'amber' },
          { title: 'Taxa de Utilização', value: `${metrics?.utilizationRate.toFixed(1)}%`, icon: 'precision_manufacturing', color: 'violet' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
             <div className={`size-12 rounded-2xl flex items-center justify-center bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.title}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{item.value}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-lg">Receita Mensal</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                <Tooltip 
                  cursor={{fill: '#F1F5F9', radius: 8}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Usage Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-lg">Equipamentos Mais Alugados</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.equipmentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics?.equipmentChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {metrics?.equipmentChartData.map((entry: any, index: number) => (
               <div key={index} className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{entry.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
