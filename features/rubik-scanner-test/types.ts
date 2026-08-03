export const RUBIK_COLORS = ['white', 'yellow', 'red', 'orange', 'blue', 'green'] as const;
export type RubikColor = (typeof RUBIK_COLORS)[number];

export type AiRubikHealthResponse = {
  status: string;
  serviceName: string;
  modelPath: string;
  modelExists: boolean;
  modelVersion: string;
  modelLoaded: boolean;
};

export type AiRubikScannerSticker = {
  color: string;
  confidence: number;
  bbox: [number, number, number, number];
};

export type AiRubikScannerFace = {
  centerColor: string;
  grid3x3: string[][];
  stickers: AiRubikScannerSticker[];
  overallConfidence: number;
  validFrames: number;
  capturedAt: string;
};

export type AiRubikScannerPreviewResponse = {
  status: string;
  scannerState: 'POSITION_FACE' | 'SCANNING' | 'STABLE' | 'ACCEPTED' | 'DUPLICATE_FACE' | 'RETRY' | 'AI_BUSY' | 'AI_UNAVAILABLE' | 'CAMERA_ERROR';
  scanSessionId: string;
  scanGeneration: number;
  requestId?: string | null;
  targetFaceIndex: number;
  requestedFaceIndex: number;
  requestedFaceLabel: string;
  centerColor?: string | null;
  grid3x3?: string[][] | null;
  stickers: AiRubikScannerSticker[];
  detectedStickers: number;
  confidence: number;
  inferMs: number;
  decodeMs: number;
  preprocessMs: number;
  postprocessMs: number;
  totalMs: number;
  stableObservationCount: number;
  requiredStableObservations: number;
  modelVersion: string;
  reason?: string | null;
};

export type AiRubikScannerSessionResponse = {
  sessionId: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  scannerState: 'POSITION_FACE' | 'SCANNING' | 'STABLE' | 'ACCEPTED' | 'DUPLICATE_FACE' | 'RETRY' | 'AI_BUSY' | 'AI_UNAVAILABLE' | 'CAMERA_ERROR';
  message: string;
  scanGeneration: number;
  requestedFaceIndex: number;
  requestedFaceLabel: string;
  capturedFaceCount: number;
  rawStickerCount: number;
  orientationResolved: boolean;
  modelVersion: string;
  startedAt: string;
  completedAt?: string | null;
  faces: AiRubikScannerFace[];
  rawStickerState: string[];
  lastFaceScan?: AiRubikScannerFace | null;
  lastScanStatus?: string | null;
  lastScanReason?: string | null;
};
