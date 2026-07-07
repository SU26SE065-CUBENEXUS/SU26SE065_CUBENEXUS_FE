// ============================================================
// CubeNexus API — Base Config & Fetch Wrapper
// ============================================================

export const API_BASE_URL = '';

// ---------- Token helpers ----------

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ---------- JWT decode helper ----------

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// ---------- Refresh token ----------

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// ---------- Main fetch wrapper ----------

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 401 → try refresh once
  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    const newToken = await tryRefreshToken();
    isRefreshing = false;

    if (newToken) {
      onTokenRefreshed(newToken);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } else {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    let message = (errorBody as { message?: string }).message;
    if (!message && (errorBody as any).errors) {
      const errs = (errorBody as any).errors;
      const details = Object.entries(errs)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
        .join('; ');
      message = `${(errorBody as any).title || 'Validation Error'} - ${details}`;
    }
    if (!message) {
      message = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(message);
  }

  // Handle empty body (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
