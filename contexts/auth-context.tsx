'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { loginApi, logoutApi, getMyProfileApi } from '@/lib/api/auth';
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
  refreshUser: () => Promise<void>;
  updateUser: (fields: Partial<AuthUser>) => void;
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
  const displayName = (payload['displayName'] as string) || (payload['display_name'] as string) || '';

  return { id, email, displayName, role };
}

// ---------- Provider ----------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Refresh user profile from BE API
  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await getMyProfileApi();
      setUser({
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName || 'User',
        role: profile.userRole || 'COMPETITOR',
        avatarUrl: profile.avatarUrl || undefined,
      });
    } catch (err) {
      console.warn('Failed to refresh user profile from API, falling back to JWT:', err);
      const parsed = buildUserFromToken(token);
      if (parsed) setUser(parsed);
    }
  }, []);

  const updateUser = useCallback((fields: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null));
  }, []);

  // Hydrate from localStorage and API on mount
  useEffect(() => {
    async function initAuth() {
      const token = getAccessToken();
      if (token) {
        const parsed = buildUserFromToken(token);
        setUser(parsed);
        // Async fetch full profile to get avatarUrl
        try {
          const profile = await getMyProfileApi();
          setUser({
            id: profile.id,
            email: profile.email,
            displayName: profile.displayName || parsed?.displayName || 'User',
            role: profile.userRole || parsed?.role || 'COMPETITOR',
            avatarUrl: profile.avatarUrl || undefined,
          });
        } catch {
          // ignore, token fallback remains
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await loginApi(data);
    const parsed = buildUserFromToken(response.accessToken);
    setUser(parsed);
    // Fetch profile immediately after login for avatar
    try {
      const profile = await getMyProfileApi();
      setUser({
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName || response.displayName,
        role: profile.userRole || parsed?.role || 'COMPETITOR',
        avatarUrl: profile.avatarUrl || undefined,
      });
    } catch {
      // Keep parsed
    }
    return response;
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        updateUser,
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
