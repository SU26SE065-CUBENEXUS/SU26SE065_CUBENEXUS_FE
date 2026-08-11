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
  TournamentJudgeDto,
  CreateTournamentJudgeDto,
  BatchCreateTournamentJudgeDto,
  UpdateTournamentJudgeDto,
  ResetJudgePasswordDto,
  ShuffleTournamentJudgesDto,
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

/** POST /api/tournament-management/tournaments/{id}/close-registration — Đóng cổng đăng ký giải đấu */
export async function closeRegistration(tournamentId: string): Promise<TournamentDetailDto> {
  return apiFetch<TournamentDetailDto>(
    `/api/tournament-management/tournaments/${tournamentId}/close-registration`,
    { method: 'POST' }
  );
}

/** POST /api/tournament-management/tournaments/{id}/complete — Hoàn thành giải đấu */
export async function completeTournament(tournamentId: string): Promise<TournamentDetailDto> {
  return apiFetch<TournamentDetailDto>(
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

// ---------- Tournament Judges ----------

/** GET /api/tournament-management/tournaments/{tournamentId}/judges — Lấy danh sách Trọng tài */
export async function getTournamentJudges(tournamentId: string): Promise<TournamentJudgeDto[]> {
  return apiFetch<TournamentJudgeDto[]>(`/api/tournament-management/tournaments/${tournamentId}/judges`);
}

/** POST /api/tournament-management/tournaments/{tournamentId}/judges — Tạo 1 Trọng tài */
export async function createTournamentJudge(tournamentId: string, dto: CreateTournamentJudgeDto): Promise<TournamentJudgeDto> {
  return apiFetch<TournamentJudgeDto>(`/api/tournament-management/tournaments/${tournamentId}/judges`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-management/tournaments/{tournamentId}/judges/batch — Tạo HÀNG LOẠT Trọng tài 1-click */
export async function batchCreateTournamentJudges(tournamentId: string, dto: BatchCreateTournamentJudgeDto): Promise<TournamentJudgeDto[]> {
  return apiFetch<TournamentJudgeDto[]>(`/api/tournament-management/tournaments/${tournamentId}/judges/batch`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** PUT /api/tournament-management/tournaments/{tournamentId}/judges/{judgeUserId} — Sửa tên Trọng tài */
export async function updateTournamentJudge(tournamentId: string, judgeUserId: string, dto: UpdateTournamentJudgeDto): Promise<TournamentJudgeDto> {
  return apiFetch<TournamentJudgeDto>(`/api/tournament-management/tournaments/${tournamentId}/judges/${judgeUserId}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-management/tournaments/{tournamentId}/judges/{judgeUserId}/reset-password — Đặt lại mật khẩu */
export async function resetTournamentJudgePassword(tournamentId: string, judgeUserId: string, dto: ResetJudgePasswordDto): Promise<TournamentJudgeDto> {
  return apiFetch<TournamentJudgeDto>(`/api/tournament-management/tournaments/${tournamentId}/judges/${judgeUserId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-management/tournaments/{tournamentId}/judges/shuffle — Đổi vị trí / Tráo ngẫu nhiên vai trò & bàn thi */
export async function shuffleTournamentJudges(tournamentId: string, dto: ShuffleTournamentJudgesDto): Promise<TournamentJudgeDto[]> {
  return apiFetch<TournamentJudgeDto[]>(`/api/tournament-management/tournaments/${tournamentId}/judges/shuffle`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** PATCH /api/tournament-management/tournaments/{tournamentId}/judges/{judgeUserId}/toggle-status — Bật/tắt trạng thái trọng tài */
export async function toggleJudgeStatus(tournamentId: string, judgeUserId: string, isActive: boolean): Promise<TournamentJudgeDto> {
  return apiFetch<TournamentJudgeDto>(`/api/tournament-management/tournaments/${tournamentId}/judges/${judgeUserId}/toggle-status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

/** POST /api/tournament-management/tournaments/{tournamentId}/judges/deactivate-all — Vô hiệu hóa tất cả trọng tài */
export async function deactivateAllJudges(tournamentId: string): Promise<TournamentJudgeDto[]> {
  return apiFetch<TournamentJudgeDto[]>(`/api/tournament-management/tournaments/${tournamentId}/judges/deactivate-all`, {
    method: 'POST',
  });
}

/** DELETE /api/tournament-management/tournaments/{tournamentId}/judges/{judgeUserId} — Xóa Trọng tài */
export async function deleteTournamentJudge(tournamentId: string, judgeUserId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/tournament-management/tournaments/${tournamentId}/judges/${judgeUserId}`, {
    method: 'DELETE',
  });
}

