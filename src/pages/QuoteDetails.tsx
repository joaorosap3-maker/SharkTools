import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { useMasterData } from '../hooks/useMasterData';
import { useAuth } from '../components/AuthProvider';
import { formatCurrency } from '../utils/formatters';

export interface QuoteItemState {
  id?: string;
  equipment_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function QuoteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { useQuote, createQuote, updateQuote, isCreating, isUpdating } = useQuotes();
  const { useClients, useEquipment } = useMasterData();
  
  const { data: quote, isLoading: isQuoteLoading } = useQuote(id || '');
  const { data: clients } = useClients();
  const { data: equipment } = useEquipment();

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent' | 'approved' | 'rejected'>('draft');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuoteItemState[]>([]);
  
  const [selectedEquipId, setSelectedEquipId] = useState('');

  useEffect(() => {
    if (id && quote) {
      setTitle(quote.title);
      setClientId(quote.client_id);
      setDescription(quote.description || '');
      setStatus(quote.status);
      setValidUntil(quote.valid_until || '');
      setItems(quote.items || []);
    }
  }, [id, quote]);

  const handleAddItem = () => {
    if (selectedEquipId) {
      const equip = equipment?.find(e => e.id === selectedEquipId);
      if (equip) {
        setItems([...items, {
          equipment_id: equip.id,
          description: equip.name,
          quantity: 1,
          unit_price: equip.daily_price || 0
        }]);
        setSelectedEquipId('');
      }
    } else {
      setItems([...items, {
        description: '',
        quantity: 1,
        unit_price: 0
      }]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItemState, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const totalValue = calculateTotal();
    const processedItems = items.map(item => ({
      ...item,
      total_price: item.quantity * item.unit_price
    }));

    const quoteData = {
      company_id: companyId,
      client_id: clientId,
      title,
      description,
      status,
      valid_until: validUntil || null,
      total_value: totalValue
    };

    try {
      if (id) {
        await updateQuote({ id, quote: quoteData, items: processedItems as any });
      } else {
        await createQuote({ quote: quoteData, items: processedItems as any });
      }
      navigate('/orcamentos');
    } catch (err: any) {
      alert('Erro ao salvar orçamento: ' + err.message);
    }
  };

  if (id && isQuoteLoading) {
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
            {id ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {id ? `Ajuste os detalhes do orçamento #${id.substring(0,8)}` : 'Preencha os campos para criar uma proposta comercial.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/orcamentos')}
          className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">close</span>
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Info */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título do Orçamento</label>
              <input
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Reforma Condomínio Solar"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente</label>
              <select
                required
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione um cliente</option>
                {clients?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Válido Até</label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <div className="flex gap-2">
              {(['draft', 'sent', 'approved', 'rejected'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                    status === s 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lists</span>
              Itens do Orçamento
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedEquipId}
                onChange={e => setSelectedEquipId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="">Selecione Equipamento...</option>
                {equipment?.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({formatCurrency(e.daily_price || 0)})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                + Adicionar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-end p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descrição</label>
                  <input
                    required
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Qtd</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preço Un.</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div className="w-32 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-right">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subtotal</label>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-sm">Nenhum item adicionado ao orçamento.</p>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500 uppercase">Valor Total do Orçamento</span>
            <span className="text-2xl font-black text-primary">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/orcamentos')}
            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Sair sem salvar
          </button>
          <button
            disabled={isCreating || isUpdating}
            type="submit"
            className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isCreating || isUpdating ? 'Salvando...' : 'Salvar Orçamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
