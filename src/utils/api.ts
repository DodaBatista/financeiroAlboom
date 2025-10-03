import { getCompanyFromUrl } from './company';

const API_BASE_URL = 'https://fluxo.riapp.app/webhook/finance';

interface AuthTokens {
  token: string;
  tokenAlboom: string;
}

const getAuthTokens = (): AuthTokens | null => {
  const storedTokens = localStorage.getItem('authTokens');
  if (!storedTokens) return null;

  try {
    return JSON.parse(storedTokens);
  } catch {
    return null;
  }
};

export const setAuthTokens = (tokens: AuthTokens): void => {
  localStorage.setItem('authTokens', JSON.stringify(tokens));
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem('authTokens');
  localStorage.removeItem('user');
};

const getAuthHeaders = (): Record<string, string> => {
  const tokens = getAuthTokens();

  return {
    'Content-Type': 'application/json',
    'iduseralboom': '',
    'tokenalboom': tokens?.tokenAlboom || '',
    'Authorization': tokens?.token ? `Bearer ${tokens.token}` : '',
  };
};

export const callAPI = async (endpoint: string, data: any = {}, uri: string = null): Promise<any> => {
  const empresa = getCompanyFromUrl();

  const formattedURL = uri ? API_BASE_URL + "/" + uri : API_BASE_URL;

  try {
    const response = await fetch(formattedURL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        endpoint,
        empresa,
        ...data
      })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export const loginAPI = async (username: string, password: string): Promise<any> => {
  const empresa = getCompanyFromUrl();

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        empresa,
        username,
        password
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const textResponse = await response.text();
    if (!textResponse) {
      throw new Error('Resposta vazia do servidor');
    }

    let result;
    try {
      result = JSON.parse(textResponse);
    } catch {
      throw new Error('Resposta inválida do servidor');
    }

    if (Array.isArray(result)) {
      result = result[0];
    }

    if (!result || !result.token || !result.tokenAlboom || !result.user) {
      throw new Error(result?.message || 'Usuário ou senha incorretos');
    }

    return result;
  } catch (error) {
    console.error('Login API call failed:', error);
    throw error;
  }
};

export const getProcessedPayments = async (type: 'ap' | 'ar'): Promise<any> => {
  const empresa = getCompanyFromUrl();
  const tokens = getAuthTokens();

  if (!tokens) {
    throw new Error('No authentication tokens available');
  }

  try {
    const url = `${API_BASE_URL}/processed?empresa=${empresa}&type=${type}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'iduseralboom': '',
        'tokenalboom': tokens.tokenAlboom,
        'Authorization': `Bearer ${tokens.token}`,
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get processed payments failed:', error);
    throw error;
  }
};

export const getProcessedAppointments = async (): Promise<any> => {
  const empresa = getCompanyFromUrl();
  const tokens = getAuthTokens();

  if (!tokens) {
    throw new Error("No authentication tokens available");
  }

  try {
    const url = `${API_BASE_URL}/scheduling/processed?empresa=${empresa}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "iduseralboom": "",
        "tokenalboom": tokens.tokenAlboom,
        Authorization: `Bearer ${tokens.token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthTokens();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Get processed appointments failed:", error);
    throw error;
  }
};