import { callAPIN8N } from '@/utils/api';

export interface WhatsAppUser {
  id: string;
  name_user: string;
  phone_user: string;
  email_user: string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppUserPayload {
  id?: string;
  name_user: string;
  phone_user: string;
  email_user: string;
  status: boolean;
}

export const createWhatsAppUser = async (data: Omit<WhatsAppUserPayload, 'id'>) => {
  try {
    const response = await callAPIN8N('payment_requests/user/create', data, 'payment_requests/user/create');
    return response;
  } catch (error) {
    console.error('Erro ao criar usuário WhatsApp:', error);
    throw error;
  }
};

export const updateWhatsAppUser = async (data: WhatsAppUserPayload) => {
  try {
    const response = await callAPIN8N('payment_requests/user/update', data, 'payment_requests/user/update');
    return response;
  } catch (error) {
    console.error('Erro ao atualizar usuário WhatsApp:', error);
    throw error;
  }
};

export const fetchWhatsAppUsers = async (filters: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await callAPIN8N('payment_requests/user/list', filters, 'payment_requests/user/list');
    if (response && response.data) return response;
    if (Array.isArray(response)) return { data: response, total: response.length };
    return { data: [], total: 0 };
  } catch (error) {
    console.error('Erro ao buscar usuários WhatsApp:', error);
    throw error;
  }
};
