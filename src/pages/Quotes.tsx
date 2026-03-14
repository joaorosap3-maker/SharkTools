import React from 'react';
import { Link } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { formatDate, formatCurrency } from '../utils/formatters';

export default function Quotes() {
  const { useQuotesList, deleteQuote, convertToRental, isDeleting, isConverting } = useQuotes();
  const { data: quotes, isLoading } = useQuotesList();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      await deleteQuote(id);
    }
  };

  const handleConvert = async (id: string) => {
    if (window.confirm('Deseja converter este orçamento aprovado em uma locação ativa?')) {
      try {
        await convertToRental(id);
        alert('Locação criada com sucesso!');
      } catch (err: any) {
        alert(err.message);
      }
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Orçamentos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie propostas comerciais e converta-as em locações.</p>
        </div>
        <Link 
          to="/orcamentos/novo"
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Novo Orçamento
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mx-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Título / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Validade</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Valor Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {quotes?.map((quote: any) => (
                <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white mb-1">{quote.title}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{quote.clients?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {quote.valid_until ? formatDate(quote.valid_until) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(quote.total_value)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {quote.status === 'approved' && (
                        <button
                          onClick={() => handleConvert(quote.id)}
                          disabled={isConverting}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Converter em Locação"
                        >
                          <span className="material-symbols-outlined text-lg">sync_alt</span>
                        </button>
                      )}
                      <Link 
                        to={`/orcamentos/editar/${quote.id}`} 
                        className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        disabled={isDeleting}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Excluir Orçamento"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    Nenhum orçamento encontrado.
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
