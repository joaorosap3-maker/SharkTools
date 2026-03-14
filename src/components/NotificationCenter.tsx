import React from 'react';
import { useDashboard } from '../hooks/useDashboard';

export default function NotificationCenter() {
  const { data: stats } = useDashboard();
  
  // Overdue rentals logic from stats or separate query
  const overdueCount = stats?.overdueRentals || 0;

  if (overdueCount === 0) return null;

  const handleNotify = (type: 'whatsapp' | 'email') => {
    alert(`Preparando alerta de ${type} para as ${overdueCount} locações em atraso...\n(Funcionalidade de integração em desenvolvimento na Fase 3)`);
  };

  return (
    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg ring-4 ring-rose-500/10">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400">Atenção: Itens em Atraso</h3>
            <p className="text-sm text-rose-700 dark:text-rose-500 mt-1">
              Existem **{overdueCount}** locações com prazo de devolução vencido. Deseja notificar os clientes?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNotify('whatsapp')}
            className="flex-1 md:flex-none px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            WhatsApp
          </button>
          <button 
            onClick={() => handleNotify('email')}
            className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">mail</span>
            E-mail
          </button>
        </div>
      </div>
    </div>
  );
}
