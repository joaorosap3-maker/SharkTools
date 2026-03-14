import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ContractData {
  rentalId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  client: {
    name: string;
    email?: string;
    phone?: string;
  };
  equipment: {
    name: string;
    code?: string;
  };
  company?: {
    name: string;
    logo?: string;
  };
}

export const generateRentalContract = (data: ContractData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header & Branding
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('SharkTools', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('A força da sua obra — Gestão de Locação Profissional', 20, 27);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, 35, pageWidth - 20, 35);

  // 2. Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`CONTRATO DE LOCAÇÃO #${data.rentalId.slice(0, 8).toUpperCase()}`, 20, 50);

  // 3. Info Grid
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Client Section
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO LOCATÁRIO (CLIENTE):', 20, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome/Razão Social: ${data.client.name}`, 20, 72);
  doc.text(`E-mail: ${data.client.email || '—'}`, 20, 77);
  doc.text(`Contato: ${data.client.phone || '—'}`, 20, 82);

  // Rental Section
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA LOCAÇÃO:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(`Equipamento: ${data.equipment.name}`, 20, 102);
  doc.text(`Status: ${data.status === 'active' ? 'Ativo' : data.status === 'overdue' ? 'Atrasado' : 'Encerrado'}`, 20, 107);
  doc.text(`Data de Início: ${new Date(data.startDate).toLocaleDateString()}`, 20, 112);
  doc.text(`Previsão de Entrega: ${new Date(data.endDate).toLocaleDateString()}`, 20, 117);

  // 4. Terms Table (Simplified)
  (doc as any).autoTable({
    startY: 130,
    head: [['Descrição', 'Valor Total']],
    body: [
      [`Locação de ${data.equipment.name}`, `R$ ${data.totalPrice.toLocaleString('pt-BR')}`],
    ],
    theme: 'striped',
    headStyles: { fillStyle: 'f', fillColor: [15, 23, 42] },
  });

  // 5. Clauses
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULAS E TERMOS:', 20, finalY);
  doc.setFont('helvetica', 'normal');
  const terms = [
    '1. O locatário declara estar recebendo o equipamento em perfeito estado de conservação e funcionamento.',
    '2. O período de locação é o estabelecido neste contrato, estando sujeito a cobrança excedente em caso de atraso.',
    '3. É de responsabilidade do locatário o uso adequado e a guarda do equipamento.',
    '4. Em caso de danos por mau uso, o custo de reparo será faturado adicionalmente.'
  ];
  let currentY = finalY + 7;
  terms.forEach(term => {
    doc.text(term, 20, currentY);
    currentY += 5;
  });

  // 6. Signatures
  const signatureY = pageWidth > 200 ? 250 : 250; 
  doc.line(20, signatureY, 80, signatureY);
  doc.text('Assinatura do Locador', 32, signatureY + 5);

  doc.line(120, signatureY, 180, signatureY);
  doc.text('Assinatura do Locatário', 132, signatureY + 5);

  // 7. Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gerado via SharkTools Professional SaaS em ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: 'center' });

  // Save
  doc.save(`contrato_locacao_${data.rentalId.slice(0, 8)}.pdf`);
};
