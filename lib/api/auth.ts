// ============================================================
// CubeNexus API — Auth endpoints
// ============================================================

import { apiFetch, API_BASE_URL, setTokens, clearTokens } from './config';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ForgotPasswordRequest, ForgotPasswordResponse, VerifyOtpRequest, ResetPasswordRequest, MessageResponse } from './types';

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  // Auth endpoints do NOT need Bearer token — call raw fetch
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Login failed');
  }

  const response: LoginResponse = await res.json();
  setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Registration failed');
  }

  return res.json() as Promise<RegisterResponse>;
}

export async function refreshTokenApi(refreshToken: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function forgotPasswordApi(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to request password reset');
  }

  return res.json() as Promise<ForgotPasswordResponse>;
}

export async function verifyOtpApi(data: VerifyOtpRequest): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to verify OTP');
  }

  return res.json() as Promise<MessageResponse>;
}

export async function resetPasswordApi(data: ResetPasswordRequest): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to reset password');
  }

  return res.json() as Promise<MessageResponse>;
}

export function logoutApi(): void {
  clearTokens();
}
