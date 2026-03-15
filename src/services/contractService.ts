import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "../utils/formatters";

export interface ContractTemplate {
  id?: string;
  tenant_id: string;
  name: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id?: string;
  tenant_id: string;
  rental_id: string;
  template_id: string | null;
  generated_at?: string;
  pdf_url: string;
  created_at?: string;
}

export interface ContractData {
  rentalId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  totalPrice: number;
  client: {
    name: string;
    email?: string;
    phone?: string;
  };
  equipment: {
    name: string;
  };
}

export async function getTemplates(tenantId: string) {
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function saveTemplate(template: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('contract_templates')
    .insert([template])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, template: Partial<ContractTemplate>) {
  const { data, error } = await supabase
    .from('contract_templates')
    .update(template)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getContractsByRental(rentalId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('rental_id', rentalId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function generateRentalContract(rentalId: string, templateId: string) {
  // 1. Fetch all necessary data
  const { data: rental, error: rentalError } = await supabase
    .from('rentals')
    .select(`
      *,
      clients (*),
      equipment_assets (*),
      companies (*)
    `)
    .eq('id', rentalId)
    .single();

  if (rentalError) throw rentalError;

  const { data: template, error: templateError } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  // 2. Prepare variables
  const variables: Record<string, string> = {
    '{{client_name}}': rental.clients?.name || '',
    '{{client_document}}': (rental.clients as any)?.document || '---',
    '{{client_phone}}': rental.clients?.phone || '',
    '{{rental_start}}': formatDate(rental.start_date),
    '{{rental_end}}': rental.end_date ? formatDate(rental.end_date) : 'Indeterminado',
    '{{equipment_list}}': `- ${rental.equipment_assets?.name} (Cód: ${rental.equipment_assets?.code})`,
    '{{total_value}}': formatCurrency(rental.total_value || 0),
    '{{company_name}}': rental.companies?.name || '',
    '{{company_cnpj}}': rental.companies?.cnpj || '',
    '{{company_phone}}': rental.companies?.phone || '',
    '{{company_address}}': rental.companies?.address || '',
  };

  // 3. Replace variables in template content
  let finalContent = template.content;
  Object.entries(variables).forEach(([key, value]) => {
    finalContent = finalContent.replaceAll(key, value);
  });

  // 4. Generate PDF
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = pageWidth - (margin * 2);
  
  // Split text to wrap
  const lines = doc.splitTextToSize(finalContent, textWidth);
  
  doc.setFontSize(12);
  doc.text(lines, margin, 30);

  const pdfBlob = doc.output('blob');
  const fileName = `${rental.tenant_id}/${rentalId}_${Date.now()}.pdf`;

  // 5. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('contracts')
    .getPublicUrl(fileName);

  // 6. Save record in contracts table
  const { data: contractRecord, error: contractError } = await supabase
    .from('contracts')
    .insert([{
      tenant_id: rental.tenant_id,
      rental_id: rentalId,
      template_id: templateId,
      pdf_url: publicUrl
    }])
    .select()
    .single();

  if (contractError) throw contractError;

  return contractRecord;
}

export async function addSignatureToContract(contractId: string, signatureDataUrl: string, ipAddress?: string) {
  // 1. Fetch contract and rental data
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`
      *,
      rentals (
        *,
        clients (*),
        equipment_assets (*),
        companies (*)
      )
    `)
    .eq('id', contractId)
    .single();

  if (contractError) throw contractError;

  const rental = contract.rentals;

  // 2. Upload signature image to storage
  const fileName = `${contract.tenant_id}/sig_${contractId}_${Date.now()}.png`;
  const response = await fetch(signatureDataUrl);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl: signatureUrl } } = supabase.storage
    .from('signatures')
    .getPublicUrl(fileName);

  // 3. Save signature record
  const { error: signatureRecordError } = await supabase
    .from('contract_signatures')
    .insert([{
      tenant_id: contract.tenant_id,
      contract_id: contractId,
      client_id: rental.client_id,
      signature_image_url: signatureUrl,
      ip_address: ipAddress || 'unknown'
    }]);

  if (signatureRecordError) throw signatureRecordError;

  // 4. Re-generate PDF with signature
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textWidth = pageWidth - (margin * 2);

  const { data: template } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', contract.template_id)
    .single();

  const variables: Record<string, string> = {
    '{{client_name}}': rental.clients?.name || '',
    '{{client_document}}': (rental.clients as any)?.document || '---',
    '{{client_phone}}': rental.clients?.phone || '',
    '{{rental_start}}': formatDate(rental.start_date),
    '{{rental_end}}': rental.end_date ? formatDate(rental.end_date) : 'Indeterminado',
    '{{equipment_list}}': `- ${rental.equipment_assets?.name} (Cód: ${rental.equipment_assets?.code})`,
    '{{total_value}}': formatCurrency(rental.total_value || 0),
    '{{company_name}}': rental.companies?.name || '',
    '{{company_cnpj}}': rental.companies?.cnpj || '',
    '{{company_phone}}': rental.companies?.phone || '',
    '{{company_address}}': rental.companies?.address || '',
  };

  let finalContent = template.content;
  Object.entries(variables).forEach(([key, value]) => {
    finalContent = finalContent.replaceAll(key, value);
  });

  const lines = doc.splitTextToSize(finalContent, textWidth);
  doc.setFontSize(10);
  doc.text(lines, margin, 30);

  const lastLineY = 30 + (lines.length * 5) + 10;
  const signatureY = Math.min(lastLineY, pageHeight - 60);

  doc.line(margin, signatureY, margin + 80, signatureY);
  doc.setFontSize(9);
  doc.text('Assinatura do Locatário', margin, signatureY + 5);
  doc.text(`IP: ${ipAddress || '---'} | Data: ${new Date().toLocaleString()}`, margin, signatureY + 10);

  doc.addImage(signatureDataUrl, 'PNG', margin, signatureY - 30, 60, 25);

  const pdfBlob = doc.output('blob');
  const pdfFileName = `${contract.tenant_id}/signed_${contractId}.pdf`;

  const { error: pdfError } = await supabase.storage
    .from('contracts')
    .upload(pdfFileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (pdfError) throw pdfError;

  const { data: { publicUrl: pdfUrl } } = supabase.storage
    .from('contracts')
    .getPublicUrl(pdfFileName);

  const { data: updatedContract, error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'signed',
      pdf_url: pdfUrl
    })
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedContract;
}

export const contractService = {
  getTemplates,
  saveTemplate,
  updateTemplate,
  getContractsByRental,
  generateRentalContract,
  addSignatureToContract
};
