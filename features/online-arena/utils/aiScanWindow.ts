const WINDOW_PADDING_SEC = 15;

/**
 * ±padding window around a report timestamp.
 *
 * Important: do not clamp only the end to a short `maxDurationSec` while leaving
 * start at (timestamp - padding). That produces inverted labels like
 * "01:07 - 00:42" when report time (82s) exceeds stored duration (~42s).
 *
 * If duration is known and the center is inside the video → clamp both ends.
 * If timestamp is beyond stored duration (or duration unknown) → keep the ideal
 * ±window for display; the AI service should measure real file length itself.
 */
export function computeAiScanWindow(
  timestampSec: number,
  paddingSec = WINDOW_PADDING_SEC,
  maxDurationSec?: number | null
) {
  const center = Math.max(0, Number(timestampSec) || 0);
  const pad = Math.max(0, Number(paddingSec) || 0);
  const hasDuration =
    maxDurationSec != null && Number.isFinite(maxDurationSec) && maxDurationSec > 0;

  // Ideal ± window (what admin expects around report time 1:22 → 01:07–01:37)
  const idealStart = Math.max(0, center - pad);
  const idealEnd = center + pad;

  if (!hasDuration) {
    return {
      scanStart: idealStart,
      scanEnd: idealEnd,
      scanDurationSec: Math.max(0, idealEnd - idealStart),
      paddingSec: pad,
      usedIdealWindow: true,
    };
  }

  const duration = maxDurationSec as number;

  // Metadata shorter than report clock → do not create an inverted window.
  if (center >= duration) {
    return {
      scanStart: idealStart,
      scanEnd: idealEnd,
      scanDurationSec: Math.max(0, idealEnd - idealStart),
      paddingSec: pad,
      usedIdealWindow: true,
    };
  }

  const scanStart = Math.max(0, center - pad);
  const scanEnd = Math.min(duration, center + pad);

  return {
    scanStart,
    scanEnd,
    scanDurationSec: Math.max(0, scanEnd - scanStart),
    paddingSec: pad,
    usedIdealWindow: false,
  };
}
