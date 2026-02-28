import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const app = new Hono();
const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);

const distIndex = join(__dirname, 'dist', 'index.html');

app.get('/', (c) => c.text('Hono receiver server running. Open /receiver'));
app.get('/receiver', (c) => {
  if (existsSync(distIndex)) {
    return c.html(readFileSync(distIndex, 'utf-8'));
  }
  return c.text('Receiver UI not built yet. Run `pnpm run dev` for Vite dev UI or `pnpm run build` for production.');
});

const server = serve({ fetch: app.fetch, port });

const wss = new WebSocketServer({ server });
const rooms = new Map<string, Set<WebSocket>>();

function joinRoom(ws: WebSocket, roomId: string) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId)!.add(ws);
  (ws as any).roomId = roomId;
}

function leaveRoom(ws: WebSocket) {
  const roomId = (ws as any).roomId as string | undefined;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  room.delete(ws);
  if (room.size === 0) rooms.delete(roomId);
}

function broadcast(roomId: string, from: WebSocket, payload: unknown) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const client of room) {
    if (client !== from && client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', reason: 'invalid_json' }));
      return;
    }

    if (msg.type === 'join') {
      if (!msg.roomId) {
        ws.send(JSON.stringify({ type: 'error', reason: 'missing_room_id' }));
        return;
      }
      joinRoom(ws, msg.roomId);
      ws.send(JSON.stringify({ type: 'joined', roomId: msg.roomId }));
      return;
    }

    if (!(ws as any).roomId) {
      ws.send(JSON.stringify({ type: 'error', reason: 'join_first' }));
      return;
    }

    if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice') {
      broadcast((ws as any).roomId, ws, msg);
      return;
    }

    ws.send(JSON.stringify({ type: 'error', reason: 'unknown_type' }));
  });

  ws.on('close', () => leaveRoom(ws));
  ws.on('error', () => leaveRoom(ws));
});

console.log(`Hono receiver server listening on http://127.0.0.1:${port}`);
console.log(`Receiver page: http://127.0.0.1:${port}/receiver`);
