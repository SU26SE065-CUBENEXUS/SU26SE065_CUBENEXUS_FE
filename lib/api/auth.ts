// ============================================================
// CubeNexus API — Auth & Profile endpoints
// ============================================================

import { apiFetch, setTokens, clearTokens } from './config';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyOtpRequest,
  ResetPasswordRequest,
  MessageResponse,
  UserProfileDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from './types';

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('Email', data.email);
  formData.append('Password', data.password);
  formData.append('DisplayName', data.displayName);
  formData.append('Phone', data.phone || '0900000000');
  formData.append('Address', data.address || 'Việt Nam');
  if (data.avatarFile) {
    formData.append('file', data.avatarFile);
  }

  return apiFetch<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: formData,
  });
}

export async function refreshTokenApi(refreshToken: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function forgotPasswordApi(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyOtpApi(data: VerifyOtpRequest): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPasswordApi(data: ResetPasswordRequest): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyProfileApi(): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>('/api/Auth/My-Profile');
}

export async function updateProfileApi(data: UpdateProfileRequest): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>('/api/Auth/Update-Profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadAvatarApi(file: File): Promise<UserProfileDto> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<UserProfileDto>('/api/Auth/Upload-Avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function changePasswordApi(data: ChangePasswordRequest): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/Auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logoutApi(): void {
  clearTokens();
}
