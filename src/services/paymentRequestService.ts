import { callAPIN8N } from '@/utils/api';

export interface PaymentRequestPayload {
  // Dados Gerais
  requester?: string;
  requester_email?: string;
  department?: string;
  payment_company?: string;
  client_name?: string;
  contract_number?: string | number;
  reason?: string;
  payment_type?: string;
  modality?: string;
  expense_value?: number;
  due_date?: string; // ISO date

  // Dados Bancários
  person_type?: 'fisica' | 'juridica';
  titular?: string;
  cpf_cnpj?: string;
  bank?: string;
  agency?: string;
  account?: string;
  pix_type?: string;
  pix_key?: string;

  // legacy / compatibility
  customer_id?: string;
  amount?: number;
  description?: string;
}

export interface PaymentRequestItem {
  id: string;
  // Dados Gerais
  requester: string;
  requester_email: string;
  department: string;
  payment_company: string;
  client_name: string;
  contract_number: string | number;
  reason: string;
  payment_type: string;
  modality: string;
  expense_value: string | number;
  due_date: string;

  // Dados Bancários
  person_type: 'fisica' | 'juridica';
  titular: string;
  cpf_cnpj: string;
  bank: string;
  agency: string;
  account: string;
  pix_type: string;
  pix_key: string;

  // Status e Timestamps
  status?: string;
  created_at: string;
  updated_at: string;
  approved_department: string;
  approved_director: string;
}

export const createPaymentRequest = async (data: PaymentRequestPayload) => {
  try {
    const response = await callAPIN8N('payment_requests/create', data, 'payment_requests/create');
    return response;
  } catch (error) {
    console.error('Erro ao criar solicitação de pagamento:', error);
    throw error;
  }
};

export const fetchPaymentRequests = async (filters: any = {}) => {
  try {
    const response = await callAPIN8N('payment_requests/list', filters, 'payment_requests/list');
    // normalize: expect { data: [], total: number }
    if (response && response.data) return response;
    if (Array.isArray(response)) return { data: response, total: response.length };
    return { data: [], total: 0 };
  } catch (error) {
    console.error('Erro ao buscar solicitações de pagamento:', error);
    throw error;
  }
};

export const getPaymentRequest = async (id: string) => {
  try {
    const response = await callAPIN8N('payment_requests/get', { id }, 'payment_requests/get');
    return response?.data || response;
  } catch (error) {
    console.error('Erro ao obter solicitação:', error);
    throw error;
  }
};

export const updatePaymentRequest = async (id: string, data: Partial<PaymentRequestPayload>) => {
  try {
    const response = await callAPIN8N('payment_requests/update', { id, ...data }, 'payment_requests/update');
    return response;
  } catch (error) {
    console.error('Erro ao atualizar solicitação:', error);
    throw error;
  }
};

export const deletePaymentRequest = async (id: string) => {
  try {
    const response = await callAPIN8N('payment_requests/delete', { id }, 'payment_requests/delete');
    return response;
  } catch (error) {
    console.error('Erro ao deletar solicitação:', error);
    throw error;
  }
};
