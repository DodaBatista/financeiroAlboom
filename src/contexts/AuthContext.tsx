import { clearAuthTokens, loginAPI, setAuthTokens } from '@/utils/api';
import { clearActiveEmpresa, getActiveEmpresa, setActiveEmpresa } from '@/utils/activeCompany';
import { getCompanyDisplayName } from '@/utils/company';
import React, { createContext, ReactNode, useContext, useState } from 'react';

export type PageKey = 'accounts-payable' | 'accounts-receivable' | 'appointments' | 'payment-requests';

interface User {
  id: string;
  name: string;
  email: string;
  empresa: string;
  empresaDisplay: string;
  homeEmpresa: string;
  isAdmin: boolean;
  allowedPages: PageKey[];
  allowedCompanies: string[];
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, empresa: string, empresaDisplay?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPage: (page: PageKey) => boolean;
  activeEmpresa: string | null;
  switchCompany: (empresa: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    const storedTokens = localStorage.getItem('authTokens');

    // Only restore user if both user data and tokens exist
    if (stored && storedTokens) {
      try {
        const parsed = JSON.parse(stored);
        // Sessão salva por uma versão anterior ao suporte multi-empresa não tem esses campos
        // (allowedPages/allowedCompanies vêm como undefined). Sem essa checagem, hasPage() e
        // switchCompany() estouram TypeError ao chamar .includes() em undefined assim que a
        // página carrega — e como o dado ruim continua salvo, o erro se repete a cada reload
        // (efeito de "cache preso"). Tratamos como sessão inválida e forçamos um novo login
        // uma única vez; não afeta usuários com sessão já no formato atual.
        if (
          !parsed ||
          !Array.isArray(parsed.allowedPages) ||
          !Array.isArray(parsed.allowedCompanies) ||
          typeof parsed.homeEmpresa !== 'string'
        ) {
          localStorage.removeItem('user');
          localStorage.removeItem('authTokens');
          return null;
        }
        return parsed;
      } catch {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authTokens');
        return null;
      }
    }
    return null;
  });

  const [activeEmpresa, setActiveEmpresaState] = useState<string | null>(() => getActiveEmpresa());

  const login = async (username: string, password: string, empresa: string, empresaDisplay?: string): Promise<boolean> => {
    try {
      const result = await loginAPI(username, password, empresa);

      // Check if login was successful (adapt based on actual API response structure)
      if (result && result.user && result.token && result.tokenAlboom) {
        // Fallback para logins antigos ou usuários ainda não cadastrados em app_users:
        // loga normalmente mas não enxerga nenhuma página até um admin liberar via /admin/usuarios.
        const permissions = result.permissions || {
          isAdmin: false,
          allowedPages: [],
          allowedCompanies: [empresa],
        };

        const userData: User = {
          id: result.user.id,
          name: result.user.name || username,
          email: result.user.email,
          empresa,
          empresaDisplay: empresaDisplay || getCompanyDisplayName(empresa),
          homeEmpresa: empresa,
          isAdmin: !!permissions.isAdmin,
          allowedPages: permissions.allowedPages || [],
          allowedCompanies: permissions.allowedCompanies?.length ? permissions.allowedCompanies : [empresa],
        };

        // Store tokens separately from user data
        setAuthTokens({
          token: result.token,
          tokenAlboom: result.tokenAlboom
        });

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        setActiveEmpresa(empresa);
        setActiveEmpresaState(empresa);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthTokens();
    clearActiveEmpresa();
    setActiveEmpresaState(null);
  };

  const hasPage = (page: PageKey): boolean => {
    if (!user) return false;
    return user.isAdmin || (user.allowedPages ?? []).includes(page);
  };

  const switchCompany = (empresa: string) => {
    if (!user) return;
    if (!(user.allowedCompanies ?? []).includes(empresa)) {
      console.error(`Usuário não tem acesso liberado à empresa "${empresa}"`);
      return;
    }
    setActiveEmpresa(empresa);
    setActiveEmpresaState(empresa);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasPage,
    activeEmpresa,
    switchCompany,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
