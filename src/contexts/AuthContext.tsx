import React, { createContext, useContext, useState, ReactNode } from 'react';
import { loginAPI, setAuthTokens, clearAuthTokens } from '@/utils/api';
import { getCompanyDisplayName, getCompanyFromUrl } from '@/utils/company';

interface User {
  id: string;
  name: string;
  email: string;
  empresa: string;
  empresaDisplay: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
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
        return JSON.parse(stored);
      } catch {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authTokens');
        return null;
      }
    }
    return null;
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await loginAPI(username, password);
      
      // Check if login was successful (adapt based on actual API response structure)
      if (result && result.success && result.user && result.token && result.tokenAlboom) {
        const empresa = getCompanyFromUrl();
        const userData = {
          id: result.user.id || '1',
          name: result.user.name || username,
          email: result.user.email || `${username}@${empresa}.com`,
          empresa,
          empresaDisplay: getCompanyDisplayName(empresa)
        };
        
        // Store tokens separately from user data
        setAuthTokens({
          token: result.token,
          tokenAlboom: result.tokenAlboom
        });
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
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
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};