import { apiFetch } from './config';

export interface CreateOnlineAsyncTournamentRequest {
  name: string;
  description?: string;
  puzzleTypeId: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  startDate: string;
  endDate: string;
  attemptTimeLimitMs?: number;
}

export interface OnlineAsyncTournamentDto {
  id: string;
  name: string;
  description?: string;
  tournamentType: string;
  formatCode: string;
  puzzleTypeId?: string;
  puzzleTypeName?: string;
  scrambleSequence?: string;
  attemptTimeLimitMs: number;
  registrationOpenAt: string;
  registrationCloseAt: string;
  startDate: string;
  endDate: string;
  statusCode: string;
  createdBy: string;
  createdAt: string;
  isRegistered: boolean;
  userAttemptStatus?: string;
  userAttemptId?: string;
}

export interface StartOnlineAsyncAttemptResponse {
  attemptId: string;
  tournamentId: string;
  scrambleSequence: string;
  startedAt: string;
  timeLimitMs: number;
  status: string;
}

export interface VerifyAsyncScrambleResponse {
  attemptId: string;
  passed: boolean;
  status: string;
  reason: string;
  attemptDeadlineAt?: string;
  handTimerStartedAt?: string;
}

export interface AsyncScannerFace {
  centerColor: string;
  grid3x3: string[][];
}

type AsyncScannerSession = { sessionId: string; requestedFaceIndex: number };
type AsyncScannerObservation = AsyncScannerSession & { scannerState: string; centerColor?: string; grid3x3?: string[][]; reason?: string };

export function startAsyncScannerSession(): Promise<AsyncScannerSession> {
  return apiFetch<AsyncScannerSession>('/api/dev/ai/scanner-test/sessions', { method: 'POST' });
}

