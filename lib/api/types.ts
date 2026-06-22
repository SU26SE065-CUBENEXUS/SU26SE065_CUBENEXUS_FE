// ============================================================
// CubeNexus API — TypeScript Types (matching BE DTOs on branch hieu)
// ============================================================

// ---------- Auth ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  displayName: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  displayName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  devOtp?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface MessageResponse {
  message: string;
}

// ---------- Decoded JWT User ----------

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'MANAGER' | 'ADMIN' | 'COMPETITOR' | 'JUDGE' | string;
}

// ---------- Tournament ----------

/** Status codes từ BE database */
export type TournamentStatusCode =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface TournamentDetailDto {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  statusCode: TournamentStatusCode;
  createdBy: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt: string;
  events: EventDetailDto[];
}

export interface EventDetailDto {
  id: string;
  puzzleTypeId: string;
  puzzleTypeName: string;
  puzzleTypeCode: string;
  eventFormatCode: string; // 'TRADITIONAL' | 'MEDLEY'
  timeLimitMs?: number;
  cutoffTimeMs?: number;
  solveCount: number;
  sortOrder?: number;
  medleyPuzzles: MedleyPuzzleDetailDto[];
}

export interface MedleyPuzzleDetailDto {
  id: string;
  puzzleTypeId: string;
  puzzleTypeName: string;
  puzzleTypeCode: string;
  sortOrder: number;
}

// ---------- Create Tournament ----------

export interface CreateMedleyPuzzleDto {
  puzzleTypeId: string;
  sortOrder: number;
}

export interface CreateEventDto {
  puzzleTypeId: string;
  eventFormatCode: string;
  timeLimitMs?: number;
  cutoffTimeMs?: number;
  solveCount?: number;
  sortOrder?: number;
  medleyPuzzles?: CreateMedleyPuzzleDto[];
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  events: CreateEventDto[];
}

// ---------- Registration ----------

export type RegistrationStatusCode =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_in';

export interface RegistrationResultDto {
  registrationId: string;
  tournamentId: string;
  tournamentName: string;
  userId: string;
  statusCode: RegistrationStatusCode;
  registeredAt: string;
  qrToken: string;
  registeredEvents: RegisteredEventDetailDto[];
}

export interface RegisteredEventDetailDto {
  registrationEventId: string;
  eventId: string;
  puzzleTypeName: string;
  eventFormatCode: string;
  statusCode: string;
  seedTimeMs?: number;
  seedSourceCode?: string;
  seedGeneratedAt?: string;
}

// ---------- Event Competitor (for seeding) ----------

export interface EventCompetitorDto {
  registrationEventId: string;
  userId: string;
  displayName: string;
  email?: string;
  seedTimeMs?: number;
  seedSourceCode?: string;
}

// ---------- Override Seed ----------

export interface OverrideSeedDto {
  seedTimeMs: number;
}

// ---------- Groups ----------

export interface GenerateGroupsDto {
  roundNumber: number;
  competitorsPerGroup: number;
  stationCount: number;
}

export interface GenerateScramblesDto {
  roundNumber: number;
}

// ---------- Operations ----------

export interface CheckInRequestDto {
  qrToken: string;
}

export interface CheckInResponseDto {
  registrationId: string;
  displayName: string;
  tournamentName: string;
  success: boolean;
  message: string;
}

export interface StartRoundRequestDto {
  groupIds?: string[];
}

export interface AdvanceRoundRequestDto {
  nextRoundNumber: number;
  topN: number;
  competitorsPerGroup: number;
  stationCount: number;
}

export interface SubmitTraditionalResultDto {
  registrationEventId: string;
  roundNumber: number;
  attemptNumber: number;
  timeMs: number;
  penalty?: string; // 'none' | 'plus2' | 'dnf'
}

export interface SubmitMedleyResultDto {
  registrationEventId: string;
  roundNumber: number;
  results: MedleyAttemptDto[];
}

export interface MedleyAttemptDto {
  puzzleTypeId: string;
  timeMs: number;
  penalty?: string;
}

export interface ResultCorrectionDto {
  rawTimeMs?: number;
  penaltyTypeId?: string;
  reason: string;
}

export interface PuzzleTypeResponseDto {
  id: string;
  name: string;
  code: string;
  scrambleLength?: number;
  isActive: boolean;
  createdAt: string;
}
