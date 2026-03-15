import React from 'react';

interface PortalLayoutProps {
  children: React.ReactNode;
  clientName: string;
  companyName: string;
  companyLogo?: string;
}

export default function PortalLayout({ children, clientName, companyName, companyLogo }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {companyLogo ? (
               <img src={companyLogo} alt={companyName} className="h-10 w-auto object-contain" />
             ) : (
               <div className="size-10 bg-primary flex items-center justify-center rounded-xl text-white font-black">
                 {companyName.substring(0, 1)}
               </div>
             )}
             <div>
               <h1 className="font-black text-lg tracking-tight leading-none uppercase">{companyName}</h1>
               <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Portal do Cliente</p>
             </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bem-vindo,</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{clientName}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* Mobile Welcome */}
        <div className="sm:hidden mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
           <p className="text-xs font-bold text-primary uppercase mb-1">Bem-vindo ao SharkTools,</p>
           <p className="text-xl font-black text-slate-900 dark:text-white uppercase">{clientName}</p>
        </div>
        
        {children}
      </main>
      
      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-slate-200 dark:border-slate-800 text-center">
         <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} SharkTools — Todos os direitos reservados.
         </p>
      </footer>
    </div>
  );
}
