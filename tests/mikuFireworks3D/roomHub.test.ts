import { describe, expect, it } from 'vitest';

import { FireworksRoomHub } from '../../src/mikuFireworks3D/server/FireworksRoomHub';
import type { FireworksServerMessage } from '../../src/mikuFireworks3D/server/types';

function createClient(hub: FireworksRoomHub, id: string) {
  const inbox: FireworksServerMessage[] = [];
  const connection = hub.connect(
    {
      send: (encoded) => {
        inbox.push(JSON.parse(encoded) as FireworksServerMessage);
      },
    },
    id
  );

  return {
    inbox,
    connection,
    send: (message: unknown) => connection.handleMessage(JSON.stringify(message)),
  };
}

describe('FireworksRoomHub', () => {
  it('broadcasts user join events inside same room', () => {
    const hub = new FireworksRoomHub();
    const c1 = createClient(hub, 'c1');
    const c2 = createClient(hub, 'c2');

    c1.send({ type: 'join', roomId: 'room-a', user: { userId: 'u1', nickname: 'A' } });
    c2.send({ type: 'join', roomId: 'room-a', user: { userId: 'u2', nickname: 'B' } });

    const joinedNotice = c1.inbox.find((m) => m.type === 'room.user_joined');
    expect(joinedNotice?.type).toBe('room.user_joined');
    if (joinedNotice?.type === 'room.user_joined') {
      expect(joinedNotice.user.userId).toBe('u2');
      expect(joinedNotice.onlineCount).toBe(2);
    }
  });

  it('broadcasts danmaku with sender identity', () => {
    const hub = new FireworksRoomHub();
    const c1 = createClient(hub, 'c1');
    const c2 = createClient(hub, 'c2');

    c1.send({ type: 'join', roomId: 'room-b', user: { userId: 'u1' } });
    c2.send({ type: 'join', roomId: 'room-b', user: { userId: 'u2' } });

    c1.send({ type: 'danmaku.send', payload: { text: 'hello room' } });

    const danmakuMessage = c2.inbox.find((m) => m.type === 'danmaku.broadcast');
    expect(danmakuMessage?.type).toBe('danmaku.broadcast');
    if (danmakuMessage?.type === 'danmaku.broadcast') {
      expect(danmakuMessage.event.text).toBe('hello room');
      expect(danmakuMessage.event.user.userId).toBe('u1');
      expect(danmakuMessage.roomId).toBe('room-b');
    }
  });

  it('stores history and returns room snapshot to late joiner', () => {
    const hub = new FireworksRoomHub({ historyLimit: 10 });
    const c1 = createClient(hub, 'c1');

    c1.send({ type: 'join', roomId: 'room-c', user: { userId: 'u1' } });
    c1.send({ type: 'danmaku.send', payload: { text: 'first' } });
    c1.send({ type: 'firework.launch', payload: { kind: 'miku' } });

    const c2 = createClient(hub, 'c2');
    c2.send({ type: 'join', roomId: 'room-c', user: { userId: 'u2' } });

    const snapshot = c2.inbox.find((m) => m.type === 'room.snapshot');
    expect(snapshot?.type).toBe('room.snapshot');
    if (snapshot?.type === 'room.snapshot') {
      expect(snapshot.users.length).toBe(2);
      expect(snapshot.danmakuHistory.length).toBe(1);
      expect(snapshot.fireworkHistory.length).toBe(1);
      expect(snapshot.fireworkHistory[0]?.payload.kind).toBe('miku');
    }
  });
});