export async function observeAsyncScannerFace(args: { sessionId: string; snapshot: Blob; scanGeneration: number; targetFaceIndex: number }): Promise<AsyncScannerObservation> {
  const form = new FormData();
  form.append('snapshot', args.snapshot, 'cube-face.jpg');
  form.append('scanSessionId', args.sessionId);
  form.append('scanGeneration', String(args.scanGeneration));
  form.append('requestId', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  form.append('targetFaceIndex', String(args.targetFaceIndex));
  return apiFetch<AsyncScannerObservation>(`/api/dev/ai/scanner-test/sessions/${args.sessionId}/observe`, { method: 'POST', body: form });
}

export interface StartAsyncSolveTimerResponse {
  attemptId: string;
  status: string;
  solveStartedAt: string;
  handTimerMs: number;
  penaltyCode: string; // NONE | PLUS2 | DNF
  penaltyTimeMs: number;
  isDnf: boolean;
  message: string;
}

export interface FinishAsyncSolveTimerResponse {
  attemptId: string;
  rawTimeMs: number;
  penaltyTimeMs: number;
  penaltyCode: string;
  isDnf: boolean;
  finalTimeMs?: number;
  status: string;
  reviewStatus: string;
  displayResult: string;
}

export interface OnlineAsyncAttemptStateDto extends FinishAsyncSolveTimerResponse {
  tournamentId: string;
  attemptStatus: 'INITIALIZED' | 'SCRAMBLE_VERIFIED' | 'SOLVING' | 'FINISH_PENDING' | 'COMPLETED';
  scrambleCheckStatus: string;
  finishCheckStatus: string;
  attemptDeadlineAt?: string;
  handTimerStartedAt?: string;
  solveStartedAt?: string;
  scrambleSequence: string;
}

export interface ReviewAsyncAttemptRequest {
  attemptId: string;
  reviewStatus: 'APPROVED' | 'REJECTED';
  penaltyCode?: 'NONE' | 'PLUS2' | 'DNF';
  reviewNote?: string;
}

export interface AsyncLeaderboardEntryDto {
  rank: number;
  attemptId: string;
  userId: string;
  userFullName: string;
  userAvatarUrl?: string;
  rawTimeMs?: number;
  penaltyTimeMs: number;
  penaltyCode: string;
  isDnf: boolean;
  finalTimeMs?: number;
  displayResult: string;
  reviewStatus: string;
  videoEvidenceUrl?: string;
  solveFinishedAt: string;
}

export async function createOnlineAsyncTournament(dto: CreateOnlineAsyncTournamentRequest): Promise<OnlineAsyncTournamentDto> {
  return apiFetch<OnlineAsyncTournamentDto>('/api/tournaments/online-async', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function listOnlineAsyncTournaments(status?: string): Promise<OnlineAsyncTournamentDto[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<OnlineAsyncTournamentDto[]>(`/api/tournaments/online-async${query}`);
}

export async function getOnlineAsyncTournamentById(id: string): Promise<OnlineAsyncTournamentDto> {
  return apiFetch<OnlineAsyncTournamentDto>(`/api/tournaments/online-async/${id}`);
}

export async function registerOnlineAsyncTournament(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/tournaments/online-async/${id}/register`, {
    method: 'POST',
  });
}

export async function startOnlineAsyncAttempt(id: string): Promise<StartOnlineAsyncAttemptResponse> {
  return apiFetch<StartOnlineAsyncAttemptResponse>(`/api/tournaments/online-async/${id}/attempts/start`, {
    method: 'POST',
  });
}

export async function getOnlineAsyncAttemptState(attemptId: string): Promise<OnlineAsyncAttemptStateDto> {
  return apiFetch<OnlineAsyncAttemptStateDto>(`/api/tournaments/online-async/attempts/${attemptId}`);
}

export async function verifyAsyncScramble(attemptId: string, faces?: AsyncScannerFace[], imageBase64?: string): Promise<VerifyAsyncScrambleResponse> {
  return apiFetch<VerifyAsyncScrambleResponse>(`/api/tournaments/online-async/attempts/${attemptId}/verify-scramble`, {
    method: 'POST',
    body: JSON.stringify({ attemptId, faces: faces?.map((face) => ({ face: face.centerColor, grid: face.grid3x3 })), imageBase64 }),
  });
}

export async function startAsyncSolveTimer(attemptId: string, handTimerMs: number): Promise<StartAsyncSolveTimerResponse> {
  return apiFetch<StartAsyncSolveTimerResponse>(`/api/tournaments/online-async/attempts/${attemptId}/start-solve`, {
    method: 'POST',
    body: JSON.stringify({ attemptId, handTimerMs }),
  });
}

export async function finishAsyncSolveTimer(attemptId: string, rawTimeMs: number): Promise<FinishAsyncSolveTimerResponse> {
  return apiFetch<FinishAsyncSolveTimerResponse>(`/api/tournaments/online-async/attempts/${attemptId}/finish-solve`, {
    method: 'POST',
    body: JSON.stringify({ attemptId, rawTimeMs }),
  });
}

export async function verifyAsyncFinish(attemptId: string, imageBase64: string, faces?: AsyncScannerFace[]): Promise<FinishAsyncSolveTimerResponse> {
  return apiFetch<FinishAsyncSolveTimerResponse>(`/api/tournaments/online-async/attempts/${attemptId}/verify-finish`, {
    method: 'POST',
    body: JSON.stringify({ attemptId, imageBase64, faces: faces?.map((face) => ({ face: face.centerColor, grid: face.grid3x3 })) }),
  });
}

export async function uploadAsyncAttemptVideo(attemptId: string, video: Blob): Promise<{ attemptId: string; objectKey: string }> {
  const contentType = video.type.includes('mp4') ? 'video/mp4' : 'video/webm';
  const extension = contentType === 'video/mp4' ? 'mp4' : 'webm';

  // Match the proven online-match flow: upload directly to R2 with a presigned
  // URL, then let the backend verify metadata and finalize the evidence.
  let directUploadError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const ticket = await apiFetch<{ uploadUrl: string; objectKey: string; contentType: string }>(
        `/api/tournaments/online-async/attempts/${attemptId}/video/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({ contentType, fileExtension: extension }),
        },
      );
      const uploadResponse = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': ticket.contentType },
        body: video,
      });
      if (!uploadResponse.ok) {
        throw new Error(`R2 upload failed with HTTP ${uploadResponse.status}.`);
      }
      return apiFetch<{ attemptId: string; objectKey: string }>(
        `/api/tournaments/online-async/attempts/${attemptId}/video/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ objectKey: ticket.objectKey }),
        },
      );
    } catch (error) {
      directUploadError = error;
      if (attempt < 3) {
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 750));
      }
    }
  }
  console.warn('[AsyncAttemptRecording] Presigned upload failed after 3 attempts; falling back to backend proxy.', directUploadError);

  const form = new FormData();
  form.append('video', video, `attempt-${attemptId}.${extension}`);
  return apiFetch<{ attemptId: string; objectKey: string }>(`/api/tournaments/online-async/attempts/${attemptId}/video`, {
    method: 'POST',
    body: form,
  });
}

export async function getAttemptsForReview(tournamentId: string): Promise<AsyncLeaderboardEntryDto[]> {
  return apiFetch<AsyncLeaderboardEntryDto[]>(`/api/tournaments/online-async/${tournamentId}/reviews`);
}

export async function reviewAttempt(attemptId: string, dto: ReviewAsyncAttemptRequest): Promise<AsyncLeaderboardEntryDto> {
  return apiFetch<AsyncLeaderboardEntryDto>(`/api/tournaments/online-async/attempts/${attemptId}/review`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function getAsyncAttemptVideoPlayback(attemptId: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(`/api/tournaments/online-async/attempts/${attemptId}/video-playback`);
}

export async function getAsyncLeaderboard(tournamentId: string): Promise<AsyncLeaderboardEntryDto[]> {
  return apiFetch<AsyncLeaderboardEntryDto[]>(`/api/tournaments/online-async/${tournamentId}/leaderboard`);
}
