import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebSocketTransport } from '../../src/mikuFireworks3D/client/WebSocketTransport';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;

  readonly url: string;
  readonly protocols?: string | string[];
  readyState = MockWebSocket.CONNECTING;
  sent: string[] = [];

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  emitOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('WebSocketTransport', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    (window as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;
  });

  it('sends join payload on open', () => {
    const transport = new WebSocketTransport({
      serverUrl: 'ws://localhost:8080',
      roomId: 'room-1',
      user: { userId: 'u1' },
    });

    transport.connect();
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeTruthy();

    socket?.emitOpen();

    expect(socket?.sent.length).toBe(1);
    expect(socket?.sent[0]).toContain('"type":"join"');
    expect(socket?.sent[0]).toContain('"roomId":"room-1"');
  });

  it('forwards danmaku broadcast to callback', () => {
    const onDanmaku = vi.fn();

    const transport = new WebSocketTransport(
      {
        serverUrl: 'ws://localhost:8080',
        roomId: 'room-1',
        user: { userId: 'u1' },
      },
      {
        onDanmakuBroadcast: onDanmaku,
      }
    );

    transport.connect();
    const socket = MockWebSocket.instances[0];
    socket?.emitOpen();
    socket?.emitMessage({
      type: 'danmaku.broadcast',
      roomId: 'room-1',
      event: {
        id: 'd1',
        roomId: 'room-1',
        text: 'hello',
        user: { userId: 'u2' },
        timestamp: Date.now(),
      },
    });

    expect(onDanmaku).toHaveBeenCalledTimes(1);
    expect(onDanmaku.mock.calls[0]?.[0]?.text).toBe('hello');
  });

  it('sends danmaku and firework payload when connected', () => {
    const transport = new WebSocketTransport({
      serverUrl: 'ws://localhost:8080',
      roomId: 'room-1',
      user: { userId: 'u1' },
    });

    transport.connect();
    const socket = MockWebSocket.instances[0];
    socket?.emitOpen();

    transport.sendDanmaku({ text: 'miku', kind: 'miku' });
    transport.sendFirework({ kind: 'miku' });

    expect(socket?.sent.length).toBe(3);
    expect(socket?.sent[1]).toContain('"type":"danmaku.send"');
    expect(socket?.sent[2]).toContain('"type":"firework.launch"');
  });
});
