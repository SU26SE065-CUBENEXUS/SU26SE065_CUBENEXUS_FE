// ============================================================
// CubeNexus API — Practice Methods
// ============================================================

import { apiFetch } from './config';
import type {
  StartPracticeSessionDto,
  PracticeSessionResponseDto,
  PracticeAttemptResponseDto,
  PracticeSessionSummaryDto,
  FinalizeAttemptDto,
  AbortAttemptDto,
} from './types';

/** POST /api/practice/sessions - Bắt đầu một session mới */
export async function startPracticeSession(
  dto: StartPracticeSessionDto
): Promise<PracticeSessionResponseDto> {
  return apiFetch<PracticeSessionResponseDto>('/api/practice/sessions', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** POST /api/practice/sessions/{sessionId}/attempts - Tạo lượt giải mới */
export async function createPracticeAttempt(
  sessionId: string
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/sessions/${sessionId}/attempts`,
    {
      method: 'POST',
    }
  );
}

/** GET /api/practice/sessions/{sessionId}/current-attempt - Lấy lượt giải hiện tại */
export async function getCurrentPracticeAttempt(
  sessionId: string
): Promise<PracticeAttemptResponseDto | null> {
  try {
    const data = await apiFetch<PracticeAttemptResponseDto | null>(
      `/api/practice/sessions/${sessionId}/current-attempt`
    );
    // If response is empty object, return null
    if (data && !data.id) return null;
    return data;
  } catch (error) {
    return null;
  }
}

/** GET /api/practice/attempts/{attemptId} - Xem chi tiết lượt giải */
export async function getPracticeAttempt(
  attemptId: string
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/attempts/${attemptId}`
  );
}

/** POST /api/practice/attempts/{attemptId}/hands-on - Trạng thái chạm tay vào timer */
export async function handsOnPracticeAttempt(
  attemptId: string
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/attempts/${attemptId}/hands-on`,
    {
      method: 'POST',
    }
  );
}

/** POST /api/practice/attempts/{attemptId}/ready - Trạng thái sẵn sàng */
export async function readyPracticeAttempt(
  attemptId: string
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/attempts/${attemptId}/ready`,
    {
      method: 'POST',
    }
  );
}

/** POST /api/practice/attempts/{attemptId}/hands-off - Thả tay bắt đầu giải */
export async function handsOffPracticeAttempt(
  attemptId: string
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/attempts/${attemptId}/hands-off`,
    {
      method: 'POST',
    }
  );
}

/** POST /api/practice/attempts/{attemptId}/finalize - Hoàn thành lượt giải với thông tin thời gian, penalty */
export async function finalizePracticeAttempt(
  attemptId: string,
  dto: FinalizeAttemptDto
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/attempts/${attemptId}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
}

/** POST /api/practice/attempts/{attemptId}/abort - Hủy/bỏ qua lượt giải */
export async function abortPracticeAttempt(
  attemptId: string,
  dto: AbortAttemptDto = {}
): Promise<PracticeAttemptResponseDto> {
  return apiFetch<PracticeAttemptResponseDto>(
    `/api/practice/attempts/${attemptId}/abort`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
}

/** POST /api/practice/sessions/{sessionId}/end - Kết thúc session */
export async function endPracticeSession(
  sessionId: string
): Promise<PracticeSessionSummaryDto> {
  return apiFetch<PracticeSessionSummaryDto>(
    `/api/practice/sessions/${sessionId}/end`,
    {
      method: 'POST',
    }
  );
}

/** GET /api/practice/sessions - Lấy danh sách session của tôi */
export async function getMyPracticeSessions(
  puzzleTypeId?: string,
  page = 1,
  pageSize = 20
): Promise<PracticeSessionResponseDto[]> {
  let query = `?page=${page}&pageSize=${pageSize}`;
  if (puzzleTypeId) {
    query += `&puzzleTypeId=${puzzleTypeId}`;
  }
  return apiFetch<PracticeSessionResponseDto[]>(`/api/practice/sessions${query}`);
}

/** GET /api/practice/sessions/{sessionId} - Lấy chi tiết session */
export async function getPracticeSessionDetail(
  sessionId: string
): Promise<PracticeSessionSummaryDto> {
  return apiFetch<PracticeSessionSummaryDto>(
    `/api/practice/sessions/${sessionId}`
  );
}
