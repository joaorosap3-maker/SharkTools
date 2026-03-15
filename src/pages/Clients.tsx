import React, { useState } from 'react';
import { useMasterData } from '../hooks/useMasterData';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../services/supabaseClient';
import { clientPortalService } from '../services/clientPortalService';

interface Client {
  id: string;
  name: string;
  document: string;
  phone?: string;
  email?: string;
  status: string;
}

export default function Clients() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const { useClients } = useMasterData();
  const { data: clients, isLoading, refetch } = useClients();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
  });

  const handleOpenModal = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        document: client.document || '',
        phone: client.phone || '',
        email: client.email || '',
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', document: '', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...formData, company_id: companyId }]);
        if (error) throw error;
      }
      refetch();
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar cliente: ' + err.message);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Excluir este cliente permanentemente?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      refetch();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleGeneratePortalLink = async (client: any) => {
    if (!companyId) return;
    setIsGenerating(client.id);
    try {
      const link = await clientPortalService.generatePortalLink(client.id, companyId);
      await navigator.clipboard.writeText(link);
      alert("Link do Portal gerado e copiado para a área de transferência!");
    } catch (err: any) {
      alert("Erro ao gerar link: " + err.message);
    } finally {
      setIsGenerating(null);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  };

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie sua base de clientes e acesso ao portal.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">person_add</span>
          Novo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <span className="material-symbols-outlined text-slate-400">search</span>
        <input 
          type="text" 
          placeholder="Buscar clientes..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Documento</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center animate-pulse text-slate-400">Carregando...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">Nenhum cliente encontrado.</td></tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-primary">
                        {getInitials(client.name)}
                      </div>
                      <span className="text-sm font-bold">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{client.document || '---'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleGeneratePortalLink(client)}
                        disabled={!!isGenerating}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors"
                        title="Gerar Link do Portal"
                      >
                        <span className="material-symbols-outlined text-sm">{isGenerating === client.id ? 'sync' : 'link'}</span>
                        Portal
                      </button>
                      <button 
                        onClick={() => handleOpenModal(client)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
             </div>
             <form onSubmit={handleSaveClient} className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nome Completo</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">CPF/CNPJ</label>
                   <input required type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Telefone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                   </div>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 mt-4">Salvar</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
