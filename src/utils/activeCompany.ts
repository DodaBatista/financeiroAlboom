const ACTIVE_EMPRESA_KEY = 'activeEmpresa';

export const getHomeEmpresa = (): string | null => {
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    return user?.homeEmpresa || null;
  } catch {
    return null;
  }
};

export const getActiveEmpresa = (): string | null => {
  return localStorage.getItem(ACTIVE_EMPRESA_KEY) || getHomeEmpresa();
};

export const setActiveEmpresa = (empresa: string): void => {
  localStorage.setItem(ACTIVE_EMPRESA_KEY, empresa);
};

export const clearActiveEmpresa = (): void => {
  localStorage.removeItem(ACTIVE_EMPRESA_KEY);
};
