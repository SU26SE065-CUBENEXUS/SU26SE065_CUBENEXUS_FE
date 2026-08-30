const WINDOW_PADDING_SEC = 15;

export function computeAiScanWindow(
  timestampSec: number,
  paddingSec = WINDOW_PADDING_SEC,
  maxDurationSec?: number | null
) {
  const scanStart = Math.max(0, timestampSec - paddingSec);
  const scanEnd =
    maxDurationSec != null && Number.isFinite(maxDurationSec) && maxDurationSec > 0
      ? Math.min(maxDurationSec, timestampSec + paddingSec)
      : timestampSec + paddingSec;

  return {
    scanStart,
    scanEnd,
    scanDurationSec: Math.max(0, scanEnd - scanStart),
    paddingSec,
  };
}
