export const initialClients = [
  { id: '1', name: 'Construtora Alpha Ltda', document: '12.345.678/0001-90', type: 'Pessoa Jurídica', phone: '(11) 98765-4321', email: 'contato@alpha.com.br' },
  { id: '2', name: 'Pedro Rocha', document: '123.456.789-00', type: 'Pessoa Física', phone: '(11) 91234-5678', email: 'pedro@email.com' },
  { id: '3', name: 'Marcenaria Express', document: '98.765.432/0001-10', type: 'Pessoa Jurídica', phone: '(11) 99999-8888', email: 'contato@marcenaria.com' },
];

export const initialTools = [
  { id: '1', code: 'FLX-2938', name: 'Martelete Perfurador 800W', category: 'Elétricas', status: 'Disponível', price: 45.00 },
  { id: '2', code: 'FLX-6510', name: 'Betoneira 400L', category: 'Pesadas', status: 'Alugado', price: 120.00 },
  { id: '3', code: 'FLX-1120', name: 'Parafusadeira Impacto Bosch', category: 'Elétricas', status: 'Manutenção', price: 35.00 },
  { id: '4', code: 'FLX-9921', name: 'Andaime Tubular 2m', category: 'Acesso', status: 'Disponível', price: 15.00 },
  { id: '5', code: 'FLX-5555', name: 'Serra Circular Makita', category: 'Corte', status: 'Disponível', price: 55.00 },
];

export const initialRentals = [
  {
    id: 'LOC-2023-089',
    clientId: '1',
    startDate: '2023-10-12',
    endDate: '2023-10-15',
    status: 'ativa',
    items: [
      { toolId: '2', quantity: 1, price: 120.00 }
    ],
    total: 360.00,
    notes: ''
  },
  {
    id: 'LOC-2023-088',
    clientId: '2',
    startDate: '2023-10-10',
    endDate: '2023-10-11',
    status: 'atrasada',
    items: [
      { toolId: '1', quantity: 1, price: 45.00 }
    ],
    total: 45.00,
    notes: ''
  },
  {
    id: 'LOC-2023-087',
    clientId: '3',
    startDate: '2023-10-05',
    endDate: '2023-10-09',
    status: 'finalizada',
    items: [
      { toolId: '4', quantity: 4, price: 15.00 }
    ],
    total: 240.00,
    notes: ''
  }
];

export function initializeData() {
  if (!localStorage.getItem('clients')) {
    localStorage.setItem('clients', JSON.stringify(initialClients));
  }
  if (!localStorage.getItem('tools')) {
    localStorage.setItem('tools', JSON.stringify(initialTools));
  }
  if (!localStorage.getItem('rentals')) {
    localStorage.setItem('rentals', JSON.stringify(initialRentals));
  }
}
