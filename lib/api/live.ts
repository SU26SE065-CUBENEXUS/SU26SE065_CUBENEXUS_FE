// ============================================================
// CubeNexus API — Public Live Board endpoints
// ============================================================

import { apiFetch } from './config';
import type { MedleyPuzzleDetailDto } from './types';

export interface PublicLiveTournamentDto {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  status: string;
  eventsCount: number;
  isLive: boolean;
}

export interface PublicLiveEventDto {
  id: string;
  puzzleTypeId: string;
  puzzleTypeName: string;
  puzzleTypeCode: string;
  eventFormatCode: string;
  solveCount: number;
  sortOrder?: number;
  timeLimitMs?: number | null;
  cutoffTimeMs?: number | null;
  currentRoundNumber?: number | null;
  roundStatus?: string | null; // 'ONGOING' | 'COMPLETED' | 'LOCKED' | 'PENDING' | null
  medleyPuzzles: MedleyPuzzleDetailDto[];
}

export interface PublicLiveTournamentDetailDto {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  status: string;
  isLive: boolean;
  events: PublicLiveEventDto[];
  activeEventId?: string | null;
  activeRoundNumber?: number | null;
}

/** GET /api/public/live/tournaments — Danh sách giải đấu offline */
export async function getPublicLiveTournaments(): Promise<PublicLiveTournamentDto[]> {
  return apiFetch<PublicLiveTournamentDto[]>('/api/public/live/tournaments');
}

/** GET /api/public/live/tournaments/{id} — Chi tiết live board của giải đấu */
export async function getPublicLiveTournamentDetail(tournamentId: string): Promise<PublicLiveTournamentDetailDto> {
  return apiFetch<PublicLiveTournamentDetailDto>(`/api/public/live/tournaments/${tournamentId}`);
}
