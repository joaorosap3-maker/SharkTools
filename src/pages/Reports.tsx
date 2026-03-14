import React from 'react';
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
import { useReports } from '../hooks/useReports';
import FeatureGuard from '../components/FeatureGuard';

export default function Reports() {
  const { data, isLoading, isError, error, refetch } = useReports();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 animate-pulse font-medium">Gerando relatórios v1.0.3...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 space-y-4">
        <h2 className="text-red-700 dark:text-red-400 font-bold text-lg">Erro ao carregar Relatórios</h2>
        <p className="text-red-600 dark:text-red-500 italic">{(error as any)?.message || "Ocorreu um erro inesperado."}</p>
        <button 
          onClick={() => refetch()}
          className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const { revenueData, toolsStatusData, topToolsData, stats } = data || {
    revenueData: [],
    toolsStatusData: [],
    topToolsData: [],
    stats: { totalRevenue: 0, activeRentals: 0, totalTools: 0 }
  };

  return (
    <FeatureGuard feature="advanced_reports">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Relatórios e Dashboards</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Visão analítica do desempenho v1.0.3.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">print</span>
              Imprimir
            </button>
            <button className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar PDF
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Receita Total</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Locações Ativas</span>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                <span className="material-symbols-outlined text-lg">handyman</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeRentals}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Equipamentos</span>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalTools}</h3>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Faturamento Mensal</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  />
                  <Bar dataKey="Receita" fill="#1e293b" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Tools Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Equipamentos em Alta</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={topToolsData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Locações" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Disponibilidade Geral</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={toolsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {toolsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
}
