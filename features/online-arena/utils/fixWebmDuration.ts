/**
 * fixWebmDuration — Injects the correct duration into a WebM blob header.
 *
 * MediaRecorder produces WebM files with no Duration element in the Segment
 * Info block. Without a duration, media players can only seek within frames
 * that are indexed (usually the first few seconds), making 2-minute recordings
 * appear as ~15s when played back.
 *
 * This utility locates the Duration placeholder (double 0x01 markers in the
 * Segment Info EBML block) and writes the real float64 duration value, making
 * the entire video seekable.
 *
 * References:
 *   - WebM EBML spec: https://www.matroska.org/technical/specs/index.html
 *   - Chrome bug: https://bugs.chromium.org/p/chromium/issues/detail?id=642012
 */
export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!durationMs || durationMs <= 0) return blob;

  try {
    // Read the first 512 KB — the Segment Info block is always near the start
    const scanSize = Math.min(512 * 1024, blob.size);
    const headerBuffer = await blob.slice(0, scanSize).arrayBuffer();
    const view = new DataView(headerBuffer);
    const bytes = new Uint8Array(headerBuffer);

    // --- Locate the Duration EBML element (0x4489) ---
    // In Chrome-generated WebM files, the Duration element is a float64 (8 bytes).
    // When MediaRecorder doesn't know the duration, it writes a float64 of value 0
    // or leaves a placeholder. We search for EBML ID 0x4489 followed by size 0x88
    // (which means 8 byte payload).
    let durationOffset = -1;
    for (let i = 0; i < scanSize - 12; i++) {
      if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
        // Found Duration EBML ID
        const sizeIndicator = bytes[i + 2];
        if (sizeIndicator === 0x88) {
          // 8-byte float64 follows at i+3
          durationOffset = i + 3;
          break;
        }
      }
    }

    if (durationOffset === -1) {
      console.warn('[WebM] Duration element not found in header — skipping fix.');
      return blob;
    }

    // --- Write the duration as float64 in milliseconds (WebM timecode scale default = 1ms) ---
    const fixedHeader = headerBuffer.slice(0);
    const fixedView = new DataView(fixedHeader);
    fixedView.setFloat64(durationOffset, durationMs, false); // big-endian

    console.log(`[WebM] ✅ Duration injected at offset ${durationOffset}: ${durationMs}ms`);

    // Reconstruct the blob: fixed header + rest of original blob
    const rest = blob.slice(scanSize);
    return new Blob([fixedHeader, rest], { type: blob.type });
  } catch (err) {
    console.warn('[WebM] Failed to inject duration — returning original blob:', err);
    return blob;
  }
}
