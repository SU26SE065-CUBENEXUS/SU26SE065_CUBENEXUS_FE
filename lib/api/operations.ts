// ============================================================
// CubeNexus API — Tournament Operation endpoints
// ============================================================

import { apiFetch } from './config';
import type {
  CheckInRequestDto,
  CheckInResponseDto,
  SubmitTraditionalResultDto,
  SubmitMedleyResultDto,
  StartRoundRequestDto,
  AdvanceRoundRequestDto,
  ResultCorrectionDto,
  VerifyJudgeStationByStationDto,
  VerifyJudgeStationResponseDto,
  SubmitResultResponseDto,
  SolveProgressDto,
  CompetitorQrTicketDto,
  SimStationCompetitorDto,
} from './types';

/** GET /api/tournament-operation/competitor/qr-ticket — Lấy QR ticket cho đấu thủ */
export async function getCompetitorQrTicket(tournamentId: string): Promise<CompetitorQrTicketDto> {
  return apiFetch<CompetitorQrTicketDto>(`/api/tournament-operation/competitor/qr-ticket?tournamentId=${tournamentId}`);
}

/** GET /api/tournament-operation/simulation/station-competitors — Lấy danh sách competitor để chạy thử giả lập */
export async function getStationCompetitorsForSimulation(
  eventId: string,
  roundNumber: number,
  stationNumber: number
): Promise<SimStationCompetitorDto[]> {
  return apiFetch<SimStationCompetitorDto[]>(
    `/api/tournament-operation/simulation/station-competitors?eventId=${eventId}&roundNumber=${roundNumber}&stationNumber=${stationNumber}`
  );
}

/** POST /api/tournament-operation/check-in — Điểm danh bằng QR Token */
export async function checkIn(dto: CheckInRequestDto): Promise<CheckInResponseDto> {
  return apiFetch<CheckInResponseDto>('/api/tournament-operation/check-in', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-operation/results/traditional — Lưu kết quả Traditional */
export async function submitTraditionalResult(dto: SubmitTraditionalResultDto): Promise<SubmitResultResponseDto> {
  return apiFetch<SubmitResultResponseDto>('/api/tournament-operation/results/traditional', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-operation/results/medley — Lưu kết quả Medley */
export async function submitMedleyResult(dto: SubmitMedleyResultDto): Promise<SubmitResultResponseDto> {
  return apiFetch<SubmitResultResponseDto>('/api/tournament-operation/results/medley', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-operation/events/{eventId}/rounds/{n}/start */
export async function startRound(
  eventId: string,
  roundNumber: number,
  dto: StartRoundRequestDto = {}
): Promise<unknown> {
  return apiFetch(
    `/api/tournament-operation/events/${eventId}/rounds/${roundNumber}/start`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
}

/** POST /api/tournament-operation/events/{eventId}/rounds/{n}/lock-results */
export async function lockRoundResults(
  eventId: string,
  roundNumber: number
): Promise<unknown> {
  return apiFetch(
    `/api/tournament-operation/events/${eventId}/rounds/${roundNumber}/lock-results`,
    { method: 'POST' }
  );
}

/** POST /api/tournament-operation/events/{eventId}/rounds/{n}/complete */
export async function completeRound(
  eventId: string,
  roundNumber: number
): Promise<unknown> {
  return apiFetch(
    `/api/tournament-operation/events/${eventId}/rounds/${roundNumber}/complete`,
    { method: 'POST' }
  );
}

/** POST /api/tournament-operation/events/{eventId}/rounds/{n}/advance */
export async function advanceRound(
  eventId: string,
  roundNumber: number,
  dto: AdvanceRoundRequestDto
): Promise<unknown> {
  return apiFetch(
    `/api/tournament-operation/events/${eventId}/rounds/${roundNumber}/advance`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
}

/** PATCH /api/tournament-operation/results/{resultId}/correction */
export async function correctResult(
  resultId: string,
  dto: ResultCorrectionDto
): Promise<unknown> {
  return apiFetch(`/api/tournament-operation/results/${resultId}/correction`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

/** POST /api/tournament-operation/judge/verify-by-station — Xác thực QR tại trạm trọng tài */
export async function verifyJudgeStation(dto: VerifyJudgeStationByStationDto): Promise<VerifyJudgeStationResponseDto> {
  return apiFetch<VerifyJudgeStationResponseDto>('/api/tournament-operation/judge/verify-by-station', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** GET /api/tournament-operation/competitors/{groupCompetitorId}/solve-progress — Lấy tiến trình solve */
export async function getSolveProgress(groupCompetitorId: string): Promise<SolveProgressDto> {
  return apiFetch<SolveProgressDto>(`/api/tournament-operation/competitors/${groupCompetitorId}/solve-progress`);
}

/** POST /api/tournament-operation/events/{eventId}/complete — Hoàn thành Event */
export async function completeEvent(eventId: string): Promise<unknown> {
  return apiFetch(`/api/tournament-operation/events/${eventId}/complete`, {
    method: 'POST',
  });
}

/** GET /api/tournament-operation/groups/{groupId}/scrambles — Lấy danh sách Scramble của Group */
export async function getGroupScrambles(groupId: string): Promise<Array<{ id: string; solveNumber: number; puzzleTypeId: string; sequence: string; sortOrder: number }>> {
  return apiFetch<Array<{ id: string; solveNumber: number; puzzleTypeId: string; sequence: string; sortOrder: number }>>(
    `/api/tournament-operation/groups/${groupId}/scrambles`
  );
}

/** GET /api/live-board/events/{eventId}/rounds/{roundNumber} — Lấy trạng thái Live Board */
export async function getLiveBoardState(
  eventId: string,
  roundNumber: number
): Promise<{
  eventId: string;
  eventName: string;
  roundNumber: number;
  roundStatus: string;
  solveCount: number;
  progress: {
    totalCompetitors: number;
    completedCompetitors: number;
    noShowCompetitors: number;
    pendingCompetitors: number;
    totalExpectedSolves: number;
    submittedSolves: number;
  } | null;
  groups: Array<{ groupId: string; groupName: string; statusCode: string }>;
  competitors: Array<{
    groupCompetitorId: string;
    competitorName: string;
    competitorUserCode: string;
    competitorAvatarUrl?: string;
    stationNumber?: number;
    groupId: string;
    bestTimeMs?: number;
    averageTimeMs?: number;
    rank?: number;
    completedSolves: number;
    competitorStatus: string;
    results: Array<{
      resultId: string;
      solveNumber: number;
      rawTimeMs?: number;
      finalTimeMs?: number;
      penaltyCode: string;
      isDnf: boolean;
      isLocked: boolean;
      submittedAt: string;
    }>;
  }>;
}> {
  return apiFetch(
    `/api/live-board/events/${eventId}/rounds/${roundNumber}?_=${Date.now()}`
  );
}

/** GET /api/tournament-operation/penalty-types — Lấy danh sách các Penalty Type */
export async function getPenaltyTypes(): Promise<
  Array<{ id: string; code: string; label: string; timeAdditionMs: number; isDisqualified: boolean }>
> {
  return apiFetch<
    Array<{ id: string; code: string; label: string; timeAdditionMs: number; isDisqualified: boolean }>
  >('/api/tournament-operation/penalty-types');
}

