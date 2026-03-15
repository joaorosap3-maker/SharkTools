import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRentals } from '../hooks/useRentals';
import { useMasterData } from '../hooks/useMasterData';
import { useAvailability } from '../hooks/useAvailability';
import { useContracts } from '../hooks/useContracts';
import { useAuth } from '../components/AuthProvider';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function NewRental() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { useRental, createRental, updateRental, isCreating, isUpdating } = useRentals();
  const { useClients, useEquipment } = useMasterData();
  const { checkAvailability } = useAvailability();
  const { useTemplates, useRentalContracts, generateContract, isGenerating } = useContracts();
  
  const { data: rental, isLoading: isRentalLoading } = useRental(id || '');
  const { data: clients } = useClients();
  const { data: equipment } = useEquipment();
  const { data: templates } = useTemplates();
  const { data: generatedContracts, isLoading: isContractsLoading } = useRentalContracts(id || '');

  const [clientId, setClientId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'cancelled' | 'overdue'>('active');
  const [isChecking, setIsChecking] = useState(false);
  const [conflict, setConflict] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    if (id && rental) {
      setClientId(rental.client_id);
      setEquipmentId(rental.equipment_id);
      setStartDate(rental.start_date?.split('T')[0] || '');
      setEndDate(rental.end_date?.split('T')[0] || '');
      setNotes(rental.notes || '');
      setStatus(rental.status);
    }
  }, [id, rental]);

  useEffect(() => {
    if (templates && templates.length > 0) {
      setSelectedTemplate(templates[0].id!);
    }
  }, [templates]);

  // Real-time availability warning
  useEffect(() => {
    const triggerCheck = async () => {
      if (equipmentId && startDate && endDate) {
        setIsChecking(true);
        try {
          const res = await checkAvailability(equipmentId, startDate, endDate);
          if (res) {
            // If it's an object with an ID, check if it's the current rental we're editing
            if (typeof res === 'object' && res.id === id) {
              setConflict(null);
            } else {
              setConflict(res);
            }
          } else {
            setConflict(null);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsChecking(false);
        }
      }
    };
    triggerCheck();
  }, [equipmentId, startDate, endDate, id, checkAvailability]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (conflict) {
      alert("Este equipamento já está reservado ou em manutenção no período selecionado.");
      return;
    }

    const rentalData = {
      company_id: companyId,
      client_id: clientId,
      equipment_id: equipmentId,
      start_date: startDate,
      end_date: endDate || null,
      notes,
      status
    };

    try {
      if (id) {
        await updateRental({ id, rental: rentalData });
      } else {
        const finalCheck = await checkAvailability(equipmentId, startDate, endDate);
        if (finalCheck) {
          if (typeof finalCheck === 'object' && finalCheck.id === id) {
            // Self-conflict ignored
          } else {
            alert("Conflito detectado: Este equipamento não está mais disponível nas datas selecionadas.");
            return;
          }
        }
        await createRental(rentalData);
      }
      navigate('/locacoes');
    } catch (err: any) {
      alert('Erro ao salvar locação: ' + err.message);
    }
  };

  const handleGenerateContract = async () => {
    if (!id || !selectedTemplate) return;
    try {
      await generateContract({ rentalId: id, templateId: selectedTemplate });
      alert("Contrato gerado com sucesso!");
    } catch (err: any) {
      alert("Erro ao gerar contrato: " + err.message);
    }
  };

  if (id && isRentalLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      </div>
    );
  }

  const selectedEquip = equipment?.find(e => e.id === equipmentId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {id ? 'Editar Locação' : 'Nova Locação'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {id ? `Detalhes do contrato #${id.substring(0,8)}` : 'Crie um novo contrato de aluguel de equipamentos.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/locacoes')}
          className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">close</span>
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="material-symbols-outlined text-primary">person</span>
                Informações Básicas
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente</label>
                  <select
                    required
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Equipamento</label>
                  <select
                    required
                    value={equipmentId}
                    onChange={e => setEquipmentId(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 ${conflict ? 'border-rose-500 ring-rose-500/10' : ''}`}
                  >
                    <option value="">Selecione um equipamento</option>
                    {equipment?.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                    ))}
                  </select>
                  {isChecking && <p className="text-[10px] text-primary animate-pulse mt-1 uppercase font-bold">Verificando...</p>}
                  {conflict && (
                    <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] text-rose-600 font-bold">
                        ⚠️ Equipamento indisponível no período!
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                Período e Status
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Retirada</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Devolução</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                {(['active', 'completed', 'cancelled', 'overdue'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setStatus(s)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${status === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{s === 'active' ? 'Ativa' : s === 'completed' ? 'Finalizada' : s === 'cancelled' ? 'Cancelada' : 'Atrasada'}</button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isCreating || isUpdating || !!conflict} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50">
              {isCreating || isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>

          {/* Contract History System */}
          {id && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  Contratos Gerados
                </h2>
                <div className="flex items-center gap-2">
                   <select 
                     value={selectedTemplate} 
                     onChange={e => setSelectedTemplate(e.target.value)}
                     className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                   >
                     {templates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                   <button 
                     onClick={handleGenerateContract}
                     disabled={isGenerating || !selectedTemplate}
                     className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                   >
                     {isGenerating ? 'Gerando...' : <><span className="material-symbols-outlined text-sm">add</span> Gerar Contrato</>}
                   </button>
                </div>
              </div>

              <div className="space-y-3">
                {isContractsLoading ? (
                   <p className="text-center text-xs text-slate-400 py-4 italic">Carregando históricos...</p>
                ) : generatedContracts?.length === 0 ? (
                   <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500">Nenhum contrato gerado para esta locação.</p>
                   </div>
                ) : (
                  generatedContracts?.map((contract: any) => (
                    <div key={contract.id} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl group gap-4">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="size-10 bg-white dark:bg-slate-700 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600">
                                <span className="material-symbols-outlined text-rose-500">picture_as_pdf</span>
                             </div>
                             <div>
                                <p className="text-xs font-bold">Contrato de Locação</p>
                                <p className="text-[10px] text-slate-500">Gerado em {new Date(contract.generated_at).toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               contract.status === 'signed' 
                               ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                               : 'bg-amber-100 text-amber-700 border border-amber-200'
                             }`}>
                                {contract.status === 'signed' ? 'Assinado' : 'Pendente Assinatura'}
                             </span>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <a 
                            href={contract.pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Ver PDF
                          </a>
                          
                          {contract.status !== 'signed' && (
                             <button
                               onClick={() => {
                                 const link = `${window.location.origin}/assinatura/${contract.id}`;
                                 navigator.clipboard.writeText(link);
                                 alert("Link de assinatura copiado! Envie para o cliente.");
                               }}
                               className="flex-1 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                             >
                               <span className="material-symbols-outlined text-sm">share</span>
                               Enviar Assinatura
                             </button>
                          )}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">Resumo da Obra</h3>
            <div className="space-y-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Item Selecionado</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEquip?.name || '---'}</p>
                <p className="text-xs text-primary font-bold">{selectedEquip?.daily_price ? formatCurrency(selectedEquip.daily_price) : '-'}</p>
              </div>
              <div className="flex justify-between items-center text-sm px-1">
                 <span className="text-slate-500 font-medium">Dias total</span>
                 <span className="font-bold">
                    {startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24))) : 0}
                 </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                 <span className="text-sm font-bold">Total Estimado</span>
                 <span className="text-lg font-black text-primary">
                    {startDate && endDate && selectedEquip ? formatCurrency(selectedEquip.daily_price * Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)))) : formatCurrency(0)}
                 </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
