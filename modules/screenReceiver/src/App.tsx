import { useMemo, useRef, useState } from 'react';

type LogEntry = { id: number; text: string };

type PeerState = {
  ws?: WebSocket;
  pc?: RTCPeerConnection;
  pending: RTCIceCandidateInit[];
};

const defaultSignal = 'ws://127.0.0.1:8787';

export default function App() {
  const [wsUrl, setWsUrl] = useState(defaultSignal);
  const [roomId, setRoomId] = useState('ktv-room-1');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [iceState, setIceState] = useState('idle');
  const [connectionState, setConnectionState] = useState('idle');
  const [connected, setConnected] = useState(false);
  const counterRef = useRef(0);
  const peerRef = useRef<PeerState>({ pending: [] });
  const videoRef = useRef<HTMLVideoElement>(null);

  const log = (text: string) => {
    counterRef.current += 1;
    setLogs((prev) => [...prev, { id: counterRef.current, text }].slice(-80));
  };

  const resetPeer = () => {
    peerRef.current.ws?.close();
    peerRef.current.pc?.close();
    peerRef.current = { pending: [] };
    setConnected(false);
    setIceState('idle');
    setConnectionState('idle');
  };

  const start = async () => {
    resetPeer();

    const ws = new WebSocket(wsUrl);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pc.addTransceiver('video', { direction: 'recvonly' });

    peerRef.current.ws = ws;
    peerRef.current.pc = pc;

    ws.onopen = () => {
      log('ws connected');
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', roomId, role: 'viewer' }));
    };
    ws.onclose = () => {
      log('ws closed');
      setConnected(false);
    };
    ws.onerror = (evt) => {
      log(`ws error: ${evt.type}`);
    };

    pc.ontrack = (event) => {
      log('track received');
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'ice', candidate: event.candidate }));
        log('ice sent');
      }
    };
    pc.oniceconnectionstatechange = () => {
      setIceState(pc.iceConnectionState || 'unknown');
      log(`ice state: ${pc.iceConnectionState}`);
    };
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState || 'unknown');
      log(`pc state: ${pc.connectionState}`);
    };

    ws.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'offer') {
          log('offer received');
          await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
          for (const c of peerRef.current.pending) {
            try {
              await pc.addIceCandidate(c);
            } catch (e) {
              log(`ice err: ${String(e)}`);
            }
          }
          peerRef.current.pending = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
          log('answer sent');
          return;
        }
        if (msg.type === 'ice' && msg.candidate) {
          if (!pc.remoteDescription) {
            peerRef.current.pending.push(msg.candidate);
            return;
          }
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch (e) {
            log(`ice err: ${String(e)}`);
          }
        }
      } catch (e) {
        log(`ws message error: ${String(e)}`);
      }
    };
  };

  const logText = useMemo(() => logs.map((l) => l.text).join('\n'), [logs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist via-white to-breeze">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate">WebRTC Receiver</p>
          <h1 className="text-3xl font-semibold text-ink">Mirror Dashboard</h1>
          <p className="text-sm text-slate">
            Connect to your signaling server and receive the Android screen stream.
          </p>
        </header>

        <section className="rounded-2xl border border-tide bg-white/80 p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate">Signaling WS</label>
                <input
                  className="rounded-xl border border-tide bg-white px-4 py-2 text-sm"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate">Room</label>
                <input
                  className="rounded-xl border border-tide bg-white px-4 py-2 text-sm"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={start}
                  className="w-full rounded-xl bg-wave px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                >
                  {connected ? 'Reconnect' : 'Connect'}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-tide bg-white px-4 py-3">
                <p className="text-xs text-slate">WebSocket</p>
                <p className="text-sm font-semibold text-ink">{connected ? 'connected' : 'idle'}</p>
              </div>
              <div className="rounded-xl border border-tide bg-white px-4 py-3">
                <p className="text-xs text-slate">PeerConnection</p>
                <p className="text-sm font-semibold text-ink">{connectionState}</p>
              </div>
              <div className="rounded-xl border border-tide bg-white px-4 py-3">
                <p className="text-xs text-slate">ICE State</p>
                <p className="text-sm font-semibold text-ink">{iceState}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-2xl border border-tide bg-black/90 p-4">
            <video ref={videoRef} autoPlay playsInline controls muted className="h-[360px] w-full rounded-xl bg-black" />
          </div>
          <div className="rounded-2xl border border-tide bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Session Log</h2>
              <button
                onClick={() => setLogs([])}
                className="text-xs font-semibold text-slate hover:text-ink"
              >
                Clear
              </button>
            </div>
            <pre className="mt-3 h-[320px] overflow-auto rounded-xl bg-white px-4 py-3 text-xs text-slate shadow-inner">
              {logText || 'No logs yet.'}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
