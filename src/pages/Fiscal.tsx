import React, { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  number: string;
  type: 'NFS-e' | 'NF-e';
  client: string;
  date: string;
  amount: number;
  status: 'Emitida' | 'Pendente' | 'Cancelada' | 'Erro';
}

export default function Fiscal() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Todas' | 'Emitida' | 'Pendente' | 'Cancelada'>('Todas');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<Omit<Invoice, 'id'>>({
    number: '',
    type: 'NFS-e',
    client: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: 'Pendente',
  });

  // Load data
  useEffect(() => {
    const stored = localStorage.getItem('sharktools_invoices');
    if (stored) {
      setInvoices(JSON.parse(stored));
    } else {
      // Seed data if empty
      const initialData: Invoice[] = [
        { id: '1', number: '2023001', type: 'NFS-e', client: 'Construtora Alpha Ltda', date: new Date().toISOString().split('T')[0], amount: 4500, status: 'Emitida' },
        { id: '2', number: '2023002', type: 'NF-e', client: 'Oficina Central', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], amount: 1200, status: 'Emitida' },
        { id: '3', number: '2023003', type: 'NFS-e', client: 'Pedro Rocha', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], amount: 350, status: 'Pendente' },
        { id: '4', number: '2023004', type: 'NF-e', client: 'Fornecedor Ferramentas S/A', date: new Date(Date.now() - 259200000).toISOString().split('T')[0], amount: 890, status: 'Cancelada' },
      ];
      setInvoices(initialData);
      localStorage.setItem('sharktools_invoices', JSON.stringify(initialData));
    }
  }, []);

  const saveInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('sharktools_invoices', JSON.stringify(newInvoices));
  };

  // Calculations
  const totalIssued = invoices
    .filter(i => i.status === 'Emitida')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  // Estimativa de impostos (ex: 6% Simples Nacional)
  const estimatedTaxes = totalIssued * 0.06;
    
  const countIssued = invoices.filter(i => i.status === 'Emitida').length;

  // Filtering
  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = 
      i.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.client.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTab = activeTab === 'Todas' || i.status === activeTab;
    
    return matchesSearch && matchesTab;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handlers
  const handleOpenModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        number: invoice.number,
        type: invoice.type,
        client: invoice.client,
        date: invoice.date,
        amount: invoice.amount,
        status: invoice.status,
      });
    } else {
      setEditingInvoice(null);
      
      // Auto-generate next number
      const nextNumber = invoices.length > 0 
        ? String(Math.max(...invoices.map(i => parseInt(i.number) || 0)) + 1).padStart(6, '0')
        : '000001';

      setFormData({
        number: nextNumber,
        type: 'NFS-e',
        client: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        status: 'Pendente',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInvoice) {
      const updated = invoices.map(i => 
        i.id === editingInvoice.id ? { ...formData, id: i.id } : i
      );
      saveInvoices(updated);
    } else {
      const newInvoice: Invoice = {
        ...formData,
        id: crypto.randomUUID(),
      };
      saveInvoices([newInvoice, ...invoices]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota fiscal? Notas emitidas geralmente devem ser canceladas em vez de excluídas.')) {
      saveInvoices(invoices.filter(i => i.id !== id));
    }
  };

  const handleCancelInvoice = (id: string) => {
    if (window.confirm('Tem certeza que deseja CANCELAR esta nota fiscal?')) {
      const updated = invoices.map(i => 
        i.id === id ? { ...i, status: 'Cancelada' as const } : i
      );
      saveInvoices(updated);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Emitida':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            Emitida
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Pendente
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
            Cancelada
          </span>
        );
      case 'Erro':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            Erro
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão Fiscal</h1>
          <p className="text-slate-500 text-sm mt-1">Emissão de notas fiscais, impostos e relatórios contábeis.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar XML
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            Emitir Nota
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Total Faturado (Emitido)</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
              <span className="material-symbols-outlined">request_quote</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIssued)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Impostos Estimados (6%)</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(estimatedTaxes)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-sm font-medium">Notas Emitidas</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">receipt</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{countIssued}</h3>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
          {['Todas', 'Emitida', 'Pendente', 'Cancelada'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar por número ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Número</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">receipt_long</span>
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">#{invoice.number}</span>
                          <div className="text-xs text-slate-500">{invoice.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{invoice.client}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {invoice.status !== 'Cancelada' && (
                          <button 
                            onClick={() => handleCancelInvoice(invoice.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            title="Cancelar Nota"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenModal(invoice)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(invoice.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma nota fiscal encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova/Editar Nota Fiscal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold">
                {editingInvoice ? 'Editar Nota Fiscal' : 'Emitir Nota Fiscal'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Número</label>
                    <input
                      type="text"
                      required
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'NFS-e' | 'NF-e'})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="NFS-e">NFS-e (Serviço)</option>
                      <option value="NF-e">NF-e (Produto)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cliente / Razão Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do cliente ou empresa"
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Data de Emissão</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'Emitida' | 'Pendente' | 'Cancelada' | 'Erro'})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Emitida">Emitida</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Erro">Erro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="invoice-form"
                className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {editingInvoice ? 'Salvar Alterações' : 'Emitir Nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
