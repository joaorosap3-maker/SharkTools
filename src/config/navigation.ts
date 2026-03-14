import { PlanFeatures } from '../hooks/useSubscription';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  requiredRole?: 'admin' | 'manager' | 'user';
  requiredFeature?: keyof PlanFeatures;
  isPlaceholder?: boolean;
}

export interface NavCore {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

export const NAVIGATION_CONFIG: NavCore[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    items: [
      { id: 'painel', label: 'Painel Geral', path: '/dashboard', icon: 'grid_view' },
    ]
  },
  {
    id: 'comercial',
    label: 'Comercial',
    icon: 'groups',
    items: [
      { id: 'clientes', label: 'Clientes', path: '/clientes', icon: 'person' },
      { id: 'orcamentos', label: 'Orçamentos', path: '/orcamentos', icon: 'description' },
      { id: 'locacoes', label: 'Locações', path: '/locacoes', icon: 'receipt_long' },
      { id: 'calendario', label: 'Calendário', path: '/calendario', icon: 'calendar_today' },
    ]
  },
  {
    id: 'operacional',
    label: 'Operacional',
    icon: 'engineering',
    items: [
      { id: 'inventario', label: 'Equipamentos', path: '/inventario', icon: 'inventory_2' },
      { id: 'manutencao', label: 'Manutenção', path: '/manutencoes', icon: 'build' },
    ]
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: 'payments',
    items: [
      { id: 'financeiro-trans', label: 'Transações', path: '/financeiro', icon: 'account_balance_wallet' },
      { id: 'fiscal', label: 'Faturas (Fiscal)', path: '/fiscal', icon: 'request_quote' },
      { id: 'relatorios', label: 'Relatórios', path: '/relatorios', icon: 'bar_chart', requiredFeature: 'advanced_reports' },
    ]
  },
  {
    id: 'administracao',
    label: 'Administração',
    icon: 'admin_panel_settings',
    items: [
      { id: 'usuarios', label: 'Usuários', path: '/usuarios', icon: 'people', requiredRole: 'admin' },
      { id: 'configuracoes', label: 'Configurações', path: '/configuracoes', icon: 'settings', requiredRole: 'admin' },
      { id: 'faturamento', label: 'Billing / Planos', path: '/faturamento', icon: 'credit_card', requiredRole: 'admin' },
    ]
  }
];
