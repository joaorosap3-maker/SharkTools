import React, { useState, useEffect } from 'react';
import {
  getDashboardMetrics,
  getFaturamentoMensal,
  getLocacoesPorCategoria,
  getAtividadeRecente
} from '../services/dashboardService';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    faturamentoDia: 0,
    locacoesAtivas: 0,
    ferramentasAlugadas: 0,
    ferramentasDisponiveis: 0,
    clientesMes: 0,
    recebimentosMes: 0,
  });

  const [faturamentoMensal, setFaturamentoMensal] = useState<any[]>([]);
  const [locacoesCategoria, setLocacoesCategoria] = useState<any>({ categories: [], total: 0 });
  const [atividadeRecente, setAtividadeRecente] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dashboardMetrics = await getDashboardMetrics();
      const faturamento = await getFaturamentoMensal();
      const locacoesCat = await getLocacoesPorCategoria();
      const recents = await getAtividadeRecente();

      setMetrics(dashboardMetrics);
      setFaturamentoMensal(faturamento);
      setLocacoesCategoria(locacoesCat);
      setAtividadeRecente(recents);
    } catch (error) {
      console.error("Dashboard error loading Data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativa': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'atrasada': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      case 'finalizada': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const categoryColors = ['bg-primary', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];

  // Calculate max value for chart scaling
  const maxFaturamento = Math.max(...faturamentoMensal.map(m => m.total), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          <p className="text-slate-500 font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto w-full">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Faturamento do dia</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary dark:text-white">{formatCurrency(metrics.faturamentoDia)}</h3>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-emerald-500 flex items-center text-xs font-bold">
              <span className="material-symbols-outlined text-xs">trending_up</span>
            </span>
            <span className="text-slate-400 text-xs font-medium">hoje</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Locações ativas</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">assignment</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary dark:text-white">{metrics.locacoesAtivas}</h3>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-slate-400 text-xs font-medium">em andamento</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Ferramentas alugadas</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
              <span className="material-symbols-outlined">construction</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary dark:text-white">{metrics.ferramentasAlugadas}</h3>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-slate-400 text-xs font-medium">em uso</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Ferramentas disponíveis</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
              <span className="material-symbols-outlined">inventory</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary dark:text-white">{metrics.ferramentasDisponiveis}</h3>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-slate-400 text-xs font-medium">em estoque</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Clientes novos</span>
            <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 rounded-lg">
              <span className="material-symbols-outlined">group_add</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary dark:text-white">{metrics.clientesMes}</h3>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-slate-400 text-xs font-medium">neste mês</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Recebimentos do mês</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary dark:text-white">{formatCurrency(metrics.recebimentosMes)}</h3>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-slate-400 text-xs font-medium">neste mês</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart: Revenue */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-primary dark:text-white font-bold text-lg leading-none">Faturamento Mensal</h4>
              <p className="text-slate-500 text-sm mt-1">Análise de desempenho Jan - Jun</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Exportar</button>
            </div>
          </div>
          <div className="flex items-end justify-between h-64 px-4 gap-4">
            {faturamentoMensal.map((data, index) => {
              const heightPercentage = data.total > 0 ? Math.max((data.total / maxFaturamento) * 100, 10) : 5;
              return (
                <div key={index} className="flex flex-col items-center flex-1 gap-3">
                  <div
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group transition-all duration-500"
                    style={{ height: `${heightPercentage}%` }}
                  >
                    <div className="absolute bottom-0 w-full bg-primary/60 group-hover:bg-primary transition-all rounded-t-lg h-full">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                        {formatCurrency(data.total)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart: Categories */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h4 className="text-primary dark:text-white font-bold text-lg leading-none">Categorias de Locação</h4>
            <p className="text-slate-500 text-sm mt-1">Distribuição por demanda</p>
          </div>
          <div className="relative h-48 w-48 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-slate-100 dark:text-slate-800" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="20"></circle>

              {locacoesCategoria.categories.length > 0 && (() => {
                let currentOffset = 0;
                const circumference = 251.2; // 2 * PI * 40

                return locacoesCategoria.categories.map((cat: any, index: number) => {
                  const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -currentOffset;
                  currentOffset += (cat.percentage / 100) * circumference;

                  // Extract color class name without 'bg-'
                  const colorClass = categoryColors[index % categoryColors.length].replace('bg-', 'text-');

                  return (
                    <circle
                      key={cat.name}
                      className={colorClass}
                      cx="50" cy="50" fill="transparent" r="40"
                      stroke="currentColor"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeWidth="20"
                    ></circle>
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-primary dark:text-white">{locacoesCategoria.total}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            </div>
          </div>
          <div className="space-y-2">
            {locacoesCategoria.categories.length > 0 ? (
              locacoesCategoria.categories.map((cat: any, index: number) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`size-3 rounded-full ${categoryColors[index % categoryColors.length]}`}></span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary dark:text-white">{cat.percentage}%</span>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-slate-500">Sem dados de locação</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h4 className="text-primary dark:text-white font-bold text-lg leading-none">Atividade Recente</h4>
          <button className="text-primary dark:text-white text-xs font-bold hover:underline">Ver todas as atividades</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Ferramenta</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Data Início</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {atividadeRecente.length > 0 ? (
                atividadeRecente.map((atividade) => (
                  <tr key={atividade.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold text-xs">
                          {atividade.clientInitials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary dark:text-white">{atividade.clientName}</span>
                          <span className="text-[10px] text-slate-500">Doc: {atividade.clientDoc}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{atividade.toolName}</span>
                        <span className="text-[10px] text-slate-500">ID: {atividade.toolCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(atividade.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(atividade.status)}`}>
                        {atividade.status.charAt(0).toUpperCase() + atividade.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-primary dark:text-white">{formatCurrency(atividade.total)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma atividade recente encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
