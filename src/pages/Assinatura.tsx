import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { contractService } from '../services/contractService';
import SignaturePad from '../components/SignaturePad';
import { formatCurrency } from '../utils/formatters';

export default function Assinatura() {
  const { contract_id } = useParams<{ contract_id: string }>();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContract();
  }, [contract_id]);

  const fetchContract = async () => {
    try {
      if (!contract_id) return;
      
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          rentals (
            *,
            clients (name, document),
            equipment_assets (name, code),
            companies (name)
          )
        `)
        .eq('id', contract_id)
        .single();

      if (error) throw error;
      setContract(data);
      if (data.status === 'signed') setSigned(true);
    } catch (err: any) {
      setError('Contrato não encontrado ou link expirado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    if (!contract_id) return;
    
    try {
      setSigning(true);
      
      // Get user IP (simple approach via public API or just skip for MVP if needed)
      // For this implementation, we'll try to get it from a public service
      let ip = 'unknown';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
      } catch (e) { console.warn("Could not get IP", e); }

      await contractService.addSignatureToContract(contract_id, signatureDataUrl, ip);
      setSigned(true);
    } catch (err: any) {
      alert("Erro ao assinar contrato: " + err.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400">
        <span className="material-symbols-outlined animate-spin text-4xl">loading</span>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center space-y-4">
          <div className="size-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Ops! Algo deu errado</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const rental = contract.rentals;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-display">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">verified</span>
             </div>
             <div>
                <h1 className="font-bold text-slate-900 dark:text-white leading-none">Assinatura Digital</h1>
                <p className="text-xs text-slate-500 mt-1">{rental.companies.name}</p>
             </div>
          </div>
          {signed && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
               <span className="material-symbols-outlined text-sm">check_circle</span>
               Contrato Assinado
            </span>
          )}
        </div>

        {signed ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="size-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
               <span className="material-symbols-outlined text-5xl">check_seal</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Assinatura Concluída!</h2>
              <p className="text-slate-500">Obrigado, seu contrato foi assinado digitalmente e já está nos nossos sistemas.</p>
            </div>
            <div className="pt-4">
              <a 
                href={contract.pdf_url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined">download</span>
                Visualizar Contrato Assinado
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Contract Summary */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo da Locação</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Cliente</p>
                   <p className="font-bold text-slate-900 dark:text-white">{rental.clients.name}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Documento</p>
                   <p className="font-bold text-slate-900 dark:text-white">{(rental.clients as any).document || '---'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Equipamento</p>
                   <p className="font-bold text-slate-900 dark:text-white">{rental.equipment_assets.name}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p>
                   <p className="font-bold text-primary">{formatCurrency(rental.total_value)}</p>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-6">
               <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sua Assinatura</h2>
                  <p className="text-sm text-slate-500">Desenhe sua assinatura no campo abaixo para validar o contrato.</p>
               </div>

               {signing ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 text-primary">
                    <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
                    <p className="font-bold animate-pulse">Processando sua assinatura...</p>
                  </div>
               ) : (
                  <SignaturePad onSave={handleSign} />
               )}

               <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3">
                  <span className="material-symbols-outlined text-slate-400">gavel</span>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Ao confirmar, você concorda que esta assinatura é equivalente à sua assinatura manuscrita para todos os fins legais deste contrato, conforme MP nº 2.200-2/2001. Registraremos seu endereço IP e métricas biométricas de desenho.
                  </p>
               </div>
            </div>
            
            {/* View PDF Preview Button */}
            <div className="flex justify-center">
              <button 
                onClick={() => window.open(contract.pdf_url, '_blank')}
                className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                Visualizar texto completo do contrato
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">SharkTools • Sistema de Assinatura Segura</p>
        </div>
      </div>
    </div>
  );
}
