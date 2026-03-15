import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientPortalService } from '../services/clientPortalService';

export default function PortalAccess() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setError('Token de acesso não encontrado.');
        return;
      }

      try {
        const data = await clientPortalService.validateToken(token);
        if (data) {
          // Store session data
          sessionStorage.setItem('client_portal_token', token);
          sessionStorage.setItem('client_id', data.client_id);
          sessionStorage.setItem('tenant_id', data.tenant_id);
          
          navigate('/portal');
        } else {
          setError('Link de acesso expirado ou inválido.');
        }
      } catch (err) {
        setError('Erro ao validar acesso. Tente novamente mais tarde.');
      }
    }

    validate();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center space-y-4">
           <div className="size-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <span className="material-symbols-outlined text-3xl">error</span>
           </div>
           <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Falha no Acesso</h1>
           <p className="text-sm text-slate-500">{error}</p>
           <button 
             onClick={() => window.location.href = '/'}
             className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm tracking-tight"
           >
             Ir para o Site
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Validando Acesso Seguro...</p>
      </div>
    </div>
  );
}
