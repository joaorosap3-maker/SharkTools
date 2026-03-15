import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../services/clientPortalService';
import PortalLayout from '../components/PortalLayout';
import { formatCurrency, formatDate } from '../utils/formatters';

interface PortalData {
  rentals: any[];
  contracts: any[];
  invoices: any[];
}

export default function ClientPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const token = sessionStorage.getItem('client_portal_token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const sessionData = await clientPortalService.validateToken(token);
        if (!sessionData) {
          navigate('/');
          return;
        }

        setSession(sessionData);
        const data = await clientPortalService.getPortfolioData(sessionData.client_id, sessionData.tenant_id);
        setPortalData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || !portalData) return null;

  return (
    <PortalLayout 
      clientName={session.client.name} 
      companyName={session.client.company.name}
      companyLogo={session.client.company.logo_url}
    >
      <div className="space-y-12">
        {/* Sections: Rentals */}
        <section id="rentals" className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-primary text-3xl">construction</span>
            <h2 className="text-2xl font-black uppercase tracking-tight">Minhas Locações</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portalData.rentals.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8">Nenhuma locação ativa encontrada.</p>
            ) : (
              portalData.rentals.map(rental => (
                <div key={rental.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Equipamento</p>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white uppercase">{rental.equipment.name}</h3>
                        <p className="text-xs text-slate-500">TAG: {rental.equipment.code}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        rental.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                        rental.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rental.status === 'active' ? 'Ativa' : rental.status === 'overdue' ? 'Atrasada' : rental.status}
                      </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800/50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Início</p>
                        <p className="text-sm font-bold">{formatDate(rental.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Devolução</p>
                        <p className="text-sm font-bold">{rental.end_date ? formatDate(rental.end_date) : 'Indeterminado'}</p>
                      </div>
                   </div>
                   
                   <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500">Diária</span>
                      <span className="text-sm font-black text-primary">{formatCurrency(rental.equipment.daily_price)}</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Sections: Contracts */}
        <section id="contracts" className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-primary text-3xl">description</span>
            <h2 className="text-2xl font-black uppercase tracking-tight">Documentos & Contratos</h2>
          </div>

          <div className="space-y-3">
             {portalData.contracts.length === 0 ? (
               <p className="text-slate-500 text-sm italic py-8">Nenhum contrato disponível para visualização.</p>
             ) : (
               portalData.contracts.map(contract => (
                 <div key={contract.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="size-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-800/50">
                          <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold uppercase tracking-tight">Contrato de Locação</p>
                          <p className="text-[10px] text-slate-500 font-medium">#{contract.id.substring(0,8)} • {formatDate(contract.generated_at)}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       {contract.status === 'pending_signature' && (
                         <button 
                           onClick={() => navigate(`/assinatura/${contract.id}`)}
                           className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                         >
                           Assinar Contrato
                         </button>
                       )}
                       
                       <a 
                         href={contract.pdf_url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                       >
                         <span className="material-symbols-outlined text-sm">download</span>
                         {contract.status === 'signed' ? 'Baixar Assinado' : 'Ver PDF'}
                       </a>
                    </div>
                 </div>
               ))
             )}
          </div>
        </section>

        {/* Sections: Invoices */}
        <section id="invoices" className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-primary text-3xl">payments</span>
            <h2 className="text-2xl font-black uppercase tracking-tight">Faturas & Financeiro</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <tr>
                      <th className="px-6 py-4">Fatura</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Emissão</th>
                      <th className="px-6 py-4">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {portalData.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500 italic">
                        Nenhuma fatura encontrada.
                      </td>
                    </tr>
                  ) : (
                    portalData.invoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-slate-200">#{invoice.id.substring(0,8)}</p>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">{formatCurrency(invoice.total)}</p>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs font-medium text-slate-500">{formatDate(invoice.issued_at)}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                             invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                           }`}>
                             {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>
        </section>
      </div>
    </PortalLayout>
  );
}
