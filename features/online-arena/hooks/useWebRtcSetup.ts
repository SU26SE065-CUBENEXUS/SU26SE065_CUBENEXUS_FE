/**
 * useWebRtcSetup — Robust WebRTC signaling hook
 *
 * Design principles:
 * 1. Single RTCPeerConnection instance pinned in a ref (never re-created on re-render).
 * 2. ICE candidate queue: candidates that arrive before setRemoteDescription is called
 *    are buffered and drained once the remote description is applied.
 * 3. Strict signaling-state guards on every step so duplicate offers/answers are
 *    silently ignored instead of crashing the state machine.
 * 4. P1 (offerer) retries ONLY from 'stable' state (offer was truly lost in transit).
 *    P1 does NOT auto-reset when stuck in 'have-local-offer' — that was causing a race
 *    condition where P2's in-flight answer was discarded because P1 had already moved
 *    to a new PC.
 * 5. P2 sends "RequestOffer" on mount and periodically (every 10s) until connected.
 *    This is the ONLY mechanism that causes P1 to reset the PC and resend a fresh offer.
 * 6. Negotiation lock: a single boolean ref prevents concurrent negotiations.
 * 7. RTCPeerConnection stays alive while the match is active and is closed when
 *    the match becomes terminal or the hook unmounts.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';

const ICE_SERVERS: RTCIceServer[] = [
  // Free STUN fallback
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // Metered.ca TURN & STUN servers
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: 'b68c958f4e2fe679f34ad21c',
    credential: '99qMpGa1/jKM8HA8',
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: 'b68c958f4e2fe679f34ad21c',
    credential: '99qMpGa1/jKM8HA8',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: 'b68c958f4e2fe679f34ad21c',
    credential: '99qMpGa1/jKM8HA8',
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: 'b68c958f4e2fe679f34ad21c',
    credential: '99qMpGa1/jKM8HA8',
  },
];

/** P2 re-sends RequestOffer every this many ms until ICE is connected. */
const P2_REQUEST_OFFER_INTERVAL_MS = 10_000;

/** P1 re-sends offer from 'stable' state every this many ms (offer was lost). */
const P1_STABLE_RETRY_INTERVAL_MS = 5_000;

export type WebRtcStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseWebRtcSetupOptions {
  matchId: string;
  isP1: boolean;                         // true → offerer, false → answerer
  opponentUserId: string | null;
  connection: HubConnection | null;       // SignalR connection
  stream: MediaStream | null;            // local camera stream
  alreadyConnected: boolean;             // skip if already marked connected in backend
  opponentAlreadyConnected: boolean;     // detect and heal one-sided success
  onConnected: () => Promise<void>;      // called when ICE reaches connected/completed
  enabled: boolean;                       // disabled after the match becomes terminal
}

