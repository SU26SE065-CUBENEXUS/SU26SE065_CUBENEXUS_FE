import { apiFetch } from '@/lib/api/config';
import type {
  MatchmakingStatusDto,
  OnlineMatchRecoveryStateDto,
  ScannerStartResponseDto,
  SubmitSolveTimeRequest,
  SubmitSolveTimeResponseDto,
} from '../types';

const DIRECT_AI_SCANNER_BASE_URL = process.env.NEXT_PUBLIC_AI_SCANNER_BASE_URL || 'https://robena-nonapparitional-knox.ngrok-free.dev';

/** POST /api/online/matchmaking/find */
export async function findMatch(puzzleTypeId: string): Promise<MatchmakingStatusDto> {
  return apiFetch<MatchmakingStatusDto>('/api/online/matchmaking/find', {
    method: 'POST',
    body: JSON.stringify({ puzzleTypeId }),
  });
}

/** POST /api/online/matchmaking/confirm/{confirmationId} */
export async function confirmMatch(confirmationId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matchmaking/confirm/${confirmationId}`, {
    method: 'POST',
  });
}

/** DELETE /api/online/matchmaking */
export async function cancelMatchmaking(puzzleTypeId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matchmaking?puzzleTypeId=${puzzleTypeId}`, {
    method: 'DELETE',
  });
}

/** GET /api/online/matches/{matchId}/state */
export async function getMatchState(matchId: string): Promise<OnlineMatchRecoveryStateDto> {
  return apiFetch<OnlineMatchRecoveryStateDto>(`/api/online/matches/${matchId}/state`);
}



/** POST /api/online/matches/{matchId}/webrtc-connected */
export async function markWebRtcConnected(matchId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/webrtc-connected`, {
    method: 'POST',
    body: JSON.stringify({ connectionState: 'connected', iceConnectionState: 'connected' }),
  });
}

/** POST /api/online/matches/{matchId}/video-recording-started */
export async function markVideoRecordingStarted(matchId: string, mimeType?: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/video-recording-started`, {
    method: 'POST',
    body: JSON.stringify({
      recordingStartedAt: new Date().toISOString(),
      mimeType: mimeType ?? 'video/webm',
    }),
  });
}

/** POST /api/online/matches/{matchId}/scanner/{validationType}/start */
export async function startScanner(
  matchId: string,
  validationType: string,
): Promise<ScannerStartResponseDto> {
  return apiFetch<ScannerStartResponseDto>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/start`,
    { method: 'POST' },
  );
}

/** GET /api/online/matches/{matchId}/scanner/{validationType} */
export async function getScannerSession(
  matchId: string,
  validationType: string,
): Promise<ScannerStartResponseDto> {
  return apiFetch<ScannerStartResponseDto>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}`,
  );
}

export async function observeDirectAiScannerFrame(
  aiSessionId: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<any> {
  return fetch(
    `${DIRECT_AI_SCANNER_BASE_URL}/ai/scanner-test/session/${encodeURIComponent(aiSessionId)}/observe`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
      signal,
    },
  ).then(async (response) => {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = (errorBody as { detail?: string; message?: string }).detail
        || (errorBody as { detail?: string; message?: string }).message
        || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    return response.json();
  });
}

/**
 * Gọi trực tiếp AI service qua Next.js rewrite proxy (/api/ai-service).
 * Điều này bỏ qua hoàn toàn C# backend và DB lookup cho mỗi frame preview,
 * đem lại tốc độ scan mượt mà tuyệt đối như test client.
 */
export async function previewScannerFrame(
  matchId: string,
  validationType: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toLowerCase()}/preview`,
    {
      method: 'POST',
      body: formData,
      signal,
    },
  );
}

export async function commitScannerObservation(
  matchId: string,
  validationType: string,
  payload: {
    scanSessionId: string;
    scanGeneration: number;
    requestId: string;
    targetFaceIndex: number;
    observation: any;
  },
): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/commit-observation`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function completeScannerSession(
  matchId: string,
  validationType: string,
  payload: {
    scanSessionId: string;
    scanGeneration: number;
    requestId: string;
    observations: any[];
  },
): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/complete`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

/** POST /api/online/matches/{matchId}/scramble-validation/batch */
export async function submitScrambleBatch(
  matchId: string,
  payload: {
    sessionId: string;
    faces: Array<{
      centerColor: string;
      stickers?: string[];
      grid3x3?: string[][];
    }>;
  },
): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/scramble-validation/batch`, {
    method: 'POST',
    body: JSON.stringify({
      matchId,
      sessionId: payload.sessionId,
      faces: payload.faces,
    }),
  });
}

