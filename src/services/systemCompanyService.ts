import { callAPIN8N } from '@/utils/api';

export interface SystemCompany {
  id: string;
  empresa: string;
  display_name: string;
  username: string;
  expire_token: string;
  form_html?: string;
  active: boolean;
}

export interface SystemCompanyPayload {
  id?: string;
  empresa: string;
  display_name: string;
  username: string;
  password?: string;
  form_html?: string;
  active: boolean;
}

/**
 * Por padrão só traz empresas ativas neste sistema (`active = true`) — é o que login, seletor de
 * empresa etc. devem usar. A tela de admin (`/admin/empresas-sistema`) passa `includeInactive: true`
 * pra poder gerenciar também as empresas desativadas (ex: clientes que usam a Alboom mas não este
 * sistema financeiro, como Espaço Terra e Grupo Bisutti).
 */
export const fetchSystemCompanies = async (
  options: { includeInactive?: boolean } = {}
): Promise<{ data: SystemCompany[]; total: number }> => {
  try {
    const response = await callAPIN8N('system_companies/list', options, 'system_companies/list');
    if (response && response.data) return response;
    if (Array.isArray(response)) return { data: response, total: response.length };
    return { data: [], total: 0 };
  } catch (error) {
    console.error('Erro ao buscar empresas de sistema:', error);
    throw error;
  }
};

export const getSystemCompany = async (id: string): Promise<SystemCompany> => {
  try {
    const response = await callAPIN8N('system_companies/get', { id }, 'system_companies/get');
    return response?.data || response;
  } catch (error) {
    console.error('Erro ao obter empresa de sistema:', error);
    throw error;
  }
};

export const upsertSystemCompany = async (data: SystemCompanyPayload) => {
  try {
    const response = await callAPIN8N('system_companies/upsert', data, 'system_companies/upsert');
    return response;
  } catch (error) {
    console.error('Erro ao salvar empresa de sistema:', error);
    throw error;
  }
};

export const deleteSystemCompany = async (id: string) => {
  try {
    const response = await callAPIN8N('system_companies/delete', { id }, 'system_companies/delete');
    return response;
  } catch (error) {
    console.error('Erro ao remover empresa de sistema:', error);
    throw error;
  }
};
