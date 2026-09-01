/** Shared camera profile for Rubik sticker scanning (aligned with local Python camera_test). */

export const SNAPSHOT_MAX_WIDTH = 1280;
export const SNAPSHOT_QUALITY = 0.95;

const SCANNER_VIDEO_PROFILE = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
  resizeMode: 'none',
} as const;

export function buildScannerVideoConstraints(
  deviceId?: string,
  options?: { facingMode?: 'user' | 'environment' },
): MediaTrackConstraints {
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      ...SCANNER_VIDEO_PROFILE,
    } as MediaTrackConstraints;
  }

  return {
    ...SCANNER_VIDEO_PROFILE,
    facingMode: options?.facingMode ?? 'user',
  } as MediaTrackConstraints;
}

/**
 * Best-effort imaging tweaks to reduce blown highlights on glossy Rubik stickers.
 * Browsers vary widely in supported constraints — failures are ignored.
 */
export async function applyScannerVideoTrackSettings(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0];
  if (!track?.applyConstraints) return;

  const capabilities = track.getCapabilities?.();
  if (!capabilities) return;

  const advanced: MediaTrackConstraintSet[] = [];

  const exposureModes = capabilities.exposureMode as string[] | undefined;
  if (Array.isArray(exposureModes) && exposureModes.includes('continuous')) {
    advanced.push({ exposureMode: 'continuous' });
  }

  const exposureComp = capabilities.exposureCompensation as { min?: number; max?: number } | undefined;
  if (
    exposureComp
    && typeof exposureComp.min === 'number'
    && typeof exposureComp.max === 'number'
    && exposureComp.max > exposureComp.min
  ) {
    // Slightly under-expose to avoid white clipping on red/orange stickers.
    const target = Math.max(exposureComp.min, Math.min(exposureComp.max, -0.7));
    advanced.push({ exposureCompensation: target });
  }

  const whiteBalanceModes = capabilities.whiteBalanceMode as string[] | undefined;
  if (Array.isArray(whiteBalanceModes) && whiteBalanceModes.includes('continuous')) {
    advanced.push({ whiteBalanceMode: 'continuous' });
  }

  if (!advanced.length) return;

  try {
    await track.applyConstraints({ advanced });
  } catch {
    // Unsupported on this device/browser — keep default auto exposure.
  }
}

export async function captureScannerSnapshot(
  video: HTMLVideoElement,
  canvasRef?: { current: HTMLCanvasElement | null },
): Promise<Blob> {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error('Camera preview is not ready.');
  }

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const width = Math.min(SNAPSHOT_MAX_WIDTH, sourceWidth);
  const height = Math.round((sourceHeight / sourceWidth) * width);
  const isDownscaling = width < sourceWidth || height < sourceHeight;

  const canvas = canvasRef?.current ?? document.createElement('canvas');
  if (canvasRef) {
    canvasRef.current = canvas;
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available.');
  }

  // Keep pixels sharp when sending native resolution (Python path has no canvas blur).
  context.imageSmoothingEnabled = isDownscaling;
  context.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', SNAPSHOT_QUALITY);
  });

  if (!blob) {
    throw new Error('Failed to capture a camera snapshot.');
  }

  return blob;
}
