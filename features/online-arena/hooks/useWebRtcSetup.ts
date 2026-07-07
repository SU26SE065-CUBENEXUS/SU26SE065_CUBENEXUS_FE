/**
 * useWebRtcSetup — Robust WebRTC signaling hook
 *
 * Design principles:
 * 1. Single RTCPeerConnection instance pinned in a ref (never re-created on re-render).
 * 2. ICE candidate queue: candidates that arrive before setRemoteDescription is called
 *    are buffered and drained once the remote description is applied.
 * 3. Strict signaling-state guards on every step so duplicate offers/answers are
 *    silently ignored instead of crashing the state machine.
 * 4. P1 (offerer) sends one offer and retries ONLY when the PC is in "stable" state
 *    (i.e. after a full reset, not while negotiating).
 * 5. Negotiation lock: a single boolean ref prevents concurrent negotiation attempts.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export type WebRtcStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseWebRtcSetupOptions {
  matchId: string;
  isP1: boolean;                         // true → offerer, false → answerer
  opponentUserId: string | null;
  connection: HubConnection | null;       // SignalR connection
  stream: MediaStream | null;            // local camera stream
  alreadyConnected: boolean;             // skip if already marked connected in backend
  onConnected: () => Promise<void>;      // called when ICE reaches connected/completed
}

export function useWebRtcSetup({
  matchId,
  isP1,
  opponentUserId,
  connection,
  stream,
  alreadyConnected,
  onConnected,
}: UseWebRtcSetupOptions) {
  const [status, setStatus] = useState<WebRtcStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // ── stable refs (never cause re-renders / re-effects) ─────────────────────
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const negotiatingRef = useRef(false);   // lock: prevents concurrent negotiations
  const connectedRef = useRef(false);     // true once ICE is connected/completed

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
  const createPc = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    console.log('[WebRTC] Creating new RTCPeerConnection...');
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    pcRef.current = pc;
    iceCandidateQueue.current = [];
    negotiatingRef.current = false;

    // Attach local tracks
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => pc.addTrack(t, s));
    }

    // ── ICE candidate generated locally ────────────────────────────────────
    pc.onicecandidate = (evt) => {
      if (!evt.candidate) return;
      const conn = connectionRef.current;
      const uid = opponentUserIdRef.current;
      if (!conn || !uid) return;
      conn
        .invoke('SendIceCandidate', matchId, uid, JSON.stringify(evt.candidate.toJSON()))
        .catch((e) => console.warn('[WebRTC] SendIceCandidate error:', e));
    };

    // ── ICE state machine ───────────────────────────────────────────────────
    pc.oniceconnectionstatechange = async () => {
      const s = pc.iceConnectionState;
      console.log('[WebRTC] iceConnectionState →', s);

      if ((s === 'connected' || s === 'completed') && !connectedRef.current) {
        connectedRef.current = true;
        setStatus('connected');
        try {
          await onConnectedRef.current();
        } catch (e) {
          console.error('[WebRTC] onConnected callback error:', e);
        }
      } else if (s === 'failed') {
        console.error('[WebRTC] ICE failed. Will restart negotiation.');
        setStatus('error');
        setError('WebRTC ICE connection failed.');
      } else if (s === 'disconnected') {
        // Transient — don't mark as error; ICE can recover
        console.warn('[WebRTC] ICE disconnected (transient).');
      }
    };

    // ── Signaling state for debugging ────────────────────────────────────────
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] signalingState →', pc.signalingState);
    };

    return pc;
  }, [matchId, drainIceCandidates]); // stable: matchId never changes

  // ── P1: create and send offer ─────────────────────────────────────────────
  const sendOffer = useCallback(async () => {
    if (alreadyConnected || connectedRef.current) return;

    const conn = connectionRef.current;
    const uid = opponentUserIdRef.current;
    if (!conn || !uid) {
      console.log('[WebRTC] sendOffer: no connection or opponent yet.');
      return;
    }

    // If negotiating, skip — don't stack concurrent negotiations
    if (negotiatingRef.current) {
      console.log('[WebRTC] sendOffer: negotiation already in progress, skipping.');
      return;
    }

    const pc = pcRef.current ?? createPc();

    // Only send offer from stable state
    if (pc.signalingState !== 'stable') {
      console.log('[WebRTC] sendOffer: skipping, signalingState is', pc.signalingState);
      return;
    }

    // Re-transmit existing offer if we already have one (recovers from lost signaling message)
    if (pc.localDescription?.type === 'offer') {
      console.log('[WebRTC] Re-transmitting existing offer...');
      conn
        .invoke('SendWebRtcOffer', matchId, uid, pc.localDescription.sdp)
        .catch((e) => console.warn('[WebRTC] SendWebRtcOffer retransmit error:', e));
      return;
    }

    negotiatingRef.current = true;
    try {
      console.log('[WebRTC] Creating SDP offer...');
      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await conn.invoke('SendWebRtcOffer', matchId, uid, offer.sdp!);
      console.log('[WebRTC] Offer sent.');
    } catch (e) {
      console.error('[WebRTC] Failed to send offer:', e);
      negotiatingRef.current = false;
    }
    // Note: negotiatingRef stays true until we receive and apply the answer
  }, [matchId, alreadyConnected, createPc]);

  // ── Incoming offer handler (P2) ───────────────────────────────────────────
  const handleOffer = useCallback(async (payload: any) => {
    if (alreadyConnected || connectedRef.current) return;
    console.log('[WebRTC] Offer received from:', payload.fromUserId);

    const conn = connectionRef.current;
    const uid = opponentUserIdRef.current;
    if (!conn || !uid) return;

    let pc = pcRef.current;

    // If we're in have-local-offer, the other side also created an offer (glare).
    // The convention: lower userId wins and becomes answerer.
    if (pc?.signalingState === 'have-local-offer') {
      // Reset and re-create PC to accept their offer
      console.log('[WebRTC] Glare detected. Resetting PC to accept remote offer.');
      pc = createPc();
    } else if (!pc || pc.signalingState === 'stable') {
      pc = pcRef.current ?? createPc();
    } else {
      console.log('[WebRTC] handleOffer: ignoring, unexpected state:', pc.signalingState);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.offer }));
      // Drain any ICE candidates that arrived before remote description
      await drainIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await conn.invoke('SendWebRtcAnswer', matchId, uid, answer.sdp!);
      console.log('[WebRTC] Answer sent.');
    } catch (e) {
      console.error('[WebRTC] Error handling remote offer:', e);
    }
  }, [matchId, alreadyConnected, createPc, drainIceCandidates]);

  // ── Incoming answer handler (P1) ─────────────────────────────────────────
  const handleAnswer = useCallback(async (payload: any) => {
    if (alreadyConnected || connectedRef.current) return;
    console.log('[WebRTC] Answer received from:', payload.fromUserId);

    const pc = pcRef.current;
    if (!pc) {
      console.warn('[WebRTC] handleAnswer: no PeerConnection found.');
      return;
    }

    if (pc.signalingState !== 'have-local-offer') {
      console.log('[WebRTC] handleAnswer: ignoring, signalingState is', pc.signalingState);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.answer }));
      negotiatingRef.current = false;
      console.log('[WebRTC] Remote answer applied. ICE negotiation begins.');
      // Drain buffered ICE candidates
      await drainIceCandidates(pc);
    } catch (e) {
      console.error('[WebRTC] Error applying remote answer:', e);
      negotiatingRef.current = false;
    }
  }, [alreadyConnected, drainIceCandidates]);

  // ── Incoming ICE candidate ────────────────────────────────────────────────
  const handleIceCandidate = useCallback(async (payload: any) => {
    if (alreadyConnected || connectedRef.current) return;

    let candidateData: RTCIceCandidateInit;
    try {
      candidateData = JSON.parse(payload.candidate);
    } catch {
      console.warn('[WebRTC] Failed to parse ICE candidate payload:', payload);
      return;
    }

    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      // Buffer until remoteDescription is set
      console.log('[WebRTC] Buffering ICE candidate (no remoteDescription yet).');
      iceCandidateQueue.current.push(candidateData);
      return;
    }

    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      console.log('[WebRTC] Remote ICE candidate added.');
    } catch (e) {
      console.warn('[WebRTC] Error adding ICE candidate:', e);
    }
  }, [alreadyConnected]);

  // ── Wire up SignalR handlers ──────────────────────────────────────────────
  useEffect(() => {
    if (!connection) return;

    connection.on('WebRtcOfferReceived', handleOffer);
    connection.on('WebRtcAnswerReceived', handleAnswer);
    connection.on('IceCandidateReceived', handleIceCandidate);

    return () => {
      connection.off('WebRtcOfferReceived', handleOffer);
      connection.off('WebRtcAnswerReceived', handleAnswer);
      connection.off('IceCandidateReceived', handleIceCandidate);
    };
  }, [connection, handleOffer, handleAnswer, handleIceCandidate]);

  // ── P1: start offer once camera stream + connection ready ─────────────────
  useEffect(() => {
    if (!isP1 || alreadyConnected || !connection || !stream) return;

    setStatus('connecting');
    connectedRef.current = false;

    // Initial offer
    sendOffer();

    // Retry offer every 5 seconds ONLY if still in stable state
    // (means previous offer was lost or not yet answered)
    const interval = setInterval(() => {
      const pc = pcRef.current;
      if (!pc) return;
      if (connectedRef.current) {
        clearInterval(interval);
        return;
      }
      // Only retry if stuck in stable (offer was never received by peer)
      if (pc.signalingState === 'stable' && !connectedRef.current) {
        console.log('[WebRTC] Offer retry (peer likely missed it)...');
        // Reset negotiation so we can re-offer
        negotiatingRef.current = false;
        sendOffer();
      }
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isP1, alreadyConnected, connection, stream]);

  // ── P2: ensure PC is created and ready to receive offer ──────────────────
  useEffect(() => {
    if (isP1 || alreadyConnected || !connection || !stream) return;

    setStatus('connecting');
    connectedRef.current = false;
    // Create PC now so tracks are attached and ICE gathering can start
    createPc();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isP1, alreadyConnected, connection, stream]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        console.log('[WebRTC] Closing RTCPeerConnection on unmount.');
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  // ── Manual retry (e.g. after ICE failure) ────────────────────────────────
  const retry = useCallback(() => {
    connectedRef.current = false;
    negotiatingRef.current = false;
    setError(null);
    setStatus('connecting');
    createPc();
    if (isP1) {
      sendOffer();
    }
  }, [isP1, createPc, sendOffer]);

  return { status, error, retry };
}
