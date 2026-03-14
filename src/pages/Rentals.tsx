import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { generateRentalContract, ContractData } from '../services/contractService';
import FeatureGuard from '../components/FeatureGuard';

export default function Rentals() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          clients (id, name, email, phone),
          equipment_assets (id, name),
          invoices (id, total, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRentals(data || []);
    } catch (err: any) {
      console.error('Error fetching rentals:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContract = (rental: any) => {
    try {
      const contractData: ContractData = {
        rentalId: rental.id,
        startDate: rental.start_date,
        endDate: rental.end_date,
        status: rental.status,
        totalPrice: rental.invoices?.[0]?.total || 0,
        client: {
          name: rental.clients?.name || 'Cliente Desconhecido',
          email: rental.clients?.email,
          phone: rental.clients?.phone,
        },
        equipment: {
          name: rental.equipment_assets?.name || 'Equipamento',
        }
      };

      generateRentalContract(contractData);
    } catch (err) {
      console.error('Erro ao gerar contrato:', err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-emerald-500';
      case 'cancelled': return 'bg-rose-500';
      default: return 'bg-slate-500';
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Locações</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie todos os contratos e devoluções em um só lugar.</p>
        </div>
        <Link 
          to="/locacoes/nova"
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nova Locação
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mx-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contrato / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Datas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {rentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white mb-1">#{rental.id.substring(0, 8).toUpperCase()}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{rental.clients?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">construction</span>
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{rental.equipment_assets?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(rental.invoices?.[0]?.total || 0)}</span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex flex-col gap-1 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        De: {formatDate(rental.start_date)}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                        Até: {rental.end_date ? formatDate(rental.end_date) : 'Indefinido'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(rental.status)}`}>
                      <span className={`size-1.5 rounded-full ${getStatusDot(rental.status)}`}></span>
                      {rental.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <FeatureGuard feature="pdf_contracts" hideOnly={false}>
                        <button
                          onClick={() => handleGenerateContract(rental)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Gerar Contrato (PDF)"
                        >
                          <span className="material-symbols-outlined text-lg">description</span>
                        </button>
                      </FeatureGuard>
                      <Link to={`/locacoes/editar/${rental.id}`} className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rentals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
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
