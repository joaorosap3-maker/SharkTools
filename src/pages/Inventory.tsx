import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';

interface Tool {
  id: string;
  name: string;
  code: string;
  category: string; // Maps to 'type' in DB
  status: 'available' | 'rented' | 'maintenance';
  dailyPrice: number; // Maps to 'daily_price' in DB
  lastMaintenance: string; // Maps to 'last_maintenance' in DB
}

export default function Inventory() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const userCompanyId = profile?.company_id;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    code: '',
    category: '',
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

      // Get tools from database
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
        type: formData.category, // Map UI 'category' to DB 'type'
        status: formData.status,
        daily_price: formData.dailyPrice,
        last_maintenance: formData.lastMaintenance || null,
        company_id: userCompanyId
      };

      if (editingTool) {
        // Update
        const { error } = await supabase
          .from('equipment_assets')
          .update(dbPayload)
          .eq('id', editingTool.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('equipment_assets')
          .insert([dbPayload]);

        if (error) throw error;
      }

      // Reload tools
      await fetchTools();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('Erro ao salvar ferramenta. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ferramenta?')) {
      try {
        const { error } = await supabase
          .from('equipment_assets')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remove from local state
        setTools(tools.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting tool:', error);
        alert('Erro ao excluir ferramenta. Ela pode estar vinculada a uma locação.');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateStr = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
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
      default:
        return null;
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || tool.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventário de Ferramentas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie seu catálogo, estoque e manutenção de equipamentos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Ferramenta
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === 'available' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('rented')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === 'rented' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Alugados
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === 'maintenance' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Em Manutenção
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar ferramenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Código/Nome</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Valor Diária</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Última Manutenção</th>
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
              {!isLoading && filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma ferramenta encontrada.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined">
                            {tool.category.toLowerCase().includes('elétrica') ? 'power' :
                              tool.category.toLowerCase().includes('pesada') ? 'handyman' :
                                tool.category.toLowerCase().includes('acesso') ? 'architecture' : 'build'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{tool.name}</span>
                          <span className="text-xs text-slate-500 font-mono">#{tool.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{tool.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tool.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(tool.dailyPrice)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{formatDateStr(tool.lastMaintenance)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(tool)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Simplified for now) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-500">Mostrando {filteredTools.length} resultados</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTool} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Ferramenta</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Martelete Perfurador Bosch 800W"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: MRT-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Elétricas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Diária (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.dailyPrice}
                    onChange={e => setFormData({ ...formData, dailyPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="available">Disponível</option>
                    <option value="rented">Alugado</option>
                    <option value="maintenance">Manutenção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Última Manutenção</label>
                <input
                  type="date"
                  required
                  value={formData.lastMaintenance}
                  onChange={e => setFormData({ ...formData, lastMaintenance: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg transition-colors flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
                >
                  {isSaving ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">refresh</span> Salvando...</>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

