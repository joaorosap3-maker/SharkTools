import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Rentals() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          clients (id, name, email, phone),
          equipment_assets (id, name),
          invoices (id, total)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta locação?')) {
      try {
        const { error } = await supabase
          .from('rentals')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setRentals(rentals.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting rental:', error);
        alert('Erro ao excluir locação. Esta locação pode ter um pagamento vinculado.');
      }
    }
  };

  const getClientName = (rental: any) => {
    return rental.clients ? rental.clients.name : 'Cliente não encontrado';
  };

  const getClientDoc = (rental: any) => {
    return rental.clients ? (rental.clients.email || rental.clients.phone || '') : '';
  };

  const getRentalTotal = (rental: any) => {
    if (rental.invoices && rental.invoices.length > 0) {
      // Sum all invoice totals if multiple
      return rental.invoices.reduce((acc: number, inv: any) => acc + (inv.total || 0), 0);
    }
    // Fallback if no invoices yet
    return rental.total || 0;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'finalizada': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      case 'atrasada': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-blue-500';
      case 'finalizada': return 'bg-slate-500';
      case 'atrasada': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredRentals = rentals.filter(rental => {
    const clientName = getClientName(rental).toLowerCase();
    const search = searchTerm.toLowerCase();
    return rental.id.toLowerCase().includes(search) || clientName.includes(search);
  });

  const activeCount = rentals.filter(r => r.status === 'ativa').length;
  const lateCount = rentals.filter(r => r.status === 'atrasada').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locações</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie contratos, devoluções e status de aluguéis.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/locacoes/nova" className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Locação
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">assignment</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Locações Ativas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total de Locações</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{rentals.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Atrasadas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{lateCount}</p>
          </div>
        </div>
      </div>

      {/* Rentals List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Buscar por cliente ou contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Contrato</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Período</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Valor Total</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 relative">
              {isLoading && (
                <tr>
                  <td colSpan={6}>
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10 min-h-[200px]">
                      <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filteredRentals.map(rental => {
                // If it's a new system rental, it has equipment_id (1 item)
                // If it's old mocked data, we could fallback on rental.items length
                const totalItems = rental.equipment_id ? 1 : (rental.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0);

                return (
                  <tr key={rental.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary dark:text-white">#{rental.id.substring(0, 8)}</span>
                      <div className="text-xs text-slate-500 mt-1">{totalItems} {totalItems === 1 ? 'item' : 'itens'} {rental.equipment_assets ? `(${rental.equipment_assets.name})` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{getClientName(rental)}</span>
                        <span className="text-xs text-slate-500">{getClientDoc(rental)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(rental.start_date || rental.startDate)} - {formatDate(rental.end_date || rental.endDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(rental.status)}`}>
                        <span className={`size-1.5 rounded-full ${getStatusDot(rental.status)}`}></span>
                        {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(getRentalTotal(rental))}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/locacoes/editar/${rental.id}`} className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </Link>
                        <button onClick={() => handleDelete(rental.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filteredRentals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma locação encontrada.
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