/** POST /api/online/matches/{matchId}/scanner/{validationType}/retry-face */
export async function retryScannerFace(matchId: string, validationType: string): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/retry-face`,
    { method: 'POST' },
  );
}

/** POST /api/online/matches/{matchId}/scanner/{validationType}/reset */
export async function resetScanner(matchId: string, validationType: string): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/reset`,
    { method: 'POST' },
  );
}

/** POST /api/online/mobile-timer/submit-time */
export async function submitMobileTimerTime(payload: SubmitSolveTimeRequest): Promise<SubmitSolveTimeResponseDto> {
  return apiFetch<SubmitSolveTimeResponseDto>('/api/online/mobile-timer/submit-time', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /api/online/profiles/me */
export async function getMyProfiles(): Promise<any[]> {
  return apiFetch<any[]>('/api/online/profiles/me');
}

/** POST /api/online/profiles/init */
export async function initProfile(puzzleTypeId: string): Promise<any> {
  return apiFetch<any>('/api/online/profiles/init', {
    method: 'POST',
    body: JSON.stringify({ puzzleTypeId }),
  });
}

/** POST /api/online/matches/{matchId}/dev/mock-scramble-pass */
export async function mockScramblePass(matchId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/dev/mock-scramble-pass`, {
    method: 'POST',
  });
}

/** POST /api/online/matches/{matchId}/dev/mock-finish-pass */
export async function mockFinishPass(matchId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/dev/mock-finish-pass`, {
    method: 'POST',
  });
}

export interface PlaybackItemDto {
  playerId: string;
  videoEvidenceId: string;
  playbackUrl: string;
  expiresAt: string;
  durationSeconds?: number;
}

export interface PlaybackResponseDto {
  matchId: string;
  recordings: PlaybackItemDto[];
}

/** GET /api/matches/{matchId}/recording/playback-url */
export async function getMatchRecordingPlaybackUrls(matchId: string): Promise<PlaybackResponseDto> {
  return apiFetch<PlaybackResponseDto>(`/api/matches/${matchId}/recording/playback-url`);
}

export interface OnlineMatchHistoryItemDto {
  matchId: string;
  puzzleTypeId: string;
  puzzleTypeName: string;
  scrambleSequence: string;
  modeName: string;
  meUserId: string;
  meUsername: string;
  meAvatarUrl?: string;
  meTimeMs?: number;
  meIsDnf: boolean;
  meEloBefore?: number;
  meEloAfter?: number;
  eloChange: number;
  opponentUserId: string;
  opponentUsername: string;
  opponentAvatarUrl?: string;
  opponentTimeMs?: number;
  opponentIsDnf: boolean;
  opponentEloBefore?: number;
  opponentEloAfter?: number;
  isWinner: boolean;
  isDraw: boolean;
  statusCode: string;
  outcome: string;
  createdAt: string;
  endedAt?: string;
  hasVideoReplay: boolean;
  reportStatus?: string;
  reportVerdictCode?: string;
  reportAdminNote?: string;
  reportedByUserId?: string;
}

export interface OnlineMatchHistoryResponseDto {
  matches: OnlineMatchHistoryItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** GET /api/online/matches/history */
export async function getMyMatchHistory(
  puzzleTypeId?: string,
  page: number = 1,
  pageSize: number = 15,
): Promise<OnlineMatchHistoryResponseDto> {
  const params = new URLSearchParams();
  if (puzzleTypeId) params.append('puzzleTypeId', puzzleTypeId);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  return apiFetch<OnlineMatchHistoryResponseDto>(`/api/online/matches/history?${params.toString()}`);
}

export interface CreateFraudReportPayload {
  fraudType: string;
  timestampText: string;
  timestampSeconds: number;
  description: string;
  evidenceUrl?: string;
  evidenceScreenshotUrl?: string;
}

export interface FraudReportDto {
  id: string;
  matchId: string;
  reporterUserId: string;
  reportedUserId: string;
  reasonCode?: string;
  fraudType: string;
  timestampText: string;
  timestampSeconds: number;
  description?: string;
  evidenceUrl?: string;
  evidenceScreenshotUrl?: string;
  statusCode: string;
  reviewScope: string;
  decision?: string;
  penaltyAction?: string;
  resolvedByAdminId?: string;
  resolvedAt?: string;
  reviewedBy?: string;
  verdictCode?: string;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface FraudReportDetailDto {
  report: FraudReportDto;
  match: any;
  aiChecks: any[];
  videoEvidences: any[];
  auditLogs: any[];
}

/** POST /api/online/matches/{matchId}/reports */
export async function createFraudReport(
  matchId: string,
  payload: CreateFraudReportPayload,
): Promise<FraudReportDto> {
  return apiFetch<FraudReportDto>(`/api/online/matches/${matchId}/reports`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface MatchFraudReportStatusDto {
  id: string;
  matchId: string;
  reporterUserId: string;
  reportedUserId: string;
  fraudType: string;
  timestampText: string;
  description?: string;
  statusCode: string;
  verdictCode?: string;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export async function getMatchFraudReport(matchId: string): Promise<MatchFraudReportStatusDto | null> {
  try {
    return await apiFetch<MatchFraudReportStatusDto>(`/api/online/matches/${matchId}/report`);
  } catch {
    return null;
  }
}

/** GET /api/admin/fraud-reports */
export async function getPendingFraudReports(): Promise<FraudReportDto[]> {
  return apiFetch<FraudReportDto[]>('/api/admin/fraud-reports');
}

/** GET /api/admin/fraud-reports/{reportId} */
export async function getFraudReportDetail(reportId: string): Promise<FraudReportDetailDto> {
  return apiFetch<FraudReportDetailDto>(`/api/admin/fraud-reports/${reportId}`);
}

/** POST /api/admin/fraud-reports/{reportId}/review */
export async function reviewFraudReport(
  reportId: string,
  verdictCode: string,
  adminNote?: string,
): Promise<FraudReportDto> {
  return apiFetch<FraudReportDto>(`/api/admin/fraud-reports/${reportId}/review`, {
    method: 'POST',
    body: JSON.stringify({ verdictCode, adminNote }),
  });
}

export interface EloConfigDto {
  id: string;
  kFactorPlacement: number;
  kFactorStandard: number;
  placementMatchCount: number;
  defaultElo: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface UpdateEloConfigRequest {
  kFactorPlacement: number;
  kFactorStandard: number;
  placementMatchCount: number;
  defaultElo: number;
}

export interface AdminPlayerEloDto {
  userId: string;
  username: string;
  avatarUrl?: string;
  puzzleTypeId: string;
  puzzleTypeName: string;
  eloStandard: number;
  peakEloStandard: number;
  totalWinsStandard: number;
  totalLossesStandard: number;
  totalDrawsStandard: number;
  isPlacementCompleteStandard: boolean;
  placementMatchesDoneStandard: number;
  updatedAt: string;
}

export interface AdjustPlayerEloRequest {
  puzzleTypeId?: string;
  eloDelta: number;
  reason?: string;
}

export interface AdjustPlayerEloResponseDto {
  userId: string;
  username: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  reason: string;
  adjustedAt: string;
}

/** GET /api/admin/elo/config */
export async function getEloConfig(): Promise<EloConfigDto> {
  return apiFetch<EloConfigDto>('/api/admin/elo/config');
}

/** PUT /api/admin/elo/config */
export async function updateEloConfig(payload: UpdateEloConfigRequest): Promise<EloConfigDto> {
  return apiFetch<EloConfigDto>('/api/admin/elo/config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** GET /api/admin/elo/players */
export async function getAdminPlayerEloList(search?: string): Promise<AdminPlayerEloDto[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<AdminPlayerEloDto[]>(`/api/admin/elo/players${query}`);
}

/** POST /api/admin/elo/players/{userId}/adjust */
export async function adjustPlayerElo(
  userId: string,
  payload: AdjustPlayerEloRequest,
): Promise<AdjustPlayerEloResponseDto> {
  return apiFetch<AdjustPlayerEloResponseDto>(`/api/admin/elo/players/${userId}/adjust`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
