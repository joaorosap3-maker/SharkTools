import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export default function NewRental() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  const [clients, setClients] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('ativa');
  const [items, setItems] = useState<any[]>([]);
  const [selectedToolId, setSelectedToolId] = useState('');

  useEffect(() => {
    const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const storedTools = JSON.parse(localStorage.getItem('tools') || '[]');
    setClients(storedClients);
    setTools(storedTools.filter((t: any) => t.status !== 'Manutenção'));

    const queryParams = new URLSearchParams(location.search);
    const dateParam = queryParams.get('date');
    if (dateParam && !id) {
      setStartDate(dateParam);
    }

    if (id) {
      const storedRentals = JSON.parse(localStorage.getItem('rentals') || '[]');
      const rental = storedRentals.find((r: any) => r.id === id);
      if (rental) {
        setClientId(rental.clientId);
        setStartDate(rental.startDate);
        setEndDate(rental.endDate);
        setNotes(rental.notes || '');
        setStatus(rental.status);
        setItems(rental.items || []);
      }
    }
  }, [id, location.search]);

  const handleAddTool = () => {
    if (!selectedToolId) return;
    
    const tool = tools.find(t => t.id === selectedToolId);
    if (!tool) return;

    const existingItemIndex = items.findIndex(i => i.toolId === selectedToolId);
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([...items, { toolId: tool.id, quantity: 1, price: tool.price }]);
    }
    setSelectedToolId('');
  };

  const handleRemoveItem = (toolId: string) => {
    setItems(items.filter(i => i.toolId !== toolId));
  };

  const handleQuantityChange = (toolId: string, delta: number) => {
    setItems(items.map(item => {
      if (item.toolId === toolId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays; // Minimum 1 day
  };

  const days = calculateDays();
  
  const subtotalPerDay = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = days * subtotalPerDay;

  const handleSave = () => {
    if (!clientId) {
      alert('Selecione um cliente.');
      return;
    }
    if (items.length === 0) {
      alert('Adicione pelo menos uma ferramenta.');
      return;
    }
    if (!startDate || !endDate) {
      alert('Selecione as datas de retirada e devolução.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      alert('A data de devolução não pode ser menor que a data de retirada.');
      return;
    }

    const storedRentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    
    const rentalData = {
      id: id || `LOC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      clientId,
      startDate,
      endDate,
      status,
      items,
      total,
      notes
    };

    if (id) {
      const updatedRentals = storedRentals.map((r: any) => r.id === id ? rentalData : r);
      localStorage.setItem('rentals', JSON.stringify(updatedRentals));
    } else {
      localStorage.setItem('rentals', JSON.stringify([rentalData, ...storedRentals]));
    }

    navigate('/locacoes');
  };

  const getToolDetails = (toolId: string) => {
    return tools.find(t => t.id === toolId) || { name: 'Desconhecido', code: '', price: 0 };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{id ? 'Editar Locação' : 'Nova Locação'}</h1>
        <p className="text-slate-500 text-sm mt-1">{id ? `Editando contrato #${id}` : 'Crie um novo contrato de aluguel de equipamentos.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-primary">person</span>
              Dados do Cliente
            </h2>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione o Cliente</label>
              <select 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">-- Selecione um cliente --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name} ({client.document})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-primary">construction</span>
              Equipamentos
            </h2>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adicionar Ferramenta</label>
              <div className="relative flex gap-2">
                <select 
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">-- Selecione uma ferramenta --</option>
                  {tools.map(tool => (
                    <option key={tool.id} value={tool.id}>{tool.name} - {formatCurrency(tool.price)}/dia</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddTool}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Selected Items List */}
            {items.length > 0 && (
              <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Itens Selecionados ({items.length})</span>
                </div>
                {items.map(item => {
                  const tool = getToolDetails(item.toolId);
                  return (
                    <div key={item.toolId} className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined">handyman</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{tool.name}</p>
                          <p className="text-xs text-slate-500">#{tool.code} • {formatCurrency(item.price)}/dia</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          <button onClick={() => handleQuantityChange(item.toolId, -1)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">-</button>
                          <span className="px-3 py-1 text-sm font-bold border-x border-slate-200 dark:border-slate-700">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.toolId, 1)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">+</button>
                        </div>
                        <button onClick={() => handleRemoveItem(item.toolId)} className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Period & Terms */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Período e Condições
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data de Retirada</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data de Devolução</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>

            {id && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status da Locação</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ativa">Ativa</option>
                  <option value="finalizada">Finalizada</option>
                  <option value="atrasada">Atrasada</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações do Contrato</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes sobre entrega, condições especiais, etc..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sidebar / Summary */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">Resumo da Locação</h3>
            
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} itens)</span>
                <span className="font-medium">{formatCurrency(subtotalPerDay)}/dia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Período</span>
                <span className="font-medium">{days} {days === 1 ? 'dia' : 'dias'}</span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Previsto</span>
                <span className="text-2xl font-bold text-primary dark:text-white">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleSave}
                className="w-full py-3 bg-primary text-white rounded-lg font-bold shadow-sm hover:bg-primary/90 transition-colors"
              >
                {id ? 'Salvar Alterações' : 'Gerar Contrato'}
              </button>
              <button 
                onClick={() => navigate('/locacoes')}
                className="w-full py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
