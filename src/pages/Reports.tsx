import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function Reports() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeRentals: 0,
    totalTools: 0,
    totalClients: 0,
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [toolsStatusData, setToolsStatusData] = useState<any[]>([]);
  const [topToolsData, setTopToolsData] = useState<any[]>([]);

  useEffect(() => {
    // Load data from localStorage
    const transactions = JSON.parse(localStorage.getItem('sharktools_transactions') || '[]');
    const rentals = JSON.parse(localStorage.getItem('sharktools_rentals') || '[]');
    const inventory = JSON.parse(localStorage.getItem('sharktools_inventory') || '[]');
    const clients = JSON.parse(localStorage.getItem('sharktools_clients') || '[]');

    // Calculate basic stats
    const totalRevenue = transactions
      .filter((t: any) => t.type === 'income' && t.status === 'completed')
      .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const activeRentals = rentals.filter((r: any) => r.status === 'ativa').length;
    const totalTools = inventory.length;
    const totalClients = clients.length;

    setStats({ totalRevenue, activeRentals, totalTools, totalClients });

    // Calculate Revenue Data (Last 6 months)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const revenueByMonth: Record<string, number> = {};
    
    transactions
      .filter((t: any) => t.type === 'income' && t.status === 'completed')
      .forEach((t: any) => {
        const date = new Date(t.date + 'T12:00:00');
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + t.amount;
      });

    const formattedRevenueData = Object.keys(revenueByMonth)
      .slice(0, 6) // Get last 6 entries roughly
      .map(key => ({
        name: key,
        Receita: revenueByMonth[key]
      }));
    
    // If empty, add some dummy data for visual purposes
    if (formattedRevenueData.length === 0) {
      formattedRevenueData.push(
        { name: 'Jan 2023', Receita: 1200 },
        { name: 'Fev 2023', Receita: 2100 },
        { name: 'Mar 2023', Receita: 800 },
        { name: 'Abr 2023', Receita: 1600 },
        { name: 'Mai 2023', Receita: 900 },
        { name: 'Jun 2023', Receita: 1700 }
      );
    }
    setRevenueData(formattedRevenueData);

    // Calculate Tools Status Data
    const available = inventory.filter((i: any) => i.status === 'disponivel').length;
    const rented = inventory.filter((i: any) => i.status === 'alugada').length;
    const maintenance = inventory.filter((i: any) => i.status === 'manutencao').length;

    const statusData = [
      { name: 'Disponível', value: available || 10, color: '#10b981' }, // Emerald
      { name: 'Alugada', value: rented || 5, color: '#3b82f6' }, // Blue
      { name: 'Manutenção', value: maintenance || 2, color: '#f59e0b' }, // Amber
    ];
    setToolsStatusData(statusData);

    // Calculate Top Tools (Mocked based on inventory if no rentals exist)
    const toolCounts: Record<string, number> = {};
    rentals.forEach((r: any) => {
      toolCounts[r.tool] = (toolCounts[r.tool] || 0) + 1;
    });

    let topTools = Object.keys(toolCounts)
      .map(key => ({ name: key, Locações: toolCounts[key] }))
      .sort((a, b) => b.Locações - a.Locações)
      .slice(0, 5);

    if (topTools.length === 0 && inventory.length > 0) {
      topTools = inventory.slice(0, 5).map((i: any, index: number) => ({
        name: i.name,
        Locações: 10 - index
      }));
    } else if (topTools.length === 0) {
      topTools = [
        { name: 'Martelete Bosch', Locações: 24 },
        { name: 'Betoneira 400L', Locações: 18 },
        { name: 'Serra Circular', Locações: 15 },
        { name: 'Furadeira Makita', Locações: 12 },
        { name: 'Andaime Tubular', Locações: 8 },
      ];
    }
    setTopToolsData(topTools);

  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios e Dashboards</h1>
          <p className="text-slate-500 text-sm mt-1">Visão geral do desempenho e métricas da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimir
          </button>
          <button className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Receita Total</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
              <span className="material-symbols-outlined text-sm">payments</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Locações Ativas</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined text-sm">handyman</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeRentals}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Total de Ferramentas</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
              <span className="material-symbols-outlined text-sm">inventory_2</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTools}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Total de Clientes</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined text-sm">group</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalClients}</h3>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Receita por Mês</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="Receita" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tools Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Ferramentas Mais Alugadas</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topToolsData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Locações" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-lg mb-6">Status do Inventário</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={toolsStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {toolsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
