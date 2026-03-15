import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { useAvailability } from '../hooks/useAvailability';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Tool {
  id: string;
  name: string;
  code: string;
  category: string; 
  manufacturer: string;
  serialNumber: string;
  replacementValue: number;
  status: 'available' | 'rented' | 'maintenance';
  dailyPrice: number; 
  lastMaintenance: string; 
}

export default function Inventory() {
  const { profile } = useAuth();
  const { useEquipmentTimeline, useAvailabilityMetrics } = useAvailability();
  const { data: metrics = [], isLoading: isLoadingMetrics } = useAvailabilityMetrics();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const userCompanyId = profile?.company_id;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [viewingTool, setViewingTool] = useState<Tool | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    code: '',
    category: '',
    manufacturer: '',
    serialNumber: '',
    replacementValue: 0,
    status: 'available',
    dailyPrice: 0,
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (userCompanyId) {
      fetchTools();
    }
  }, [userCompanyId]);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      const { data: equipments, error } = await supabase
        .from('equipment_assets')
        .select('*')
        .eq('company_id', userCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (equipments) {
        const mappedTools: Tool[] = equipments.map((eq: any) => ({
          id: eq.id,
          name: eq.name || '',
          code: eq.code || '',
          category: eq.type || eq.category || '',
          manufacturer: eq.manufacturer || '',
          serialNumber: eq.serial_number || '',
          replacementValue: eq.replacement_value || 0,
          status: eq.status || 'available',
          dailyPrice: eq.daily_price || 0,
          lastMaintenance: eq.last_maintenance || '',
        }));
        setTools(mappedTools);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData(tool);
    } else {
      setEditingTool(null);
      setFormData({
        name: '',
        code: '',
        category: '',
        status: 'available',
        dailyPrice: 0,
        lastMaintenance: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCompanyId) return;

    try {
      setIsSaving(true);
      const dbPayload = {
        name: formData.name,
        code: formData.code,
        type: formData.category,
        manufacturer: formData.manufacturer,
        serial_number: formData.serialNumber,
        replacement_value: formData.replacementValue,
        status: formData.status,
        daily_price: formData.dailyPrice,
        last_maintenance: formData.lastMaintenance || null,
        company_id: userCompanyId
      };

      if (editingTool) {
        const { error } = await supabase
          .from('equipment_assets')
          .update(dbPayload)
          .eq('id', editingTool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment_assets')
          .insert([dbPayload]);
        if (error) throw error;
      }

      await fetchTools();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('Erro ao salvar ferramenta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTool = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta ferramenta?')) {
      try {
        const { error } = await supabase
          .from('equipment_assets')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setTools(tools.filter(t => t.id !== id));
      } catch (error) {
        alert('Erro ao excluir ferramenta. Ela pode estar vinculada a uma locação.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            Disponível
          </span>
        );
      case 'rented':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <span className="size-1.5 rounded-full bg-blue-500"></span>
            Alugado
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500"></span>
            Manutenção
          </span>
        );
      default: return null;
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || tool.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventário de Ferramentas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie seu catálogo, estoque e disponibilidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Ferramenta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map((m: any) => (
          <div key={m.name} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
             <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2">{m.name}</h3>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{m.category}</span>
             </div>
             <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="font-bold text-slate-900 dark:text-white">{m.total}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Disp.</p>
                    <p className="font-bold text-emerald-600">{m.available}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <p className="text-[9px] font-bold text-blue-600 uppercase">Loc.</p>
                    <p className="font-bold text-blue-600">{m.rented}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-xl border border-amber-100 dark:border-amber-800/30">
                    <p className="text-[9px] font-bold text-amber-600 uppercase">Mnt.</p>
                    <p className="font-bold text-amber-600">{m.maintenance}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Main List */}
        <div className={`space-y-6 transition-all duration-300 ${viewingTool ? 'w-full lg:w-2/3' : 'w-full'}`}>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'available', 'rented', 'maintenance'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab === 'all' ? 'Todos' : tab === 'available' ? 'Disponíveis' : tab === 'rented' ? 'Alugados' : 'Em Manutenção'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Buscar ferramenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center"><span className="material-symbols-outlined animate-spin text-primary">loading</span></td></tr>
                            ) : filteredTools.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Nenhum item encontrado.</td></tr>
                            ) : filteredTools.map((tool) => (
                                <tr 
                                  key={tool.id} 
                                  onClick={() => setViewingTool(tool)}
                                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors group ${viewingTool?.id === tool.id ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{tool.name}</span>
                                            <span className="text-xs text-slate-500">#{tool.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(tool.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(tool); }} className="p-1.5 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                                            <button onClick={(e) => handleDeleteTool(tool.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Info Panel / Timeline */}
        {viewingTool && (
          <div className="hidden lg:block w-1/3 animate-in slide-in-from-right duration-300">
             <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                   <h3 className="font-bold text-lg">Detalhes & Agenda</h3>
                   <button onClick={() => setViewingTool(null)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <div className="p-6 space-y-6">
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diária</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(viewingTool.dailyPrice)}</p>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Atual</p>
                            {getStatusBadge(viewingTool.status)}
                         </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Última Manutenção</p>
                        <p className="text-sm font-bold">{formatDate(viewingTool.lastMaintenance)}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="material-symbols-outlined text-blue-500">event_available</span>
                        Timeline de Disponibilidade
                      </h4>
                      <AvailabilityTimeline equipmentId={viewingTool.id} />
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Modal - Unified form for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg">{editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}</h3>
              <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-700"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSaveTool} className="p-6 space-y-4 text-sm font-medium">
              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Nome</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Código</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Valor Diária</label>
                  <input type="number" required value={formData.dailyPrice} onChange={e => setFormData({...formData, dailyPrice: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                        <option value="available">Disponível</option>
                        <option value="rented">Alugado</option>
                        <option value="maintenance">Manutenção</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Categoria</label>
                    <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Fabricante</label>
                    <input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                 </div>
                 <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Nº de Série</label>
                    <input value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                 </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase text-[10px]">Valor de Reposição</label>
                <input type="number" value={formData.replacementValue} onChange={e => setFormData({...formData, replacementValue: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">{isSaving ? 'Salvando...' : 'Confirmar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityTimeline({ equipmentId }: { equipmentId: string }) {
  const { useEquipmentTimeline } = useAvailability();
  const fromDate = new Date().toISOString().split('T')[0];
  const toDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]; // Next 30 days

  const { data, isLoading } = useEquipmentTimeline(equipmentId, fromDate, toDate);

  if (isLoading) return <p className="text-xs text-slate-400 italic">Carregando agenda...</p>;

  const events = [...(data?.rentals || []), ...(data?.maintenance || [])].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  if (events.length === 0) return <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">✅ Sem conflitos nos próximos 30 dias.</p>;

  return (
    <div className="space-y-3">
      {events.map((event: any, idx) => (
        <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
          event.eventType === 'maintenance' 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' 
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="material-symbols-outlined text-lg opacity-60">
                {event.eventType === 'maintenance' ? 'build' : 'receipt_long'}
            </span>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-bold uppercase tracking-tight opacity-50">
                {event.eventType === 'maintenance' ? 'Manutenção' : 'Locação'}
              </span>
              <span className="text-xs font-bold truncate">
                {event.eventType === 'maintenance' ? event.title : event.clients?.name}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-bold opacity-60">{formatDate(event.start_date)}</p>
            <p className="text-[9px] font-medium opacity-40">até {event.end_date ? formatDate(event.end_date) : 'ind.'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
