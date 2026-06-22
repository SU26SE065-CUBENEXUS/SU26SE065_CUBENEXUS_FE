'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { loginApi, logoutApi } from '@/lib/api/auth';
import {
  getAccessToken,
  parseJwt,
  clearTokens,
} from '@/lib/api/config';
import type { AuthUser, LoginRequest, LoginResponse } from '@/lib/api/types';

// ---------- Context Shape ----------

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
}

// ---------- Create Context ----------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------- JWT → AuthUser ----------

function buildUserFromToken(token: string): AuthUser | null {
  const payload = parseJwt(token);
  if (!payload) return null;

  // ASP.NET Core uses full ClaimTypes.NameIdentifier URI for "sub"
  const id =
    (payload['sub'] as string) ||
    (payload[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ] as string) ||
    '';

  const role =
    (payload[
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ] as string) ||
    (payload['role'] as string) ||
    '';

  const email = (payload['email'] as string) || '';
  const displayName = (payload['display_name'] as string) || '';

  return { id, email, displayName, role };
}

// ---------- Provider ----------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const parsed = buildUserFromToken(token);
      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await loginApi(data);
    const parsed = buildUserFromToken(response.accessToken);
    setUser(parsed);
    return response;
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    clearTokens();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------- Hook ----------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
