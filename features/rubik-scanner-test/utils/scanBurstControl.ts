export const TERMINAL_SCANNER_STATES = new Set([
  'ACCEPTED',
  'DUPLICATE_FACE',
  'RETRY',
  'AI_BUSY',
  'AI_UNAVAILABLE',
  'CAMERA_ERROR',
]);

export function shouldStopBurst(scannerState: string) {
  return TERMINAL_SCANNER_STATES.has(scannerState);
}

export async function runScannerBurst<TObservation>({
  capture,
  observe,
  delay,
  onObservation,
  shouldStop,
  shouldAbort,
  maxBurstMs,
  sampleIntervalMs,
  now,
}: {
  capture: () => Promise<Blob>;
  observe: (snapshot: Blob) => Promise<TObservation>;
  delay: (ms: number) => Promise<unknown>;
  onObservation?: (observation: TObservation) => void;
  shouldStop?: (observation: TObservation) => boolean;
  shouldAbort: () => boolean;
  maxBurstMs: number;
  sampleIntervalMs: number;
  now: () => number;
}): Promise<{ reason: 'terminal' | 'timeout' | 'aborted'; observation: TObservation | null }> {
  const startedAt = now();
  const stopPredicate = shouldStop ?? ((observation: any) => shouldStopBurst(observation.scannerState));
  let lastObservation: TObservation | null = null;

  while (!shouldAbort() && (now() - startedAt) < maxBurstMs) {
    const snapshot = await capture();
    if (shouldAbort()) {
      return { reason: 'aborted', observation: lastObservation };
    }

    const tickStartedAt = now();
    lastObservation = await observe(snapshot);
    const duration = now() - tickStartedAt;
    
    onObservation?.(lastObservation);

    if (stopPredicate(lastObservation)) {
      return { reason: 'terminal', observation: lastObservation };
    }

    if (shouldAbort()) {
      return { reason: 'aborted', observation: lastObservation };
    }

    // Không dùng adaptive delay — AI inference đã đồng bộ (await observe()).
    // Mỗi vòng lặp đã tự chờ AI xong mới tiếp tục, không cần giãn cách thêm.
    await delay(sampleIntervalMs);
  }

  return { reason: shouldAbort() ? 'aborted' : 'timeout', observation: lastObservation };
}
