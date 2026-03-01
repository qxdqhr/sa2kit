export type ScreenReceiverRole = 'viewer' | 'broadcaster';

export type ScreenReceiverSignalType = 'offer' | 'answer' | 'ice';

export interface ScreenReceiverJoinMessage {
  type: 'join';
  roomId: string;
  role?: ScreenReceiverRole;
  peerId?: string;
}

export interface ScreenReceiverSignalMessage {
  type: ScreenReceiverSignalType;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  targetPeerId?: string;
}

export type ScreenReceiverIncomingMessage =
  | ScreenReceiverJoinMessage
  | ScreenReceiverSignalMessage
  | Record<string, unknown>;

export interface ScreenReceiverJoinedMessage {
  type: 'joined';
  roomId: string;
  peerId: string;
  role: ScreenReceiverRole;
}

export interface ScreenReceiverPeerJoinedMessage {
  type: 'peer_joined';
  roomId: string;
  peerId: string;
  role: ScreenReceiverRole;
}

export interface ScreenReceiverPeerLeftMessage {
  type: 'peer_left';
  roomId: string;
  peerId: string;
}

export interface ScreenReceiverRoomStateMessage {
  type: 'room_state';
  roomId: string;
  peers: Array<{
    peerId: string;
    role: ScreenReceiverRole;
  }>;
}

export interface ScreenReceiverErrorMessage {
  type: 'error';
  reason: string;
}
