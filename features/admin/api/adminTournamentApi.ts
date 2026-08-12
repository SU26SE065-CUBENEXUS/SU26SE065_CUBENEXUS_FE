import { apiFetch } from '@/lib/api/config';

export interface AdminTournamentEventDto {
  id: string;
  puzzleTypeId: string;
  puzzleTypeName: string;
  puzzleTypeCode: string;
  eventFormatCode: string;
  registrationStatusCode?: string;
}

export interface AdminTournamentDto {
  id: string;
  name: string;
  description?: string;
  location?: string;
  maxParticipants?: number;
  registeredParticipantsCount: number;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  statusCode: string;
  tournamentType: string;
  formatCode: string;
  puzzleTypeId?: string;
  puzzleTypeName?: string;
  puzzleTypeCode?: string;
  attemptTimeLimitMs: number;
  createdByUserId: string;
  createdByName: string;
  createdByEmail: string;
  createdByCode: string;
  createdAt: string;
  eventsCount: number;
  events: AdminTournamentEventDto[];
}

export interface AdminTournamentPagedResultDto {
  items: AdminTournamentDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function getAdminTournaments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<AdminTournamentPagedResultDto> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);

  return apiFetch<AdminTournamentPagedResultDto>(`/api/admin/tournaments?${query.toString()}`);
}

export async function getAdminTournamentById(id: string): Promise<AdminTournamentDto> {
  return apiFetch<AdminTournamentDto>(`/api/admin/tournaments/${id}`);
}

export async function updateAdminTournamentStatus(
  id: string,
  statusCode: string
): Promise<AdminTournamentDto> {
  return apiFetch<AdminTournamentDto>(`/api/admin/tournaments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ statusCode }),
  });
}

export async function forceStartOnlineAsyncTournament(id: string): Promise<AdminTournamentDto> {
  return apiFetch<AdminTournamentDto>(`/api/admin/tournaments/${id}/online-async/force-start`, { method: 'POST' });
}

export async function closeOnlineAsyncRegistration(id: string): Promise<AdminTournamentDto> {
  return apiFetch<AdminTournamentDto>(`/api/admin/tournaments/${id}/online-async/close-registration`, { method: 'POST' });
}
