import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { formatDate } from '../utils/formatters';

export default function SystemLogs() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [filter, setFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['system-logs', companyId, filter],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID not found");

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('severity', filter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'warning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs do Sistema</h1>
          <p className="text-slate-500 mt-1">Histórico de atividades e auditoria da empresa.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
           {['all', 'info', 'warning', 'critical'].map(s => (
             <button 
               key={s} 
               onClick={() => setFilter(s)}
               className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === s ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {s.toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ação</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Recurso</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Severidade</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Metadados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Carregando registros...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum log encontrado.</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatDate(log.created_at)} {new Date(log.created_at).toLocaleTimeString()}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{log.action.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {log.resource} <span className="text-[10px] opacity-60">#{log.resource_id?.substring(0,8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[200px] truncate group relative">
                       <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 cursor-help">Ver JSON</span>
                       <div className="hidden group-hover:block absolute bottom-full left-0 z-50 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-mono whitespace-pre w-[300px] shadow-2xl">
                          {JSON.stringify(log.metadata, null, 2)}
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
