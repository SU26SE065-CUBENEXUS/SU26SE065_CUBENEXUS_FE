import { apiFetch } from '@/lib/api/config';
import type { OnlineMatchHistoryResponseDto } from '@/features/online-arena/api/onlineArenaApi';

export interface AdminUserDto {
  id: string;
  userCode: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  phone: string;
  address: string;
  userRole: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedUntil?: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPagedResultDto {
  items: AdminUserDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function getAdminUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<AdminUserPagedResultDto> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.search) query.append('search', params.search);
  if (params.role) query.append('role', params.role);
  if (params.status) query.append('status', params.status);

  return apiFetch<AdminUserPagedResultDto>(`/api/admin/users?${query.toString()}`);
}

export async function getAdminUserById(userId: string): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/api/admin/users/${userId}`);
}

export async function getAdminUserOnlineMatches(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  puzzleTypeId?: string,
): Promise<OnlineMatchHistoryResponseDto> {
  const query = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
  if (puzzleTypeId) query.set('puzzleTypeId', puzzleTypeId);
  return apiFetch<OnlineMatchHistoryResponseDto>(
    `/api/admin/users/${userId}/online-matches?${query.toString()}`,
  );
}

export async function updateUserRole(userId: string, userRole: string): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ userRole }),
  });
}

export async function banUser(
  userId: string,
  banReason: string,
  durationDays?: number
): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/api/admin/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({
      durationDays: durationDays || null,
      banReason,
    }),
  });
}

export async function unbanUser(userId: string): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/api/admin/users/${userId}/unban`, {
    method: 'POST',
  });
}
