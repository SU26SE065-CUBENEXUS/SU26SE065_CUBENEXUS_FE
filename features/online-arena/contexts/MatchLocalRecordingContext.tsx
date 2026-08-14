'use client';

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode, useEffect } from 'react';
import { useCameraStream } from './CameraStreamContext';
import { markVideoRecordingStarted } from '../api/onlineArenaApi';
import { MatchUploadQueueManager, MatchUploadTask } from '../services/MatchUploadQueueManager';
import { fixWebmDuration } from '../utils/fixWebmDuration';

export type RecordingState = 'idle' | 'starting' | 'recording' | 'buffering' | 'finished' | 'error';

interface MatchLocalRecordingContextType {
  status: RecordingState;
  error: string | null;
  recordedDurationSeconds: number;
  uploadTask?: MatchUploadTask;
  startRecording: (matchId: string) => Promise<void>;
  stopRecordingWithBuffer: (postSolveBufferMs?: number) => Promise<void>;
}

const MatchLocalRecordingContext = createContext<MatchLocalRecordingContextType | null>(null);

const POST_SOLVE_BUFFER_DEFAULT_MS = 3000;

export function MatchLocalRecordingProvider({ children }: { children: ReactNode }) {
  const { stream, acquireStream } = useCameraStream();

  const [status, setStatus] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordedDurationSeconds, setRecordedDurationSeconds] = useState<number>(0);
  const [uploadTask, setUploadTask] = useState<MatchUploadTask | undefined>(undefined);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const matchIdRef = useRef<string>('');
  const startedAtMsRef = useRef<number>(0);
  const recordingMarkedRef = useRef<boolean>(false);
  const isBufferingRef = useRef<boolean>(false);
  // Use ref to track status for guards — avoids stale closure issues in callbacks
  const statusRef = useRef<RecordingState>('idle');

  // Subscribe to MatchUploadQueueManager updates
  useEffect(() => {
    const unsubscribe = MatchUploadQueueManager.subscribe((task) => {
      if (matchIdRef.current && task.matchId === matchIdRef.current) {
        setUploadTask({ ...task });
      }
    });
    return unsubscribe;
  }, []);

  const resolveSupportedMimeType = (): string => {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    return candidates.find((c) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) ?? '';
  };

  const startRecording = useCallback(
    async (matchId: string) => {
      console.log(`[REC] startRecording called. matchId=${matchId} prevMatchId=${matchIdRef.current} statusRef=${statusRef.current}`);
      if (matchIdRef.current === matchId && (statusRef.current === 'recording' || statusRef.current === 'starting')) {
        console.warn('[REC] Already recording/starting for same match — skipped (statusRef guard).');
        return;
      }

      // If switching matchId or re-starting, clean up previous recorder if any
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) { }
      }

      statusRef.current = 'starting';
      matchIdRef.current = matchId;
      recordingMarkedRef.current = false;
      setError(null);
      setStatus('starting');
      chunksRef.current = [];

      try {
        let activeStream = stream;
        if (!activeStream || !activeStream.active) {
          console.log('[REC] No active stream — acquiring...');
          activeStream = await acquireStream();
        }

        if (!activeStream) {
          throw new Error('Camera stream unavailable. Cannot start local match recording.');
        }

        const videoTrack = activeStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            console.warn('[REC]  Video track ended during recording session!');
          };
        }

        const selectedMimeType = resolveSupportedMimeType();
        console.log('[REC] Creating MediaRecorder with mimeType:', selectedMimeType);
        const recorder = new MediaRecorder(activeStream, selectedMimeType ? { mimeType: selectedMimeType } : {});
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onerror = (e: any) => {
          console.error('[REC] MediaRecorder error:', e);
          setStatus('error');
          setError(e?.error?.message || 'Local recording device error.');
        };

        recorder.onstart = async () => {
          startedAtMsRef.current = Date.now();
          statusRef.current = 'recording';
          setStatus('recording');
          console.log('[REC]  Recording STARTED. mime:', recorder.mimeType, 'matchId:', matchId);

          let lastError: unknown;
          for (let attempt = 1; attempt <= 5 && !recordingMarkedRef.current; attempt += 1) {
            try {
              await markVideoRecordingStarted(matchId, recorder.mimeType || selectedMimeType);
              recordingMarkedRef.current = true;
            } catch (err) {
              lastError = err;
              if (attempt < 5) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 500));
              }
            }
          }

          if (!recordingMarkedRef.current) {
            console.error('[REC] Failed to notify backend of recording start:', lastError);
          }
        };

        recorder.start(1000);
      } catch (err: any) {
        console.error('[REC] startRecording FAILED:', err);
        statusRef.current = 'error';
        setStatus('error');
        setError(err?.message || 'Failed to start local camera recording.');
      }
    },
    [stream, acquireStream],
  );

  const finalizeAndHandoffBlob = useCallback(async () => {
    const durationMs = Math.max(0, Date.now() - startedAtMsRef.current);
    const durationSec = Number((durationMs / 1000).toFixed(2));
    setRecordedDurationSeconds(durationSec);

    const mime = mediaRecorderRef.current?.mimeType || 'video/webm';
    const rawBlob = new Blob(chunksRef.current, { type: mime });
    console.log(`[REC] finalizeAndHandoffBlob called. chunks=${chunksRef.current.length} blobSize=${rawBlob.size} durationSec=${durationSec} matchId=${matchIdRef.current}`);
    chunksRef.current = [];
    statusRef.current = 'finished';
    setStatus('finished');

    if (matchIdRef.current && rawBlob.size > 0) {
      // Fix missing Duration metadata in WebM containers.
      // MediaRecorder does NOT write duration into the WebM header, causing
      // players to only be able to seek within ~15s even for 2+ minute recordings.
      let blob = rawBlob;
      if (mime.includes('webm')) {
        console.log(`[REC] Injecting WebM duration metadata (${durationMs}ms)...`);
        blob = await fixWebmDuration(rawBlob, durationMs);
      }

      console.log(`[REC]  Handing off blob (${blob.size} bytes, ${durationSec}s) to MatchUploadQueueManager...`);
      void MatchUploadQueueManager.enqueueUpload({
        matchId: matchIdRef.current,
        blob,
        mimeType: mime,
        durationSeconds: durationSec,
      });
    } else {
      console.error(`[REC]  Blob is EMPTY or matchId missing! blobSize=${rawBlob.size} matchId=${matchIdRef.current} — upload skipped.`);
    }
  }, []);

  const stopRecordingWithBuffer = useCallback(
    async (postSolveBufferMs: number = POST_SOLVE_BUFFER_DEFAULT_MS) => {
      console.log(`[REC] stopRecordingWithBuffer called. recorderState=${mediaRecorderRef.current?.state} isBuffering=${isBufferingRef.current} statusRef=${statusRef.current}`);
      if (!mediaRecorderRef.current) {
        console.log('[REC] stopRecordingWithBuffer: mediaRecorder is already null or stopped.');
        return;
      }
      if (mediaRecorderRef.current.state === 'inactive') {
        console.warn('[REC]  stopRecordingWithBuffer: recorder already INACTIVE — already stopped?');
        return;
      }
      if (isBufferingRef.current) {
        console.warn('[REC]  stopRecordingWithBuffer: already buffering — duplicate call ignored.');
        return;
      }

      isBufferingRef.current = true;
      setStatus('buffering');
      console.log(`[REC] Holding ${postSolveBufferMs}ms post-solve reaction buffer...`);

      setTimeout(() => {
        console.log(`[REC] Buffer timeout fired. recorderState=${mediaRecorderRef.current?.state}`);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = () => {
            console.log('[REC] recorder.onstop fired → calling finalizeAndHandoffBlob');
            void finalizeAndHandoffBlob().finally(() => {
              isBufferingRef.current = false;
            });
          };
          mediaRecorderRef.current.stop();
          console.log('[REC] recorder.stop() called');
        } else {
          console.error('[REC]  Buffer timeout: recorder NULL or INACTIVE — cannot stop!');
          isBufferingRef.current = false;
        }
      }, postSolveBufferMs);
    },
    [finalizeAndHandoffBlob],
  );

  // Clean up on unmount — must set onstop BEFORE stop() to preserve blob
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        // If we're still buffering/recording on unmount, ensure finalizeAndHandoffBlob fires
        if (!isBufferingRef.current) {
          recorder.onstop = () => {
            void finalizeAndHandoffBlob();
          };
        }
        recorder.stop();
      }
    };
  }, [finalizeAndHandoffBlob]);

  return (
    <MatchLocalRecordingContext.Provider
      value={{
        status,
        error,
        recordedDurationSeconds,
        uploadTask,
        startRecording,
        stopRecordingWithBuffer,
      }}
    >
      {children}
    </MatchLocalRecordingContext.Provider>
  );
}

export function useMatchLocalRecorder() {
  const ctx = useContext(MatchLocalRecordingContext);
  if (!ctx) {
    throw new Error('useMatchLocalRecorder must be used within a MatchLocalRecordingProvider');
  }
  return ctx;
}
