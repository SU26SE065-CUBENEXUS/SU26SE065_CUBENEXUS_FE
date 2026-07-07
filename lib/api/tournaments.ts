// ============================================================
// CubeNexus API — Tournament endpoints
// ============================================================

import { apiFetch } from './config';
import type {
  TournamentDetailDto,
  CreateTournamentDto,
  EventCompetitorDto,
  OverrideSeedDto,
  RegisteredEventDetailDto,
  GenerateGroupsDto,
  GenerateScramblesDto,
  PuzzleTypeResponseDto,
  TournamentRegistrationDetailDto,
  RegistrationResultDto,
} from './types';

// ---------- Public ----------

/** GET /api/puzzles — Danh sách các loại Rubik */
export async function getPuzzleTypes(): Promise<PuzzleTypeResponseDto[]> {
  return apiFetch<PuzzleTypeResponseDto[]>('/api/puzzles');
}

/** GET /api/tournaments — Danh sách giải đấu public (AllowAnonymous) */
export async function getPublicTournaments(): Promise<TournamentDetailDto[]> {
  return apiFetch<TournamentDetailDto[]>('/api/tournaments');
}

/** GET /api/tournaments/{id} — Chi tiết một giải đấu */
export async function getTournamentById(id: string): Promise<TournamentDetailDto> {
  return apiFetch<TournamentDetailDto>(`/api/tournaments/${id}`);
}

// ---------- Management (MANAGER, ADMIN) ----------

/** POST /api/tournament-management/tournaments — Tạo giải đấu mới */
export async function createTournament(dto: CreateTournamentDto): Promise<TournamentDetailDto> {
  return apiFetch<TournamentDetailDto>('/api/tournament-management/tournaments', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-management/tournaments/{id}/complete — Hoàn thành giải đấu */
export async function completeTournament(tournamentId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/api/tournament-management/tournaments/${tournamentId}/complete`,
    { method: 'POST' }
  );
}

/** GET /api/tournament-management/events/{eventId}/competitors — Danh sách competitor trong event */
export async function getEventCompetitors(eventId: string): Promise<EventCompetitorDto[]> {
  return apiFetch<EventCompetitorDto[]>(
    `/api/tournament-management/events/${eventId}/competitors`
  );
}

/** PATCH /api/tournament-management/registrations/{regEventId}/override-seed */
export async function overrideSeed(
  registrationEventId: string,
  dto: OverrideSeedDto
): Promise<RegisteredEventDetailDto> {
  return apiFetch<RegisteredEventDetailDto>(
    `/api/tournament-management/registrations/${registrationEventId}/override-seed`,
    {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }
  );
}

/** POST /api/tournament-management/events/{eventId}/close-registration */
export async function closeEventRegistration(eventId: string): Promise<unknown> {
  return apiFetch(`/api/tournament-management/events/${eventId}/close-registration`, {
    method: 'POST',
  });
}

/** POST /api/tournament-management/events/{eventId}/groups — Tạo groups và gán stations */
export async function generateGroups(
  eventId: string,
  dto: GenerateGroupsDto
): Promise<unknown> {
  return apiFetch(`/api/tournament-management/events/${eventId}/groups`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-management/events/{eventId}/scrambles — Tạo scrambles */
export async function generateScrambles(
  eventId: string,
  dto: GenerateScramblesDto
): Promise<unknown> {
  return apiFetch(`/api/tournament-management/events/${eventId}/scrambles`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** GET /api/tournament-management/tournaments/{id}/registrations — Lấy tất cả đăng ký của giải đấu */
export async function getTournamentRegistrations(tournamentId: string): Promise<TournamentRegistrationDetailDto[]> {
  return apiFetch<TournamentRegistrationDetailDto[]>(`/api/tournament-management/tournaments/${tournamentId}/registrations`);
}

/** PATCH /api/tournament-management/registrations/{id}/status — Duyệt/hủy đăng ký */
export async function updateRegistrationStatus(registrationId: string, status: string): Promise<RegistrationResultDto> {
  return apiFetch<RegistrationResultDto>(`/api/tournament-management/registrations/${registrationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/** POST /api/tournament-management/registrations/{id}/check-in — Điểm danh thủ công */
export async function checkInRegistration(registrationId: string): Promise<RegistrationResultDto> {
  return apiFetch<RegistrationResultDto>(`/api/tournament-management/registrations/${registrationId}/check-in`, {
    method: 'POST',
  });
}
