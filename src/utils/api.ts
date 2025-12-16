import { getCompanyFromUrl } from './company';

export const API_BASE_URL = 'https://n8np7.risystems.online/webhook/finance';

interface AuthTokens {
  token: string;
  tokenAlboom: string;
}

export const getAuthTokens = (): AuthTokens | null => {
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
    "Content-Type": "application/json",
    "iduseralboom": "",
    "tokenalboom": tokens?.tokenAlboom || "",
    "Authorization": tokens?.tokenAlboom ? `Bearer ${tokens.tokenAlboom}` : "",
  };
};

export const callAPI = async (
  endpoint: string,
  data: any = {},
  method: string | "POST"
): Promise<any> => {
  const empresa = getCompanyFromUrl();
  const formattedURL = `https://${empresa}.alboomcrm.com/api/${endpoint}`;

  try {
    const options: RequestInit = {
      method,
      headers: getAuthHeaders(),
    };

    if (method !== "GET" && data && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(formattedURL, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error details:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export const callAPIN8N = async (endpoint: string, data: any = {}, uri: string = null): Promise<any> => {
  const empresa = getCompanyFromUrl();

  const API_BASE_URL = 'https://n8np7.risystems.online/webhook';

  const formattedURL = uri ? API_BASE_URL + "/" + uri : API_BASE_URL;

  const tokens = getAuthTokens();

  const headers = {
    "Content-Type": "application/json",
    "iduseralboom": "",
    "tokenalboom": tokens?.tokenAlboom || "",
    "Authorization": tokens?.token ? `Bearer ${tokens.token}` : "",
  };

  try {
    const response = await fetch(formattedURL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        endpoint,
        empresa,
        ...data
      })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // clearAuthTokens();
        // window.location.href = '/login';
        // throw new Error('Session expired. Please login again.');
      }

      // Tenta capturar a resposta de erro do backend
      try {
        const errorData = await response.json();
        const error: any = new Error(errorData.Message || errorData.message || `HTTP error! status: ${response.status}`);
        error.data = errorData;
        error.status = response.status;
        throw error;
      } catch (parseError) {
        // Se não conseguir parsear o JSON, lança erro genérico
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export const callAPIProxy = async (
  endpoint: string,
  data: any = {},
  method: string | "POST"
): Promise<any> => {
  try {
    const options: RequestInit = {
      method,
      headers: getAuthHeaders(),
    };

    if (method !== "GET" && data && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }

    const formattedURL = `/proxy-titulos/${endpoint}`;

    const response = await fetch(formattedURL, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API proxy error details:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API proxy call failed for ${endpoint}:`, error);
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
