import type {
  AiRubikHealthResponse,
  AiRubikScannerPreviewResponse,
  AiRubikScannerSessionResponse,
} from '../types';

export async function fetchScannerTestHealth(backendUrl: string): Promise<AiRubikHealthResponse> {
  const base = backendUrl ? backendUrl.replace(/\/$/, '') : '';
  const response = await fetch(`${base}/api/dev/ai/scanner-test/health`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Scanner test health failed with HTTP ${response.status}.`);
  }
  return response.json();
}

export async function startScannerTestSession(backendUrl: string): Promise<AiRubikScannerSessionResponse> {
  const base = backendUrl ? backendUrl.replace(/\/$/, '') : '';
  const response = await fetch(`${base}/api/dev/ai/scanner-test/sessions`, {
    method: 'POST',
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Scanner test session start failed with HTTP ${response.status}.`);
  }
  return response.json();
}

export async function getScannerTestSession(args: {
  backendUrl: string;
  sessionId: string;
}): Promise<AiRubikScannerSessionResponse> {
  const base = args.backendUrl ? args.backendUrl.replace(/\/$/, '') : '';
  const response = await fetch(`${base}/api/dev/ai/scanner-test/sessions/${args.sessionId}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Scanner test session fetch failed with HTTP ${response.status}.`);
  }
  return response.json();
}

export async function observeScannerTestFrame(args: {
  backendUrl: string;
  sessionId: string;
  snapshot: Blob;
  scanSessionId: string;
  scanGeneration: number;
  requestId: string;
  targetFaceIndex: number;
  signal?: AbortSignal;
}): Promise<AiRubikScannerPreviewResponse> {
  const base = args.backendUrl ? args.backendUrl.replace(/\/$/, '') : '';
  const form = new FormData();
  form.append('snapshot', args.snapshot, 'preview.jpg');
  form.append('scanSessionId', args.scanSessionId);
  form.append('scanGeneration', String(args.scanGeneration));
  form.append('requestId', args.requestId);
  form.append('targetFaceIndex', String(args.targetFaceIndex));
  const response = await fetch(
    `${base}/api/dev/ai/scanner-test/sessions/${args.sessionId}/observe`,
    {
      method: 'POST',
      body: form,
      signal: args.signal,
    },
  );
  if (!response.ok && response.status !== 429) {
    const body = await response.text();
    throw new Error(body || `Scanner observe failed with HTTP ${response.status}.`);
  }
  return response.json();
}

export async function retryScannerTestFace(args: {
  backendUrl: string;
  sessionId: string;
}): Promise<AiRubikScannerSessionResponse> {
  const base = args.backendUrl ? args.backendUrl.replace(/\/$/, '') : '';
  const response = await fetch(
    `${base}/api/dev/ai/scanner-test/sessions/${args.sessionId}/retry-face`,
    {
      method: 'POST',
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Scanner retry failed with HTTP ${response.status}.`);
  }
  return response.json();
}

export async function resetScannerTestSession(args: {
  backendUrl: string;
  sessionId: string;
}): Promise<AiRubikScannerSessionResponse> {
  const base = args.backendUrl ? args.backendUrl.replace(/\/$/, '') : '';
  const response = await fetch(
    `${base}/api/dev/ai/scanner-test/sessions/${args.sessionId}/reset`,
    {
      method: 'POST',
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Scanner reset failed with HTTP ${response.status}.`);
  }
  return response.json();
}
