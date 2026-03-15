import React, { useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { format } from 'date-fns';

export default function ContractTemplates() {
  const { useTemplates, createTemplate, updateTemplate } = useContracts();
  const { data: templates, isLoading } = useTemplates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  const handleOpenModal = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ name: template.name, content: template.content });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, template: formData });
      } else {
        await createTemplate({ 
          tenant_id: 'auto', // Handled by hook/service
          ...formData 
        } as any);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar template: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos de Contrato</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os modelos de contrato PDF com variáveis dinâmicas.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Modelo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><span className="material-symbols-outlined animate-spin text-primary">loading</span></div>
        ) : templates?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-500">Nenhum modelo cadastrado.</p>
          </div>
        ) : (
          templates?.map(template => (
            <div key={template.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 bg-primary/10 flex items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-primary">description</span>
                </div>
                <button 
                  onClick={() => handleOpenModal(template)}
                  className="p-2 text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
              <h3 className="font-bold text-lg mb-1">{template.name}</h3>
              <p className="text-xs text-slate-500 mb-4">Atualizado em {format(new Date(template.updated_at!), 'dd/MM/yyyy HH:mm')}</p>
              <div className="line-clamp-3 text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {template.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Variables Cheat Sheet */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl">
         <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined">info</span>
            Variáveis Suportadas
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              '{{client_name}}', '{{client_document}}', '{{client_phone}}',
              '{{rental_start}}', '{{rental_end}}', '{{equipment_list}}',
              '{{total_value}}', '{{company_name}}', '{{company_cnpj}}', '{{company_phone}}', '{{company_address}}'
            ].map(v => (
              <code key={v} className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                {v}
              </code>
            ))}
         </div>
      </div>

      {/* Modal Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg">{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
             </div>
             <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Modelo</label>
                   <input 
                     required 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Conteúdo do Contrato</label>
                   <textarea 
                     required 
                     rows={15}
                     value={formData.content} 
                     onChange={e => setFormData({...formData, content: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm leading-relaxed"
                     placeholder="Use as variáveis {{exemplo}} para preenchimento dinâmico..."
                   />
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Salvar Modelo</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
