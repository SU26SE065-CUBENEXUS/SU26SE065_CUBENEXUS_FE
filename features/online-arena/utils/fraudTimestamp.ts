import type { PlaybackItemDto } from '../api/onlineArenaApi';

const DURATION_EPSILON = 1e-3;

export function parseFraudTimestamp(text: string): { seconds: number; formatted: string } {
  if (!text || !text.trim()) return { seconds: 0, formatted: '00:00' };
  const raw = text.trim().toLowerCase();

  // 1. MM:SS or HH:MM:SS format (01:15, 1:15, 0:45)
  if (raw.includes(':')) {
    const parts = raw.split(':').map((p) => parseInt(p.trim(), 10) || 0);
    if (parts.length === 2) {
      const sec = parts[0] * 60 + parts[1];
      const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return { seconds: sec, formatted: `${m}:${s}` };
    }
    if (parts.length === 3) {
      const sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return { seconds: sec, formatted: `${m}:${s}` };
    }
  }

  // 2. Natural language format (1 min 15 sec, 1m 15s, 75 sec, 75s)
  const minMatch = raw.match(/(\d+)\s*(?:min|m|p|phút|phut)/);
  const secMatch = raw.match(/(\d+)\s*(?:sec|s|giây|giay)/);

  let totalSec = 0;
  let hasMatch = false;

  if (minMatch) {
    totalSec += parseInt(minMatch[1], 10) * 60;
    hasMatch = true;
  }
  if (secMatch) {
    totalSec += parseInt(secMatch[1], 10);
    hasMatch = true;
  }

  if (hasMatch) {
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return { seconds: totalSec, formatted: `${m}:${s}` };
  }

  // 3. Plain number input (e.g. 75 or 90)
  const num = parseInt(raw.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num > 0) {
    const m = Math.floor(num / 60)
      .toString()
      .padStart(2, '0');
    const s = (num % 60).toString().padStart(2, '0');
    return { seconds: num, formatted: `${m}:${s}` };
  }

  return { seconds: 0, formatted: '00:00' };
}

/** Format seconds as MM:SS or MM:SS.xx when fractional. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const wholeSec = Math.floor(total % 60);
  const frac = total - Math.floor(total);
  if (frac > DURATION_EPSILON) {
    const fracStr = frac.toFixed(2).slice(1); // ".14"
    return `${m}:${wholeSec.toString().padStart(2, '0')}${fracStr}`;
  }
  return `${m}:${wholeSec.toString().padStart(2, '0')}`;
}

export function validateFraudTimestamp(
  seconds: number,
  maxDurationSeconds: number | null | undefined
): { valid: boolean; error?: string } {
  if (maxDurationSeconds == null || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds <= 0) {
    return {
      valid: false,
      error: 'Match recording duration is not available. Cannot submit a fraud report at this time.',
    };
  }

  if (seconds < 0 || seconds > maxDurationSeconds + DURATION_EPSILON) {
    return {
      valid: false,
      error: `Please enter a valid timestamp within the match duration (00:00 – ${formatDuration(maxDurationSeconds)}).`,
    };
  }

  return { valid: true };
}

export function getMatchDurationSeconds(
  recordings: Array<Pick<PlaybackItemDto, 'durationSeconds'> | undefined | null> | undefined | null
): number | null {
  if (!recordings || recordings.length === 0) return null;
  let max = 0;
  for (const item of recordings) {
    const d = item?.durationSeconds;
    if (typeof d === 'number' && Number.isFinite(d) && d > max) {
      max = d;
    }
  }
  return max > 0 ? max : null;
}
