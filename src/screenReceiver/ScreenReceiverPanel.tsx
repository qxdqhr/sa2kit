import React, { useMemo, useState } from 'react';
import { useScreenReceiver } from './useScreenReceiver';

export interface ScreenReceiverPanelProps {
  defaultSignalUrl?: string;
  defaultRoomId?: string;
  className?: string;
}

const DEFAULT_SIGNAL_URL = 'ws://127.0.0.1:8787/ws';
const DEFAULT_ROOM_ID = 'screen-room-1';

export function ScreenReceiverPanel(props: ScreenReceiverPanelProps) {
  const { defaultSignalUrl = DEFAULT_SIGNAL_URL, defaultRoomId = DEFAULT_ROOM_ID, className } = props;
  const [wsUrl, setWsUrl] = useState(defaultSignalUrl);
  const [roomId, setRoomId] = useState(defaultRoomId);
  const receiver = useScreenReceiver({ wsUrl, roomId });
  const logs = useMemo(() => receiver.logs.map((entry) => entry.text).join('\n'), [receiver.logs]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
          <label className="flex flex-col gap-1 text-sm">
            <span>Signaling WS</span>
            <input
              className="rounded-md border px-3 py-2"
              value={wsUrl}
              onChange={(event) => setWsUrl(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Room</span>
            <input
              className="rounded-md border px-3 py-2"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={() => void receiver.connect()}
              className="rounded-md border bg-black px-4 py-2 text-sm text-white"
            >
              {receiver.isConnected ? 'Reconnect' : 'Connect'}
            </button>
            <button
              onClick={receiver.disconnect}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatusItem label="WebSocket" value={receiver.isConnected ? 'connected' : 'idle'} />
          <StatusItem label="PeerConnection" value={receiver.connectionState} />
          <StatusItem label="ICE State" value={receiver.iceConnectionState} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-xl border bg-black p-3">
            <video
              ref={receiver.videoRef}
              autoPlay
              playsInline
              controls
              muted
              className="h-[360px] w-full rounded-lg bg-black"
            />
          </div>
          <div className="rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Session Log</p>
              <button
                onClick={receiver.clearLogs}
                className="text-xs underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </div>
            <pre className="mt-3 h-[320px] overflow-auto rounded-lg border bg-slate-50 p-3 text-xs">
              {logs || 'No logs yet.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
