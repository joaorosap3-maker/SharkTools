import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useRBAC } from '../hooks/useRBAC';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Settings() {
  const { isAdmin, profile } = useRBAC();
  const [activeTab, setActiveTab] = useState('company');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  useEffect(() => {
    if (activeTab === 'security' && isAdmin) {
      fetchAuditLogs();
    }
  }, [activeTab, isAdmin]);

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      // RLS ensures the user only gets their own company
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .single();

      if (error) {
        // Se der not found, ou outro erro, ignorar ou logar
        console.error("Erro ao buscar empresa:", error.message);
      } else if (data) {
        setFormData({
          id: data.id || '',
          name: data.name || '',
          cnpj: data.cnpj || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchAuditLogs = async () => {
    try {
      setIsLogsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err: any) {
      console.error("Error fetching audit logs:", err.message);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.id) {
      setMessage({ type: 'error', text: 'Nenhuma empresa vinculada encontrada.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          cnpj: formData.cnpj,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        })
        .eq('id', formData.id);

      if (error) {
        setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message });
      } else {
        setMessage({ type: 'success', text: 'Dados da empresa salvos com sucesso!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro inesperado: ' + err.message });
    } finally {
      setIsSaving(false);
      // Remove a mensagem de sucesso após alguns segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-amber-500 text-white';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  const getActionLabel = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-slate-500 text-sm mt-1">Ajuste as preferências do sistema e dados da sua empresa.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4">
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('company')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'company' ? 'bg-primary/10 text-primary dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                Dados da Empresa
              </button>
              
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'security' ? 'bg-primary/10 text-primary dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span className="material-symbols-outlined text-lg">security</span>
                  Segurança e Auditoria
                </button>
              )}

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-lg">tune</span>
                Instâncias (SaaS)
              </button>
            </nav>
          </div>


          {/* Settings Content */}
          <div className="flex-1 p-6 space-y-6 relative min-h-[500px]">
            {isLoading && activeTab === 'company' && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
              </div>
            )}

            {activeTab === 'company' && (
              <>
                <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">Dados da Empresa</h2>

                {message.text && (
                  <div className={`p-3 rounded-lg text-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'} dark:bg-opacity-10 dark:border-opacity-20 animate-in slide-in-from-top-1`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Razão Social / Nome da Empresa</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Sua Empresa Ltda"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email de Contato</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contato@empresa.com"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CNPJ</label>
                      <input
                        type="text"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0001-00"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endereço Completo</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rua, Número, Bairro, Cidade - Estado"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 transition-all"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || isLoading}
                      className={`px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 transform active:scale-95 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-dark hover:shadow-lg'}`}
                    >
                      {isSaving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-lg font-bold">Logs de Auditoria</h2>
                  <button 
                    onClick={fetchAuditLogs}
                    disabled={isLogsLoading}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <span className={`material-symbols-outlined text-sm ${isLogsLoading ? 'animate-spin' : ''}`}>refresh</span>
                    Atualizar
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Data/Hora</th>
                          <th className="px-4 py-3">Ação</th>
                          <th className="px-4 py-3">Usuário</th>
                          <th className="px-4 py-3">Recurso</th>
                          <th className="px-4 py-3">Gravidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {isLogsLoading && auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Carregando logs...</td>
                          </tr>
                        ) : auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Nenhum evento registrado.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                {getActionLabel(log.action)}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                {log.profiles?.full_name || 'Sistema/Anon'}
                              </td>
                              <td className="px-4 py-3 text-slate-500 italic">
                                {log.resource || '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getSeverityColor(log.severity)}`}>
                                  {log.severity}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex gap-3">
                  <span className="material-symbols-outlined text-amber-600">info</span>
                  <div className="text-xs text-amber-800 dark:text-amber-400">
                    <p className="font-bold">Privacidade & Conformidade</p>
                    <p className="mt-1">Estes logs são mantidos por 90 dias para fins de conformidade e segurança SaaS. Apenas administradores do sistema têm acesso a este painel.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
