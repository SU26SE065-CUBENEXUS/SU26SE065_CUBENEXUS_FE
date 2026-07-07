import { apiFetch, getAccessToken, API_BASE_URL } from '@/lib/api/config';
import type {
  MatchmakingStatusDto,
  OnlineMatchRecoveryStateDto,
  ScannerStartResponseDto,
  SubmitSolveTimeRequest,
  SubmitSolveTimeResponseDto,
} from '../types';

/** POST /api/online/matchmaking/find — Bắt đầu tìm trận đấu */
export async function findMatch(puzzleTypeId: string): Promise<MatchmakingStatusDto> {
  return apiFetch<MatchmakingStatusDto>('/api/online/matchmaking/find', {
    method: 'POST',
    body: JSON.stringify({ puzzleTypeId }),
  });
}

/** POST /api/online/matchmaking/confirm/{confirmationId} — Xác nhận ghép trận */
export async function confirmMatch(confirmationId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matchmaking/confirm/${confirmationId}`, {
    method: 'POST',
  });
}

/** DELETE /api/online/matchmaking — Hủy tìm trận đấu */
export async function cancelMatchmaking(puzzleTypeId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matchmaking?puzzleTypeId=${puzzleTypeId}`, {
    method: 'DELETE',
  });
}

/** GET /api/online/matches/{matchId}/state — Lấy trạng thái phục hồi trận đấu */
export async function getMatchState(matchId: string): Promise<OnlineMatchRecoveryStateDto> {
  return apiFetch<OnlineMatchRecoveryStateDto>(`/api/online/matches/${matchId}/state`);
}

/** POST /api/online/matches/{matchId}/camera-ready — Báo camera đã sẵn sàng */
export async function markCameraReady(matchId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/camera-ready`, {
    method: 'POST',
  });
}

/** POST /api/online/matches/{matchId}/webrtc-connected — Báo WebRTC đã kết nối */
export async function markWebRtcConnected(matchId: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/webrtc-connected`, {
    method: 'POST',
    body: JSON.stringify({ connectionState: 'connected', iceConnectionState: 'connected' }),
  });
}

/** POST /api/online/matches/{matchId}/video-recording-started — Báo bắt đầu ghi hình (chỉ trong COUNTDOWN) */
export async function markVideoRecordingStarted(matchId: string, mimeType?: string): Promise<any> {
  return apiFetch<any>(`/api/online/matches/${matchId}/video-recording-started`, {
    method: 'POST',
    body: JSON.stringify({
      recordingStartedAt: new Date().toISOString(),
      mimeType: mimeType ?? 'video/webm',
    }),
  });
}


/** POST /api/online/matches/{matchId}/scanner/{validationType}/start — Khởi tạo phiên quét AI */
export async function startScanner(
  matchId: string,
  validationType: string
): Promise<ScannerStartResponseDto> {
  return apiFetch<ScannerStartResponseDto>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/start`,
    { method: 'POST' }
  );
}

/** POST /api/online/matches/{matchId}/scanner/{validationType}/observe — Quét frame camera bằng AI (Multipart Form) */
export async function observeScannerFrame(
  matchId: string,
  validationType: string,
  formData: FormData
): Promise<any> {
  const token = getAccessToken();
  const path = `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/observe`;
  
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = (errorBody as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

/** POST /api/online/matches/{matchId}/scanner/{validationType}/retry-face — Quét lại mặt hiện tại */
export async function retryScannerFace(matchId: string, validationType: string): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/retry-face`,
    { method: 'POST' }
  );
}

/** POST /api/online/matches/{matchId}/scanner/{validationType}/reset — Đặt lại toàn bộ phiên quét */
export async function resetScanner(matchId: string, validationType: string): Promise<any> {
  return apiFetch<any>(
    `/api/online/matches/${matchId}/scanner/${validationType.toUpperCase()}/reset`,
    { method: 'POST' }
  );
}

/** POST /api/online/mobile-timer/submit-time — Giả lập nộp thời gian cho mobile timer (chỉ dùng cho Dev/Admin) */
export async function submitMobileTimerTime(payload: SubmitSolveTimeRequest): Promise<SubmitSolveTimeResponseDto> {
  return apiFetch<SubmitSolveTimeResponseDto>('/api/online/mobile-timer/submit-time', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /api/online/profiles/me — Lấy danh sách ELO/profile của tôi */
export async function getMyProfiles(): Promise<any[]> {
  return apiFetch<any[]>('/api/online/profiles/me');
}

/** POST /api/online/profiles/init — Khởi tạo profile của tôi */
export async function initProfile(puzzleTypeId: string): Promise<any> {
  return apiFetch<any>('/api/online/profiles/init', {
    method: 'POST',
    body: JSON.stringify({ puzzleTypeId }),
  });
}

