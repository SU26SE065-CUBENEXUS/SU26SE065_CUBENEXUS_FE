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
  maxParticipants?: number;
  currentParticipants?: number;  // 0 when not populated (e.g. manager mock data)
  bannerUrl?: string;
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
  registrationStatusCode?: string;
  timeLimitMs?: number;
  cutoffTimeMs?: number;
  solveCount: number;
  sortOrder?: number;
  maxCapacity?: number;
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
  maxParticipants?: number;
  bannerUrl?: string;
  bannerPhotoData?: string;
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

export interface TournamentRegistrationDetailDto {
  registrationId: string;
  tournamentId: string;
  tournamentName: string;
  userId: string;
  competitorName: string;
  email: string;
  competitorUserCode: string;
  competitorAvatarUrl?: string;
  statusCode: string;
  registeredAt: string;
  checkedInAt?: string;
  qrToken: string;
  registeredEvents: RegisteredEventDetailDto[];
}

export interface UpdateRegistrationStatusDto {
  status: string;
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
  groupCompetitorId: string;
  solveNumber: number;
  rawTimeMs?: number;
  penaltyTypeId?: string | null;
  scrambleId: string;
  esignatureData?: string | null;
  evidencePhotoData?: string | null;
}

export interface SubmitMedleyResultDto {
  groupCompetitorId: string;
  solveNumber: number;
  esignatureData?: string | null;
  evidencePhotoData?: string | null;
  details: MedleyDetailSubmissionDto[];
}

export interface MedleyDetailSubmissionDto {
  medleyPuzzleId: string;
  rawTimeMs?: number;
  penaltyTypeId?: string | null;
  scrambleId: string;
}

export interface ScrambleInfoDto {
  scrambleId: string;
  solveNumber: number;
  sequence: string;
}

export interface SubmitProgressDto {
  submittedCount: number;
  solveCount: number;
  nextSolveNumber?: number | null;
  canSubmitNext: boolean;
}

export interface SubmitResultResponseDto {
  resultId: string;
  finalTimeMs?: number | null;
  isDnf: boolean;
  submittedSolveNumber?: number | null;
  progress?: SubmitProgressDto | null;
  nextScramble?: ScrambleInfoDto | null;
}

export interface SolveProgressDto {
  groupCompetitorId: string;
  eventId?: string | null;
  eventName: string;
  roundNumber?: number | null;
  groupId?: string | null;
  groupName: string;
  stationNumber?: number | null;
  solveCount: number;
  submittedSolveNumbers: number[];
  submittedCount: number;
  nextSolveNumber?: number | null;
  canSubmit: boolean;
  reason?: string | null;
  currentScramble?: ScrambleInfoDto | null;
}

export interface VerifyJudgeStationByStationDto {
  qrToken: string;
  eventId: string;
  roundNumber: number;
  stationNumber: number;
}

export interface VerifyJudgeStationResponseDto {
  success: boolean;
  message: string;
  groupCompetitorId?: string | null;
  eventId?: string | null;
  eventName: string;
  roundNumber?: number | null;
  groupId?: string | null;
  groupName: string;
  stationNumber?: number | null;
  nextSolveNumber?: number | null;
  solveCount?: number | null;
  canSubmit: boolean;
  currentScramble?: ScrambleInfoDto | null;
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

export interface CompetitorQrTicketDto {
  registrationId: string;
  qrToken: string;
  checkedInAt?: string | null;
  statusCode: string;
}

export interface SimStationCompetitorDto {
  groupCompetitorId: string;
  competitorName: string;
  userCode: string;
  groupName: string;
  groupStatus: string;
  stationNumber: number;
  qrToken: string;
  competitorStatus: string;
}

// ---------- Tournament Judges ----------

export interface TournamentJudgeDto {
  id: string;
  userId: string;
  tournamentId: string;
  displayName: string;
  username: string;
  email: string;
  userCode: string;
  roleCode?: string;
  assignedStationNumber?: number | null;
  assignedAt: string;
  rawPassword?: string | null;
}

export interface CreateTournamentJudgeDto {
  displayName: string;
  username?: string;
  password?: string;
  roleCode?: string;
  assignedStationNumber?: number | null;
}

export interface BatchCreateTournamentJudgeDto {
  checkInCount?: number;
  stationCount?: number;
  judgesPerStation?: number;
  count?: number;
  namePrefix?: string;
  customNames?: string[];
}

export interface UpdateTournamentJudgeDto {
  displayName: string;
  roleCode?: string;
  assignedStationNumber?: number | null;
}

export interface ResetJudgePasswordDto {
  newPassword?: string;
}

export interface ShuffleTournamentJudgesDto {
  checkInCount: number;
  stationCount: number;
  judgesPerStation: number;
}


