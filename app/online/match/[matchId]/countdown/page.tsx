'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { useCameraStream } from '@/features/online-arena/contexts/CameraStreamContext';
import { markVideoRecordingStarted } from '@/features/online-arena/api/onlineArenaApi';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { Sparkles, Timer, Circle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type RecordingStatus = 'idle' | 'starting' | 'recording' | 'notified' | 'error';

export default function CountdownPage() {
  const { matchId, state, refetch } = useMatchContext();
  const { stream, acquireStream } = useCameraStream();

  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartedRef = useRef(false);

  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const isP1 = state?.player1?.userId === userId;
  const myState = isP1 ? state?.player1 : state?.player2;
  const opponentState = isP1 ? state?.player2 : state?.player1;

  // ----------------------------------------------------------------
  // Server-corrected countdown timer
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!state?.countdownEndsAt) {
      setSecondsLeft(5);
      return;
    }

    const serverSkew = Date.now() - new Date(state.serverNow).getTime();
    const targetTime = new Date(state.countdownEndsAt).getTime();

    const updateTimer = () => {
      const correctedNow = Date.now() - serverSkew;
      const diff = Math.max(0, Math.ceil((targetTime - correctedNow) / 1000));
      setSecondsLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [state?.countdownEndsAt, state?.serverNow]);

  // ----------------------------------------------------------------
  // Start MediaRecorder and notify backend
  // ----------------------------------------------------------------
  const startRecording = useCallback(async (mediaStream: MediaStream) => {
    if (recordingStartedRef.current) return;
    recordingStartedRef.current = true;
    setRecordingStatus('starting');

    try {
      // Choose best supported mimeType
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';

      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.onerror = (e: any) => {
        console.error('[MediaRecorder] error', e);
        setRecordingStatus('error');
        setRecordingError('Recording device error: ' + (e?.error?.message ?? 'unknown'));
      };

      recorder.onstart = async () => {
        setRecordingStatus('recording');
        console.log('[MediaRecorder] recording started, mime:', recorder.mimeType);

        // Notify backend — this may trigger INSPECTION transition if opponent also recording
        try {
          await markVideoRecordingStarted(matchId, recorder.mimeType || mimeType);
          setRecordingStatus('notified');
          await refetch();
        } catch (err: any) {
          console.error('[MediaRecorder] markVideoRecordingStarted failed', err);
          setRecordingStatus('error');
          setRecordingError(err?.message ?? 'Failed to notify server of recording start.');
        }
      };

      recorder.start(1000); // collect chunks every 1s
    } catch (err: any) {
      console.error('[MediaRecorder] start failed', err);
      setRecordingStatus('error');
      setRecordingError(err?.message ?? 'Failed to start MediaRecorder.');
      recordingStartedRef.current = false;
    }
  }, [matchId, refetch]);

  // ----------------------------------------------------------------
  // On mount: ensure camera stream available, then start recording
  // ----------------------------------------------------------------
  useEffect(() => {
    if (myState?.recordingStarted) {
      setRecordingStatus('notified');
      return; // already done
    }

    const tryRecord = async () => {
      let mediaStream = stream;
      if (!mediaStream || !mediaStream.active) {
        mediaStream = await acquireStream();
      }
      if (mediaStream) {
        await startRecording(mediaStream);
      } else {
        setRecordingStatus('error');
        setRecordingError('Camera unavailable. Cannot start recording.');
      }
    };

    tryRecord();
  }, [myState?.recordingStarted, stream, acquireStream, startRecording]);

  // Stop recorder when unmounted
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const displayVal = secondsLeft === 0 ? 'GO!' : secondsLeft.toString();

  const recLabel =
    recordingStatus === 'notified' || recordingStatus === 'recording'
      ? 'Recording Active'
      : recordingStatus === 'starting'
      ? 'Starting recorder...'
      : recordingStatus === 'error'
      ? 'Recording Error'
      : 'Awaiting stream';

  const opponentRecording = opponentState?.recordingStarted ?? false;
  const myRecording = myState?.recordingStarted ?? false;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-8 animate-fade-in">
      <div className="space-y-2">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 3 / 4
        </span>
        <h2 className="text-2xl font-black text-white uppercase tracking-wider">PREPARE TO SOLVE</h2>
        <p className="text-zinc-500 text-xs">Hands on stackmat. Cube on inspection mat.</p>
      </div>

      {/* Gigantic animated countdown circle */}
      <div className="relative h-60 w-60 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[6px] border-orange-500/10" />
        <div className="absolute inset-0 rounded-full border-[6px] border-t-orange-500 border-r-orange-500/30 border-b-orange-500/10 border-l-orange-500/40 animate-spin" />

        <div className="h-44 w-44 rounded-full bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col items-center justify-center relative">
          <span
            className={`font-mono font-black tracking-tighter select-none ${
              secondsLeft === 0 ? 'text-5xl text-emerald-400 animate-bounce' : 'text-8xl text-white'
            }`}
          >
            {displayVal}
          </span>
          {secondsLeft > 0 && (
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-1 flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" /> SECONDS
            </span>
          )}
        </div>
      </div>

      {/* Recording status panel */}
      <div className="w-full max-w-sm bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-4 py-3 space-y-2">
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-left">Video Recording Status</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {recordingStatus === 'notified' ? (
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            ) : recordingStatus === 'recording' ? (
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            ) : recordingStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            )}
            <span
              className={`text-xs font-bold uppercase ${
                recordingStatus === 'notified' || recordingStatus === 'recording'
                  ? 'text-rose-400'
                  : recordingStatus === 'error'
                  ? 'text-rose-400'
                  : 'text-zinc-400'
              }`}
            >
              {recordingStatus === 'notified' || recordingStatus === 'recording' ? '● ' : ''}
              {recLabel}
            </span>
          </div>

          {/* Retry if error */}
          {recordingStatus === 'error' && (
            <button
              onClick={() => {
                recordingStartedRef.current = false;
                setRecordingStatus('idle');
                setRecordingError(null);
                const tryRetry = async () => {
                  const mediaStream = stream ?? (await acquireStream());
                  if (mediaStream) await startRecording(mediaStream);
                };
                tryRetry();
              }}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-xl uppercase"
            >
              Retry
            </button>
          )}
        </div>

        {recordingError && (
          <p className="text-[10px] text-rose-300 text-left">{recordingError}</p>
        )}

        {/* Both recordings status */}
        <div className="flex gap-2 pt-1">
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
              myRecording
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-zinc-500 border-zinc-700/30 bg-zinc-800/30'
            }`}
          >
            {myRecording ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
            You
          </span>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
              opponentRecording
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-zinc-500 border-zinc-700/30 bg-zinc-800/30'
            }`}
          >
            {opponentRecording ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
            Opponent
          </span>
          {myRecording && opponentRecording && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border text-orange-400 border-orange-500/30 bg-orange-500/10 animate-pulse">
              Transition imminent
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Sparkles className="h-4 w-4 text-orange-500" /> Synchronization countdown active
        </span>
      </div>
    </div>
  );
}
