export type MatchPhase =
  | 'ROOM_SETUP'
  | 'WEBRTC_CONNECTING'
  | 'MOBILE_TIMER_PAIRING'
  | 'SCRAMBLE_CHECKING'
  | 'COUNTDOWN'
  | 'INSPECTION'
  | 'SOLVING'
  | 'FINISH_CHECKING'
  | 'PENDING_EVIDENCE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NEEDS_REVIEW';

export type OnlineMatchStatus =
  | 'CREATED'
  | 'READY'
  | 'ONGOING'
  | 'PENDING_EVIDENCE'
  | 'NEEDS_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DRAW';

export type PlayerResultStatus = 'PENDING' | 'VALID' | 'DNF';

export type FinishCheckStatus = 'NOT_STARTED' | 'SCANNING' | 'PASSED' | 'FAILED' | 'NOT_REQUIRED';

export type ScrambleCheckStatus = 'PENDING' | 'PASSED' | 'FAILED';

export type NextUiState =
  | 'SETUP'
  | 'SCRAMBLE_CHECK'
  | 'COUNTDOWN'
  | 'INSPECTION'
  | 'SOLVING'
  | 'FINISH_SCANNING'
  | 'WAITING_OPPONENT'
  | 'NEEDS_REVIEW'
  | 'COMPLETED';

export interface RecoveryPlayerStateDto {
  userId: string;
  /** Display name of this player */
  displayName?: string;
  resultStatus: PlayerResultStatus;
  timeMs: number | null;
  finishCheckStatus: FinishCheckStatus;
  isReady: boolean;
  /** All ROOM_SETUP checklist items complete. Auto-set by backend — no manual ready button. */
  checklistPassed: boolean;
  scrambleCheckStatus: ScrambleCheckStatus;
  cameraReady: boolean;
  webRtcConnected: boolean;
  recordingStarted: boolean;
  timerReady: boolean;
}

export interface RecoveryMeStateDto {
  userId: string;
  canSubmitTime: boolean;
  canStartFinishCheck: boolean;
  canWatchOpponent: boolean;
  nextUiState: NextUiState;
}

export interface OnlineMatchRecoveryStateDto {
  matchId: string;
  statusCode: OnlineMatchStatus;
  phase: MatchPhase;
  qrSessionCode: string | null;
  setupDeadlineAt: string | null;
  countdownEndsAt: string | null;
  scrambleSequence: string | null;
  inspectionDeadlineAt: string | null;
  solveDeadlineAt: string | null;
  outcome: string | null;
  cancelReason?: string | null;
  winnerId: string | null;
  player1EloBefore: number | null;
  player2EloBefore: number | null;
  player1EloAfter: number | null;
  player2EloAfter: number | null;
  serverNow: string;
  player1: RecoveryPlayerStateDto;
  player2: RecoveryPlayerStateDto;
  me: RecoveryMeStateDto;
}

export interface SubmitSolveTimeRequest {
  matchId: string;
  mobileTimerSessionId: string;
  deviceSessionToken: string;
  timeMs: number;
  isDnf: boolean;
  stoppedAt: string;
}

export interface SubmitSolveTimeResponseDto {
  matchId: string;
  meUserId: string;
  myResultStatus: PlayerResultStatus;
  myTimeMs: number | null;
  myFinishCheckStatus: FinishCheckStatus;
  opponentResultStatus: PlayerResultStatus;
  opponentFinishCheckStatus: FinishCheckStatus;
  canStartFinishCheck: boolean;
  matchPhase: MatchPhase;
  serverNow: string;
}

export interface ScannerStartResponseDto {
  scanSessionId: string;
  aiSessionId: string | null;
  scanGeneration: number;
  requestedFaceIndex: number;
  scanStatus: string;
  finishCheckStatus: FinishCheckStatus;
  serverNow: string;
}

export interface ObserveFinishFrameResponseDto {
  matchId: string;
  meUserId: string;
  finishCheckStatus: FinishCheckStatus;
  waitingForOpponent: boolean;
  opponentResultStatus: PlayerResultStatus;
  opponentFinishCheckStatus: FinishCheckStatus;
  nextUiState: NextUiState;
  serverNow: string;
  matchStatus?: OnlineMatchStatus;
  outcome?: string;
  winnerId?: string | null;
}

export interface OpponentDto {
  userId: string;
  displayName: string;
  rating: number;
}

export interface MatchmakingStatusDto {
  status: 'IDLE' | 'QUEUED' | 'MATCH_FOUND' | 'MATCH_CONFIRMING' | 'MATCHED' | 'COOLDOWN' | 'IN_ACTIVE_MATCH';
  confirmationId?: string;
  opponent?: OpponentDto;
  confirmDeadlineAt?: string;
  player1Confirmed?: boolean;
  player2Confirmed?: boolean;
  remainingSeconds?: number;
  serverNow?: string;
  matchId?: string;
}
