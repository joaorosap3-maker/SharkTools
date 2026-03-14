import React from 'react';
import { useSubscription } from '../hooks/useSubscription';

export default function Billing() {
  const { data: subscription } = useSubscription();

  const plans = [
    {
      id: 'basic',
      name: 'Shark Básico',
      price: 'R$ 99',
      period: '/mês',
      description: 'Ideal para locadoras pequenas começando agora.',
      features: [
        { name: 'Até 10 equipamentos', included: true },
        { name: 'Gestão de clientes', included: true },
        { name: 'Contratos em PDF', included: false },
        { name: 'Relatórios avançados', included: false },
        { name: 'Alertas WhatsApp', included: false },
      ],
      current: subscription?.planName.includes('Básico'),
      buttonText: 'Plano Atual',
      buttonClass: 'bg-slate-100 text-slate-500 cursor-default'
    },
    {
      id: 'pro',
      name: 'Shark Pro',
      price: 'R$ 249',
      period: '/mês',
      description: 'Otimize sua locadora com automação e dados.',
      features: [
        { name: 'Equipamentos ilimitados', included: true },
        { name: 'Gestão de clientes ilimitada', included: true },
        { name: 'Contratos em PDF', included: true },
        { name: 'Relatórios avançados', included: true },
        { name: 'Alertas WhatsApp', included: true },
      ],
      current: subscription?.planName.includes('Pro'),
      popular: true,
      buttonText: subscription?.planName.includes('Pro') ? 'Plano Atual' : 'Upgrade para Pro',
      buttonClass: subscription?.planName.includes('Pro') ? 'bg-slate-100 text-slate-500 cursor-default' : 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-[1.02]'
    }
  ];

  const handleUpgrade = (planId: string) => {
    if (planId === 'pro' && !subscription?.planName.includes('Pro')) {
        alert('Redirecionando para o checkout do Stripe... (Ativação automática na confirmação)');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Assinatura e Planos</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Gerencie seu plano atual e descubra como o SharkTools pode impulsionar o crescimento da sua obra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative p-8 rounded-3xl border bg-white dark:bg-slate-900 transition-all ${
              plan.popular ? 'border-primary ring-1 ring-primary' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                Recomendado
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 text-sm">{plan.period}</span>
              </div>

              <button 
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.buttonClass}`}
              >
                {plan.buttonText}
              </button>

              <div className="space-y-4 pt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O que está incluído:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-sm ${feature.included ? 'text-primary' : 'text-slate-300'}`}>
                        {feature.included ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={`text-sm ${feature.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 font-normal line-through opacity-50'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Indicator */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-dotted border-slate-300 dark:border-slate-700">
        <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Seu Uso Atual
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Equipamentos</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                        {subscription?.features.max_assets === -1 ? 'Ilimitado' : `Usando 1 de ${subscription?.features.max_assets}`}
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '10%' }}></div>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Tempo de Contrato</span>
                    <span className="font-bold text-slate-900 dark:text-white">Vitalício</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '100%' }}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