export function useWebRtcSetup({
  matchId,
  isP1,
  opponentUserId,
  connection,
  stream,
  alreadyConnected,
  opponentAlreadyConnected,
  onConnected,
  enabled,
}: UseWebRtcSetupOptions) {
  const [status, setStatus] = useState<WebRtcStatus>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── stable refs (never cause re-renders / re-effects) ─────────────────────
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const negotiatingRef = useRef(false);   // lock: prevents concurrent negotiations
  const connectedRef = useRef(false);     // true once ICE is connected/completed
  const offerSentAtRef = useRef<number>(0); // timestamp when P1 sent offer
  const pendingOfferRef = useRef<any>(null); // buffer for P2 if offer arrives before stream is ready
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // We need the latest values inside stable callbacks without adding deps
  const connectionRef = useRef(connection);
  const streamRef = useRef(stream);
  const opponentUserIdRef = useRef(opponentUserId);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => { connectionRef.current = connection; }, [connection]);
  useEffect(() => { streamRef.current = stream; }, [stream]);
  useEffect(() => { opponentUserIdRef.current = opponentUserId; }, [opponentUserId]);
  useEffect(() => { onConnectedRef.current = onConnected; }, [onConnected]);

  // ── helper: drain buffered ICE candidates ─────────────────────────────────
  const drainIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = [...iceCandidateQueue.current];
    iceCandidateQueue.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
        console.log('[WebRTC] Drained buffered ICE candidate.');
      } catch (e) {
        console.warn('[WebRTC] Failed to add buffered ICE candidate:', e);
      }
    }
  }, []);

  // ── create the one-and-only RTCPeerConnection ─────────────────────────────
  const createPc = useCallback((preserveIceQueue = false) => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    console.log('[WebRTC] Creating new RTCPeerConnection...');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });
    pcRef.current = pc;
    if (!preserveIceQueue) {
      iceCandidateQueue.current = [];
    }
    negotiatingRef.current = false;
    connectedRef.current = false; // reset so onConnected fires for the new PC

    const confirmConnected = async (source: 'ice' | 'peer') => {
      if (!enabledRef.current || connectedRef.current || pcRef.current !== pc) return;
      connectedRef.current = true;
      setStatus('connected');
      setError(null);
      console.log(`[WebRTC] Connection confirmed by ${source} state.`);
      try {
        await onConnectedRef.current();
      } catch (e) {
        console.error('[WebRTC] onConnected callback error:', e);
      }
    };

    // Attach local tracks with optimized video encoding constraints to save CPU & bandwidth
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => {
        const sender = pc.addTrack(t, s);
        if (t.kind === 'video') {
          try {
            const params = sender.getParameters();
            params.degradationPreference = 'maintain-framerate';
            if (!params.encodings) {
              params.encodings = [{}];
            }
            params.encodings.forEach((enc) => {
              enc.maxBitrate = 900_000; // 900 kbps max (high quality 360p)
              enc.maxFramerate = 30;    // 30 FPS max (smooth motion)
            });
            sender.setParameters(params).catch((err) => {
              console.warn('[WebRTC] Failed to apply encoding parameters:', err);
            });
          } catch (err) {
            console.warn('[WebRTC] Error configuring track parameters:', err);
          }
        }
      });
    }

    // ── Receive remote video tracks from opponent ──────────────────────────
    pc.ontrack = (evt) => {
      console.log('[WebRTC] Remote track received:', evt.track.kind);
      const stream = (evt.streams && evt.streams[0]) ? evt.streams[0] : new MediaStream([evt.track]);
      setRemoteStream(stream);
    };

    // ── ICE candidate generated locally ────────────────────────────────────
    pc.onicecandidate = (evt) => {
      if (!enabledRef.current || !evt.candidate) return;
      const conn = connectionRef.current;
      const uid = opponentUserIdRef.current;
      if (!conn || !uid) return;
      conn
        .invoke('SendIceCandidate', matchId, uid, JSON.stringify(evt.candidate.toJSON()))
        .catch((e) => console.warn('[WebRTC] SendIceCandidate error:', e));
    };

    // ── ICE state machine ───────────────────────────────────────────────────
    pc.oniceconnectionstatechange = async () => {
      if (!enabledRef.current) return;
      const s = pc.iceConnectionState;
      console.log('[WebRTC] iceConnectionState →', s);

      if (s === 'connected' || s === 'completed') {
        await confirmConnected('ice');
      } else if (s === 'failed') {
        console.error('[WebRTC] ICE failed — resetting PC and retrying negotiation...');
        connectedRef.current = false;
        setStatus('error');
        setError('WebRTC ICE connection failed. Click Retry or reconnect wifi.');
      } else if (s === 'disconnected') {
        console.warn('[WebRTC] ICE disconnected — scheduling automatic reconnect in 3s...');
        connectedRef.current = false;
        setStatus('connecting');
        // If disconnected for more than 3 seconds, reset PC to attempt fresh signaling
        setTimeout(() => {
          if (!connectedRef.current && enabledRef.current) {
            const currentPc = pcRef.current;
            if (currentPc && (currentPc.iceConnectionState === 'disconnected' || currentPc.iceConnectionState === 'failed')) {
              console.log('[WebRTC] Auto-reconnecting after ICE disconnect timeout...');
              createPc();
              if (isP1) {
                sendOffer();
              } else {
                const uid = opponentUserIdRef.current;
                const conn = connectionRef.current;
                if (uid && conn) {
                  conn.invoke('SendWebRtcRequestOffer', matchId, uid).catch(() => {});
                }
              }
            }
          }
        }, 3000);
      }
    };

    // Some browser/network combinations update the aggregate peer connection
    // state more reliably than iceConnectionState. Listen to both and dedupe
    // through connectedRef so the player who joined first cannot miss success.
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connectionState →', pc.connectionState);
      if (pc.connectionState === 'connected') {
        void confirmConnected('peer');
      }
    };

    // ── Signaling state for debugging ──────────────────────────────────────
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] signalingState →', pc.signalingState);
    };

    return pc;
  }, [matchId]); // stable: matchId never changes

  // ── P1: create and send offer ─────────────────────────────────────────────
  const sendOffer = useCallback(async () => {
    if (!enabledRef.current) return;
    const conn = connectionRef.current;
    const uid = opponentUserIdRef.current;
    if (!conn || !uid) {
      console.log('[WebRTC] sendOffer: no connection or opponent yet.');
      return;
    }

    // Prevent stacking concurrent negotiations
    if (negotiatingRef.current) {
      console.log('[WebRTC] sendOffer: negotiation in progress, skipping.');
      return;
    }

    const pc = pcRef.current ?? createPc();

    // Only allowed from stable state
    if (pc.signalingState !== 'stable') {
      console.log('[WebRTC] sendOffer: skipping, signalingState is', pc.signalingState);
      return;
    }

    negotiatingRef.current = true;
    try {
      console.log('[WebRTC] Creating SDP offer...');
      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
      await pc.setLocalDescription(offer);
      await conn.invoke('SendWebRtcOffer', matchId, uid, offer.sdp!);
      offerSentAtRef.current = Date.now();
      console.log('[WebRTC] Offer sent. Waiting for answer...');
    } catch (e) {
      console.error('[WebRTC] Failed to send offer:', e);
      negotiatingRef.current = false;
      offerSentAtRef.current = 0;
    }
  }, [matchId, createPc]);

  // ── P1: reset PC fully and resend a fresh offer ───────────────────────────
  // Called when P2 explicitly signals it is ready or reloads (RequestOffer).
  const resetAndSendOffer = useCallback(async () => {
    if (!enabledRef.current) return;
    const conn = connectionRef.current;
    const uid = opponentUserIdRef.current;
    if (!conn || !uid) return;

    console.log('[WebRTC] P1 reset: P2 requested a fresh offer. Resetting PC...');
    connectedRef.current = false;
    negotiatingRef.current = false;
    offerSentAtRef.current = 0;
    createPc(); // closes old PC, creates fresh one with local tracks
    await sendOffer();
  }, [createPc, sendOffer]);

  // ── Incoming offer handler (P2) ───────────────────────────────────────────
  const handleOffer = useCallback(async (payload: any) => {
    if (!enabledRef.current) return;
    if (!streamRef.current) {
      console.log('[WebRTC] P2: offer received before stream ready, buffering offer...');
      pendingOfferRef.current = payload;
      return;
    }

    pendingOfferRef.current = null;
    console.log('[WebRTC] Offer received from:', payload.fromUserId);

    const conn = connectionRef.current;
    const uid = opponentUserIdRef.current;
    if (!conn || !uid) return;
    if (connectedRef.current && pcRef.current?.iceConnectionState === 'connected') {
      // The other peer may be recovering from a one-sided connection where
      // only this browser reached connected. Accept its fresh offer and rebuild
      // instead of leaving it stuck until a manual page reload.
      console.log('[WebRTC] Recovery offer received while locally connected; rebuilding peer connection.');
    }

    // Reset flags and force a fresh PeerConnection to prevent setting remote description on a dead/stale connection
    connectedRef.current = false;
    negotiatingRef.current = false;
    setStatus('connecting');
    const pc = createPc(true);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.offer }));
      await drainIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await conn.invoke('SendWebRtcAnswer', matchId, uid, answer.sdp!);
      console.log('[WebRTC] Answer sent to P1.');
    } catch (e) {
      console.error('[WebRTC] Error handling remote offer:', e);
    }
  }, [matchId, createPc, drainIceCandidates]);

  // ── Incoming answer handler (P1) ─────────────────────────────────────────
  const handleAnswer = useCallback(async (payload: any) => {
    if (!enabledRef.current || !streamRef.current) return;
    console.log('[WebRTC] Answer received from:', payload.fromUserId);

    const pc = pcRef.current;
    if (!pc) {
      console.warn('[WebRTC] handleAnswer: no PeerConnection.');
      return;
    }

    if (pc.signalingState !== 'have-local-offer') {
      console.warn('[WebRTC] handleAnswer: ignoring answer — signalingState is', pc.signalingState);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.answer }));
      negotiatingRef.current = false;
      offerSentAtRef.current = 0;
      console.log('[WebRTC] Remote answer applied. ICE negotiation started.');
      await drainIceCandidates(pc);
    } catch (e) {
      console.error('[WebRTC] Error applying remote answer:', e);
      negotiatingRef.current = false;
    }
  }, [drainIceCandidates]);

  // ── Incoming ICE candidate ────────────────────────────────────────────────
  const handleIceCandidate = useCallback(async (payload: any) => {
    if (!enabledRef.current || !streamRef.current) return;

    let candidateData: RTCIceCandidateInit;
    try {
      candidateData = JSON.parse(payload.candidate);
    } catch {
      console.warn('[WebRTC] Failed to parse ICE candidate:', payload);
      return;
    }

    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      console.log('[WebRTC] Buffering ICE candidate (no remoteDescription yet).');
      iceCandidateQueue.current.push(candidateData);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      console.log('[WebRTC] Remote ICE candidate added:', candidateData.candidate);
    } catch (e) {
      console.warn('[WebRTC] Error adding ICE candidate:', e);
    }
  }, []);

  // ── P1: handles RequestOffer from P2 ─────────────────────────────────────
  const handleRequestOffer = useCallback(async (payload: any) => {
    if (!enabledRef.current || !streamRef.current || !isP1) return;
    const currentPc = pcRef.current;
    if (currentPc?.iceConnectionState === 'checking') {
      console.log('[WebRTC] RequestOffer received while ICE is actively checking. Ignoring this duplicate.');
      return;
    }
    if (connectedRef.current || currentPc?.iceConnectionState === 'connected') {
      console.warn('[WebRTC] Connected P1 received a recovery request from P2; rebuilding the connection for both peers.');
    }
    console.log('[WebRTC] RequestOffer received from P2 (', payload.fromUserId, '). Resetting and re-offering...');
    await resetAndSendOffer();
  }, [isP1, resetAndSendOffer]);

  // ── Wire up SignalR handlers ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !connection) return;

    connection.on('WebRtcOfferReceived', handleOffer);
    connection.on('WebRtcAnswerReceived', handleAnswer);
    connection.on('IceCandidateReceived', handleIceCandidate);
    connection.on('WebRtcRequestOffer', handleRequestOffer);

    return () => {
      connection.off('WebRtcOfferReceived', handleOffer);
      connection.off('WebRtcAnswerReceived', handleAnswer);
      connection.off('IceCandidateReceived', handleIceCandidate);
      connection.off('WebRtcRequestOffer', handleRequestOffer);
    };
  }, [enabled, connection, handleOffer, handleAnswer, handleIceCandidate, handleRequestOffer]);

  // ── P1: initial offer + periodic stable-state retry ──────────────────────
  useEffect(() => {
    if (!enabled || !isP1 || !connection || !stream) return;
    if (connectedRef.current) return;

    setStatus('connecting');
    connectedRef.current = false;
    createPc(); // Recreate PC so the new stream tracks are correctly attached

    sendOffer(); // first attempt

    // Retry ONLY when signalingState is 'stable' (offer was truly lost in transit).
    // We do NOT reset when in 'have-local-offer' — waiting for P2's answer is correct.
    // If P2 mounts late, P2 will send RequestOffer which is the only thing that resets.
    const interval = setInterval(() => {
      const pc = pcRef.current;
      if (!pc || connectedRef.current) return;

      if (pc.signalingState === 'stable' && !connectedRef.current) {
        // Do NOT interrupt if ICE is actively checking — it may be about to connect.
        // Only resend if ICE is in a dead state (new, disconnected, failed, closed).
        const iceState = pc.iceConnectionState;
        if (iceState === 'checking' || iceState === 'connected' || iceState === 'completed') {
          console.log('[WebRTC] P1: ICE is', iceState, '— waiting, NOT resending offer.');
          return;
        }
        console.log('[WebRTC] P1: offer was lost (stable state, ICE=' + iceState + '). Re-sending...');
        negotiatingRef.current = false;
        sendOffer();
      } else if (pc.signalingState === 'have-local-offer') {
        const elapsed = offerSentAtRef.current > 0 ? Date.now() - offerSentAtRef.current : 0;
        console.log(`[WebRTC] P1: in have-local-offer, waiting for P2 answer (${Math.round(elapsed / 1000)}s)...`);
      }
    }, P1_STABLE_RETRY_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isP1, connection, stream]);

  // ── P2: Process buffered offer as soon as local stream becomes ready ─────
  useEffect(() => {
    if (enabled && !isP1 && stream && pendingOfferRef.current) {
      console.log('[WebRTC] P2: local stream is now active, processing buffered offer...');
      const buffered = pendingOfferRef.current;
      pendingOfferRef.current = null;
      handleOffer(buffered);
    }
  }, [enabled, isP1, stream, handleOffer]);

  // ── P2: create PC, send RequestOffer, and repeat until connected ──────────
  useEffect(() => {
    if (!enabled || isP1 || !connection || !stream) return;
    if (connectedRef.current) return;

    // Only create PC if not already created (e.g. by handleOffer for a buffered offer)
    if (!pcRef.current || pcRef.current.signalingState === 'closed') {
      setStatus('connecting');
      connectedRef.current = false;
      createPc(); // attach local tracks to new PC
    }

    const sendRequest = () => {
      if (connectedRef.current) return;
      const pc = pcRef.current;
      if (pc?.iceConnectionState === 'connected' || pc?.iceConnectionState === 'checking') return;
      const uid = opponentUserIdRef.current;
      const conn = connectionRef.current;
      if (!uid || !conn) return;
      console.log('[WebRTC] P2: sending RequestOffer to P1...');
      conn
        .invoke('SendWebRtcRequestOffer', matchId, uid)
        .then(() => console.log('[WebRTC] P2: RequestOffer sent.'))
        .catch((e) => console.warn('[WebRTC] P2: SendWebRtcRequestOffer error:', e));
    };

    // Send immediately only if an offer is not already being processed
    if (!pendingOfferRef.current && pcRef.current?.signalingState !== 'have-remote-offer') {
      sendRequest();
    }

    // Repeat every 10s until ICE is connected (safety net for lost RequestOffer signals)
    const interval = setInterval(() => {
      if (connectedRef.current) {
        clearInterval(interval);
        return;
      }
      // Do NOT interrupt if ICE is actively checking — it may be about to connect.
      const pc = pcRef.current;
      const iceState = pc?.iceConnectionState;
      if (iceState === 'checking' || iceState === 'connected' || iceState === 'completed') {
        console.log('[WebRTC] P2: ICE is', iceState, '— waiting, NOT sending RequestOffer.');
        return;
      }
      sendRequest();
    }, P2_REQUEST_OFFER_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isP1, connection, stream]);

  useEffect(() => {
    if (enabled) return;

    connectedRef.current = false;
    negotiatingRef.current = false;
    iceCandidateQueue.current = [];
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
    setStatus('idle');
  }, [enabled]);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, []);

  // ── Manual retry (after ICE failure or stall) ─────────────────────────────
  const retry = useCallback(() => {
    console.log('[WebRTC] Manual retry triggered. Resetting PeerConnection...');
    connectedRef.current = false;
    negotiatingRef.current = false;
    setError(null);
    setStatus('connecting');
    createPc();
    if (isP1) {
      sendOffer();
    } else {
      const uid = opponentUserIdRef.current;
      const conn = connectionRef.current;
      if (uid && conn) {
        console.log('[WebRTC] P2 manual retry: sending RequestOffer to P1...');
        conn.invoke('SendWebRtcRequestOffer', matchId, uid).catch((err) => {
          console.warn('[WebRTC] SendWebRtcRequestOffer error during retry:', err);
        });
      }
    }
  }, [isP1, matchId, createPc, sendOffer]);

  // Heal the exact asymmetric state reported by production: the opponent has
  // persisted WebRTC=true, while this browser is still waiting. Re-negotiate
  // repeatedly until local ICE/peer state connects; the connected peer accepts
  // these recovery offers in handleOffer above.
  useEffect(() => {
    if (
      !enabled
      || alreadyConnected
      || !opponentAlreadyConnected
      || !connection
      || !stream
      || connectedRef.current
    ) return;

    console.warn('[WebRTC] Detected one-sided connection; starting automatic recovery negotiation.');
    retry();
    const recoveryInterval = window.setInterval(() => {
      if (connectedRef.current) {
        window.clearInterval(recoveryInterval);
        return;
      }
      retry();
    }, 5_000);

    return () => window.clearInterval(recoveryInterval);
  }, [enabled, alreadyConnected, opponentAlreadyConnected, connection, stream, retry]);

  return { status, error, retry, remoteStream };
}
