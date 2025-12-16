import { callAPIN8N } from '@/utils/api';

export interface ApprovalLink {
  id: string;
  user_id: string;
  user_name?: string;
  approver_department_id: string;
  approver_department_name?: string;
  approver_director_id: string;
  approver_director_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalLinkPayload {
  id?: string;
  user_id: string;
  approver_department_id: string;
  approver_director_id: string;
}

export const createApprovalLink = async (data: Omit<ApprovalLinkPayload, 'id'>) => {
  try {
    const response = await callAPIN8N('payment_requests/approval_link/create', data, 'payment_requests/approval_link/create');
    return response;
  } catch (error) {
    console.error('Erro ao criar vínculo de aprovação:', error);
    throw error;
  }
};

export const updateApprovalLink = async (data: ApprovalLinkPayload) => {
  try {
    const response = await callAPIN8N('payment_requests/approval_link/update', data, 'payment_requests/approval_link/update');
    return response;
  } catch (error) {
    console.error('Erro ao atualizar vínculo de aprovação:', error);
    throw error;
  }
};

export const deleteApprovalLink = async (id: string) => {
  try {
    const response = await callAPIN8N('payment_requests/approval_link/delete', { id }, 'payment_requests/approval_link/delete');
    return response;
  } catch (error) {
    console.error('Erro ao deletar vínculo de aprovação:', error);
    throw error;
  }
};

export const fetchApprovalLinks = async (filters: {
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await callAPIN8N('payment_requests/approval_link/list', filters, 'payment_requests/approval_link/list');
    if (response && response.data) return response;
    if (Array.isArray(response)) return { data: response, total: response.length };
    return { data: [], total: 0 };
  } catch (error) {
    console.error('Erro ao buscar vínculos de aprovação:', error);
    throw error;
  }
};
