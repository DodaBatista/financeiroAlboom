import { callAPIN8N } from '@/utils/api';
import type { PageKey } from '@/contexts/AuthContext';

export interface AppUser {
  id: string;
  alboom_user_id: string;
  home_empresa: string;
  name: string;
  email: string;
  is_admin: boolean;
  allowed_pages: PageKey[];
  companies: string[];
}

export interface AppUserPayload {
  id?: string;
  alboom_user_id: string;
  home_empresa: string;
  name: string;
  email: string;
  is_admin: boolean;
  allowed_pages: PageKey[];
  companies: string[];
}

export interface AlboomUserResult {
  alboom_user_id: string;
  name: string;
  email: string;
}

export const fetchAppUsers = async (filters: { empresa?: string; search?: string } = {}): Promise<{ data: AppUser[]; total: number }> => {
  try {
    const response = await callAPIN8N('users/list', filters, 'users/list');
    if (response && response.data) return response;
    if (Array.isArray(response)) return { data: response, total: response.length };
    return { data: [], total: 0 };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};

export const getAppUser = async (id: string): Promise<AppUser> => {
  try {
    const response = await callAPIN8N('users/get', { id }, 'users/get');
    return response?.data || response;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    throw error;
  }
};

export const upsertAppUser = async (data: AppUserPayload) => {
  try {
    const response = await callAPIN8N('users/upsert', data, 'users/upsert');
    return response;
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    throw error;
  }
};

export const searchAlboomUsers = async (empresa: string, searchTerm: string): Promise<AlboomUserResult[]> => {
  try {
    const response = await callAPIN8N('users/search_alboom', { empresa, searchTerm }, 'users/search_alboom');
    return response?.data || [];
  } catch (error) {
    console.error('Erro ao buscar usuários no Alboom:', error);
    throw error;
  }
};
