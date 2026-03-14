import { useDashboard } from "../hooks/useDashboard";
import NotificationCenter from "../components/NotificationCenter";

export default function Dashboard() {
  const { data: stats, isLoading, isError, error, refetch } = useDashboard();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 animate-pulse font-medium">Carregando painel v1.0.3...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
        <h2 className="text-red-700 dark:text-red-400 font-bold text-lg">Erro ao carregar Dashboard</h2>
        <p className="text-red-600 dark:text-red-500 mt-2">{(error as any)?.message || "Ocorreu um erro inesperado."}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Nenhum dado disponível.</h2>
      </div>
    );
  }

  const rentals = stats.recentRentals || [];

  const statsItems = [
    { label: "Receita Total", value: `R$ ${stats.totalRevenue.toLocaleString() || "0,00"}`, icon: "payments", color: "bg-green-500" },
    { label: "Locações Ativas", value: stats.activeRentals || 0, icon: "receipt_long", color: "bg-blue-500" },
    { label: "Equipamentos Disponíveis", value: stats.availableEquipment || 0, icon: "inventory_2", color: "bg-yellow-500" },
    { label: "Locações em Atraso", value: stats.overdueRentals || 0, icon: "error", color: "bg-red-500" },
  ];

  return (
    <div className="p-6 pb-20 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 dark:text-slate-400">Bem-vindo ao SharkTools v1.0.3</p>
        </div>
      </div>

      <NotificationCenter />

      {/* GRID DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsItems.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className={`${item.color} p-3 rounded-xl text-white shadow-lg`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LOCAÇÕES RECENTES */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Locações Recentes</h2>
          <button className="text-primary hover:text-primary-dark text-sm font-semibold transition-colors">Ver todas</button>
        </div>

        <div className="overflow-x-auto">
          {rentals.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">Nenhuma locação ativa no momento.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Equipamento</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Data Início</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rentals.map((rental: any) => (
                  <tr key={rental.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {rental.clients?.name || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {rental.equipment_assets?.name || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rental.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        rental.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {rental.status === 'active' ? 'Ativo' : rental.status === 'overdue' ? 'Atrasado' : 'Encerrado'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(rental.start_date).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}