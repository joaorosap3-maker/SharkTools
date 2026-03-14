import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription, PlanFeatures } from '../hooks/useSubscription';

interface FeatureGuardProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideOnly?: boolean;
}

export default function FeatureGuard({ feature, children, fallback, hideOnly = false }: FeatureGuardProps) {
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) return null;

  const hasAccess = subscription?.features?.[feature] === true;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hideOnly) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default "Locked" UI
  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4">
      <div className="flex flex-col items-center justify-center text-center space-y-2 opacity-50 filter grayscale pointer-events-none">
        {children}
      </div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] transition-all opacity-100 group-hover:bg-white/80 dark:group-hover:bg-slate-900/80">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 mb-1">lock</span>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recurso PRO</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigate('/faturamento');
          }}
          className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          Mudar para PRO
        </button>
      </div>
    </div>
  );
}
