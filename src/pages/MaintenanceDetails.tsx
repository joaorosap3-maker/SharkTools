import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMaintenance } from '../hooks/useMaintenance';
import { useMasterData } from '../hooks/useMasterData';
import { useAuth } from '../components/AuthProvider';

export default function MaintenanceDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { useMaintenanceOrder, createOrder, updateOrder, isCreating, isUpdating } = useMaintenance();
  const { useEquipment } = useMasterData();
  
  const { data: order, isLoading: isOrderLoading } = useMaintenanceOrder(id || '');
  const { data: equipment } = useEquipment();

  const [title, setTitle] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('scheduled');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState(0);
  const [technician, setTechnician] = useState('');

  useEffect(() => {
    if (id && order) {
      setTitle(order.title);
      setEquipmentId(order.equipment_id);
      setDescription(order.description || '');
      setStatus(order.status);
      setPriority(order.priority);
      setStartDate(order.start_date || '');
      setEndDate(order.end_date || '');
      setCost(order.cost || 0);
      setTechnician(order.technician || '');
    }
  }, [id, order]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const orderData = {
      company_id: companyId,
      equipment_id: equipmentId,
      title,
      description,
      status,
      priority,
      start_date: startDate || null,
      end_date: endDate || null,
      cost,
      technician
    };

    try {
      if (id) {
        await updateOrder({ id, order: orderData });
      } else {
        await createOrder(orderData);
      }
      navigate('/manutencoes');
    } catch (err: any) {
      alert('Erro ao salvar ordem de manutenção: ' + err.message);
    }
  };

  if (id && isOrderLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {id ? 'Editar Ordem de Manutenção' : 'Nova Ordem de Manutenção'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {id ? `Ajuste os detalhes da manutenção #${id.substring(0,8)}` : 'Registre uma nova atividade de manutenção para um equipamento.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/manutencoes')}
          className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">close</span>
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título / Assunto</label>
              <input
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Troca de óleo preventiva"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Equipamento</label>
              <select
                required
                value={equipmentId}
                onChange={e => setEquipmentId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione um equipamento</option>
                {equipment?.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Técnico Responsável</label>
              <input
                type="text"
                value={technician}
                onChange={e => setTechnician(e.target.value)}
                placeholder="Nome do técnico ou oficina"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Inicial</label>
              <input
                required
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Previsão de Término</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prioridade</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      priority === p 
                        ? (p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white')
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custo Estimado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={e => setCost(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição / Diagnóstico</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o problema ou as peças a serem trocadas..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status da Manutenção</label>
            <div className="flex gap-2 flex-wrap">
              {(['scheduled', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    status === s 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {status === 'in_progress' && (
              <p className="text-[10px] text-orange-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs animate-pulse">warning</span>
                Isso alterará o status do equipamento para "Manutenção" automaticamente.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/manutencoes')}
            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Sair sem salvar
          </button>
          <button
            disabled={isCreating || isUpdating}
            type="submit"
            className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isCreating || isUpdating ? 'Salvando...' : 'Salvar Ordem'}
          </button>
        </div>
      </form>
    </div>
  );
}
