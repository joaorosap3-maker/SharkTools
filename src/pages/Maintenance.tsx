import React from 'react';
import { Link } from 'react-router-dom';
import { useMaintenance } from '../hooks/useMaintenance';
import { formatDate, formatCurrency } from '../utils/formatters';

export default function Maintenance() {
  const { useMaintenanceList, deleteOrder, isDeleting } = useMaintenance();
  const { data: orders, isLoading } = useMaintenanceList();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-slate-500 bg-slate-100';
      case 'medium': return 'text-orange-500 bg-orange-100';
      case 'high': return 'text-red-500 bg-red-100';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de manutenção?')) {
      await deleteOrder(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manutenção</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Acompanhe e registre a manutenção preventiva e corretiva dos equipamentos.</p>
        </div>
        <Link 
          to="/manutencoes/nova"
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nova Ordem
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mx-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Equipamento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Título / Técnica</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Prioridade</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data Inicial</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-6 font-bold text-slate-900 dark:text-white">
                    {order.equipment_assets?.name}
                    <span className="block text-[10px] text-slate-400 font-normal">#{order.equipment_assets?.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{order.title}</span>
                      <span className="text-xs text-slate-500">{order.technician || 'Técnico não atribuído'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityStyle(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {order.start_date ? formatDate(order.start_date) : 'Não definida'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/manutencoes/editar/${order.id}`} 
                        className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={isDeleting}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Excluir Ordem"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    Nenhuma ordem de manutenção encontrada.
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
