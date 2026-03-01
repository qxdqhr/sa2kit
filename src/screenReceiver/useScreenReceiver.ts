import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ScreenReceiverJoinedMessage,
  ScreenReceiverPeerLeftMessage,
  ScreenReceiverRoomStateMessage,
} from './types';

const DEFAULT_STUN_SERVER: RTCIceServer = { urls: 'stun:stun.l.google.com:19302' };

export interface ScreenReceiverLogEntry {
  id: number;
  text: string;
}

export interface UseScreenReceiverOptions {
  wsUrl: string;
  roomId: string;
  iceServers?: RTCIceServer[];
  maxLogs?: number;
}

export interface UseScreenReceiverReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  clearLogs: () => void;
  logs: ScreenReceiverLogEntry[];
  isConnected: boolean;
  connectionState: RTCPeerConnectionState | 'idle';
  iceConnectionState: RTCIceConnectionState | 'idle';
  videoRef: RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
}

type PeerContext = {
  ws?: WebSocket;
  pc?: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  selfPeerId?: string;
  publisherPeerId?: string;
};

function parseMessage(payload: MessageEvent['data']): Record<string, any> | null {
  try {
    if (typeof payload === 'string') return JSON.parse(payload);
    if (payload instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(payload));
    return JSON.parse(String(payload));
  } catch {
    return null;
  }
}

export function useScreenReceiver(options: UseScreenReceiverOptions): UseScreenReceiverReturn {
  const { wsUrl, roomId, iceServers = [DEFAULT_STUN_SERVER], maxLogs = 80 } = options;
  const [logs, setLogs] = useState<ScreenReceiverLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | 'idle'>('idle');
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState | 'idle'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const logIdRef = useRef(0);
  const peerRef = useRef<PeerContext>({ pendingCandidates: [] });
  const videoRef = useRef<HTMLVideoElement>(null);

  const appendLog = useCallback(
    (text: string) => {
      logIdRef.current += 1;
      setLogs((prev) => [...prev, { id: logIdRef.current, text }].slice(-maxLogs));
    },
    [maxLogs],
  );

  const disconnect = useCallback(() => {
    peerRef.current.ws?.close();
    peerRef.current.pc?.close();
    peerRef.current = { pendingCandidates: [] };
    setIsConnected(false);
    setConnectionState('idle');
    setIceConnectionState('idle');
    setStream(null);
  }, []);

  const connect = useCallback(async () => {
    disconnect();

    const normalizedWsUrl = wsUrl.trim();
    const normalizedRoomId = roomId.trim();
    if (!normalizedWsUrl) {
      appendLog('ws url is empty');
      return;
    }
    if (!normalizedRoomId) {
      appendLog('room id is empty');
      return;
    }

    appendLog(`connecting: ${normalizedWsUrl}`);

    let ws: WebSocket;
    try {
      ws = new WebSocket(normalizedWsUrl);
    } catch (error) {
      appendLog(`ws create error: ${String(error)}`);
      return;
    }

    const pc = new RTCPeerConnection({ iceServers });
    pc.addTransceiver('video', { direction: 'recvonly' });

    peerRef.current.ws = ws;
    peerRef.current.pc = pc;
    peerRef.current.pendingCandidates = [];

    ws.onopen = () => {
      appendLog('ws connected');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'join', roomId: normalizedRoomId, role: 'viewer' }));
    };

    ws.onclose = () => {
      appendLog('ws closed');
      setIsConnected(false);
    };

    ws.onerror = (event) => {
      appendLog(`ws error: ${event.type}`);
    };

    ws.onmessage = async (event) => {
      const message = parseMessage(event.data);
      if (!message) {
        appendLog('ws message parse error');
        return;
      }

      if (message.type === 'joined') {
        const joined = message as ScreenReceiverJoinedMessage;
        peerRef.current.selfPeerId = joined.peerId;
        appendLog(`joined room ${joined.roomId} as ${joined.peerId}`);
        return;
      }

      if (message.type === 'room_state') {
        const roomState = message as ScreenReceiverRoomStateMessage;
        const broadcaster = roomState.peers.find((peer) => peer.role === 'broadcaster');
        if (broadcaster) {
          peerRef.current.publisherPeerId = broadcaster.peerId;
          appendLog(`broadcaster online: ${broadcaster.peerId}`);
        }
        return;
      }

      if (message.type === 'offer' && typeof message.sdp === 'string') {
        appendLog('offer received');
        peerRef.current.publisherPeerId = typeof message.fromPeerId === 'string' ? message.fromPeerId : undefined;
        await pc.setRemoteDescription({ type: 'offer', sdp: message.sdp });
        for (const candidate of peerRef.current.pendingCandidates) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (error) {
            appendLog(`ice err: ${String(error)}`);
          }
        }
        peerRef.current.pendingCandidates = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(
          JSON.stringify({
            type: 'answer',
            sdp: answer.sdp,
            targetPeerId: peerRef.current.publisherPeerId,
          }),
        );
        appendLog('answer sent');
        return;
      }

      if (message.type === 'ice' && message.candidate) {
        if (!pc.remoteDescription) {
          peerRef.current.pendingCandidates.push(message.candidate as RTCIceCandidateInit);
          return;
        }
        try {
          await pc.addIceCandidate(message.candidate as RTCIceCandidateInit);
        } catch (error) {
          appendLog(`ice err: ${String(error)}`);
        }
        return;
      }

      if (message.type === 'peer_left') {
        const peerLeft = message as ScreenReceiverPeerLeftMessage;
        if (peerLeft.peerId === peerRef.current.publisherPeerId) {
          peerRef.current.publisherPeerId = undefined;
          appendLog(`publisher left: ${peerLeft.peerId}`);
        }
        return;
      }

      if (message.type === 'error') {
        appendLog(`server error: ${String(message.reason ?? 'unknown')}`);
      }
    };

    pc.ontrack = (event) => {
      const receivedStream = event.streams[0];
      if (receivedStream) {
        setStream(receivedStream);
        appendLog('track received');
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      ws.send(
        JSON.stringify({
          type: 'ice',
          candidate: event.candidate,
          targetPeerId: peerRef.current.publisherPeerId,
        }),
      );
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState || 'new';
      setConnectionState(state);
      appendLog(`pc state: ${state}`);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState || 'new';
      setIceConnectionState(state);
      appendLog(`ice state: ${state}`);
    };
  }, [appendLog, disconnect, iceServers, roomId, wsUrl]);

  useEffect(() => () => disconnect(), [disconnect]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return useMemo(
    () => ({
      connect,
      disconnect,
      clearLogs,
      logs,
      isConnected,
      connectionState,
      iceConnectionState,
      videoRef,
      stream,
    }),
    [clearLogs, connect, connectionState, disconnect, iceConnectionState, isConnected, logs, stream],
  );
}
