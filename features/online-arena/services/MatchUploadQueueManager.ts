import { apiFetch } from '@/lib/api/config';

export interface MatchUploadTask {
  matchId: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  recordedAt: string;
  status: 'idle' | 'uploading' | 'finalizing' | 'completed' | 'failed';
  progress: number; // 0 - 100
  error?: string;
  objectKey?: string;
  retryCount: number;
}

export type UploadProgressListener = (task: MatchUploadTask) => void;

class MatchUploadQueueManagerService {
  private tasks: Map<string, MatchUploadTask> = new Map();
  private listeners: Set<UploadProgressListener> = new Set();
  private maxRetries = 3;

  public subscribe(listener: UploadProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(task: MatchUploadTask) {
    this.listeners.forEach((listener) => listener(task));
  }

  public getTaskStatus(matchId: string): MatchUploadTask | undefined {
    return this.tasks.get(matchId);
  }

  /**
   * Enqueue a newly finished local recording blob and initiate background upload.
   */
  public async enqueueUpload(payload: {
    matchId: string;
    blob: Blob;
    mimeType: string;
    durationSeconds: number;
    recordedAt?: string;
  }): Promise<void> {
    const { matchId, blob, mimeType, durationSeconds, recordedAt } = payload;

    const task: MatchUploadTask = {
      matchId,
      blob,
      mimeType,
      durationSeconds,
      recordedAt: recordedAt ?? new Date().toISOString(),
      status: 'idle',
      progress: 0,
      retryCount: 0,
    };

    this.tasks.set(matchId, task);
    this.notify(task);

    void this.processTask(task);
  }

  private async processTask(task: MatchUploadTask): Promise<void> {
    try {
      task.status = 'uploading';
      task.progress = 5;
      task.error = undefined;
      this.notify(task);

      // 1. Get presigned upload URL ticket from backend
      const extension = task.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const ticket = await apiFetch<{ uploadUrl: string; objectKey: string; contentType: string }>(
        `/api/matches/${task.matchId}/recording/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({
            contentType: task.mimeType,
            fileExtension: extension,
            durationSeconds: task.durationSeconds,
            recordedAt: task.recordedAt,
          }),
        },
      );

      task.objectKey = ticket.objectKey;
      task.progress = 15;
      this.notify(task);

      // 2. Upload blob directly to Object Storage / presigned URL with progress tracking
      // If direct presigned upload fails (e.g. CORS block on Cloudflare R2), fallback to Backend direct stream upload
      try {
        await this.uploadBlobToPresignedUrl(ticket.uploadUrl, ticket.contentType, task.blob, (progress) => {
          task.progress = 15 + Math.floor((progress * 70) / 100);
          this.notify(task);
        });

        // 3. Mark completion with Backend
        task.status = 'finalizing';
        task.progress = 90;
        this.notify(task);

        await apiFetch(`/api/matches/${task.matchId}/recording/complete`, {
          method: 'POST',
          body: JSON.stringify({
            objectKey: ticket.objectKey,
            durationSeconds: task.durationSeconds,
          }),
        });
      } catch (directUploadErr: any) {
        console.warn(`[MatchUploadQueueManager] Direct S3 upload failed (${directUploadErr?.message}). Falling back to Backend Proxy Upload...`);
        task.status = 'uploading';
        task.progress = 30;
        this.notify(task);

        await this.uploadDirectToBackend(task);
      }

      task.status = 'completed';
      task.progress = 100;
      this.notify(task);
    } catch (err: any) {
      console.error(`[MatchUploadQueueManager] Upload failed for match ${task.matchId}:`, err);
      task.error = err?.message || 'Upload failed.';

      if (task.retryCount < this.maxRetries) {
        task.retryCount += 1;
        const delayMs = Math.pow(2, task.retryCount) * 1000;
        console.log(`[MatchUploadQueueManager] Retrying match ${task.matchId} in ${delayMs}ms (Attempt ${task.retryCount}/${this.maxRetries})...`);
        setTimeout(() => {
          void this.processTask(task);
        }, delayMs);
      } else {
        task.status = 'failed';
        this.notify(task);
      }
    }
  }

  private uploadBlobToPresignedUrl(
    uploadUrl: string,
    contentType: string,
    blob: Blob,
    onProgress: (percent: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', contentType || 'video/webm');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Presigned upload failed with HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during video upload.'));
      xhr.onabort = () => reject(new Error('Video upload aborted.'));

      xhr.send(blob);
    });
  }

  private async uploadDirectToBackend(task: MatchUploadTask): Promise<void> {
    const extension = task.mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('file', task.blob, `recording.${extension}`);

    await apiFetch(`/api/matches/${task.matchId}/recording/upload-direct?durationSeconds=${task.durationSeconds}`, {
      method: 'POST',
      body: formData,
    });
  }

  public retry(matchId: string): void {
    const task = this.tasks.get(matchId);
    if (task && task.status === 'failed') {
      task.retryCount = 0;
      void this.processTask(task);
    }
  }
}

export const MatchUploadQueueManager = new MatchUploadQueueManagerService();
