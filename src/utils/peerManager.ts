import Peer, { DataConnection } from 'peerjs';
import {
  ONLINE_HEARTBEAT_INTERVAL_MS,
  ONLINE_HEARTBEAT_TIMEOUT_MS,
  PEER_CONFIG,
  PEER_ID_PREFIX,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from '../config/peerConfig';
import { GuestAction, OnlineGameSnapshot, PeerMessage } from '../types/game';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export interface HostTransportCallbacks {
  onReady: (roomCode: string) => void;
  onError: (message: string) => void;
  onGuestHello: (payload: Extract<PeerMessage, { type: 'HELLO' }>) => {
    accepted: boolean;
    errorReason?: string;
  };
  onGuestAction: (sessionId: string, action: GuestAction) => void;
  onGuestDisconnect: (sessionId: string) => void;
}

export class OnlineHostTransport {
  private peer: Peer | null = null;
  private connections = new Map<string, { conn: DataConnection; lastSeen: number }>();
  private connToSession = new Map<DataConnection, string>();
  private heartbeatTimer: number | null = null;
  private callbacks: HostTransportCallbacks;
  private destroyed = false;
  private attempts = 0;
  public roomCode = '';

  constructor(callbacks: HostTransportCallbacks) {
    this.callbacks = callbacks;
  }

  public start(initialCode?: string) {
    this.destroyed = false;
    this.attempts = 0;
    this.openPeerWithCode(initialCode || generateRoomCode());
  }

  private openPeerWithCode(code: string) {
    if (this.destroyed) return;
    this.roomCode = code;
    const peerId = `${PEER_ID_PREFIX}${code}`;
    const peer = new Peer(peerId, PEER_CONFIG);
    this.peer = peer;

    peer.on('open', () => {
      if (this.destroyed) {
        peer.destroy();
        return;
      }
      this.startHeartbeat();
      this.callbacks.onReady(code);
    });

    peer.on('connection', (conn) => {
      if (this.destroyed) {
        conn.close();
        return;
      }
      this.attachConnection(conn);
    });

    peer.on('error', (err) => {
      if (this.destroyed) return;
      const errType = (err as { type?: string })?.type;
      if (errType === 'unavailable-id' && this.attempts < 5) {
        this.attempts += 1;
        peer.destroy();
        this.openPeerWithCode(generateRoomCode());
        return;
      }
      this.callbacks.onError(
        'Сигналинг серверімен байланыс орнату мүмкін болмады. Интернетті тексеріп қайта көріңіз.'
      );
    });
  }

  private attachConnection(conn: DataConnection) {
    conn.on('data', (raw) => {
      const msg = raw as PeerMessage;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'HELLO') {
        const res = this.callbacks.onGuestHello(msg);
        if (!res.accepted) {
          if (conn.open) {
            conn.send({
              type: 'ROOM_ERROR',
              reason: res.errorReason || 'Бөлмеге қосылу мүмкін емес.',
            } satisfies PeerMessage);
          }
          window.setTimeout(() => conn.close(), 150);
          return;
        }

        // Replace stale connection if same sessionId reconnected
        const prev = this.connections.get(msg.sessionId);
        if (prev && prev.conn !== conn) {
          this.connToSession.delete(prev.conn);
          try {
            prev.conn.close();
          } catch {
            // Ignore
          }
        }

        this.connections.set(msg.sessionId, { conn, lastSeen: Date.now() });
        this.connToSession.set(conn, msg.sessionId);
        return;
      }

      const sessionId = this.connToSession.get(conn);
      if (!sessionId) return;

      const entry = this.connections.get(sessionId);
      if (entry) {
        entry.lastSeen = Date.now();
      }

      if (msg.type === 'PING') {
        if (conn.open) {
          conn.send({ type: 'PONG', ts: msg.ts } satisfies PeerMessage);
        }
      } else if (msg.type === 'ACTION') {
        if (msg.sessionId === sessionId) {
          this.callbacks.onGuestAction(sessionId, msg.action);
        }
      }
    });

    const handleDrop = () => {
      const sessionId = this.connToSession.get(conn);
      this.connToSession.delete(conn);
      if (sessionId) {
        const current = this.connections.get(sessionId);
        if (current && current.conn === conn) {
          this.connections.delete(sessionId);
          if (!this.destroyed) {
            this.callbacks.onGuestDisconnect(sessionId);
          }
        }
      }
    };

    conn.on('close', handleDrop);
    conn.on('error', handleDrop);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      const now = Date.now();
      for (const [sessionId, entry] of this.connections.entries()) {
        if (now - entry.lastSeen > ONLINE_HEARTBEAT_TIMEOUT_MS) {
          this.connToSession.delete(entry.conn);
          this.connections.delete(sessionId);
          try {
            entry.conn.close();
          } catch {
            // Ignore
          }
          if (!this.destroyed) {
            this.callbacks.onGuestDisconnect(sessionId);
          }
          continue;
        }
        if (entry.conn.open) {
          try {
            entry.conn.send({ type: 'PING', ts: now } satisfies PeerMessage);
          } catch {
            // Ignore transient send error
          }
        }
      }
    }, ONLINE_HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public broadcastSnapshot(snapshot: OnlineGameSnapshot) {
    const payload: PeerMessage = { type: 'STATE_SYNC', snapshot };
    for (const entry of this.connections.values()) {
      if (entry.conn.open) {
        try {
          entry.conn.send(payload);
        } catch {
          // Ignore transient write errors
        }
      }
    }
  }

  public sendToSession(sessionId: string, msg: PeerMessage) {
    const entry = this.connections.get(sessionId);
    if (entry?.conn.open) {
      try {
        entry.conn.send(msg);
      } catch {
        // Ignore
      }
    }
  }

  public kickSession(sessionId: string, reason = 'Хост сізді бөлмеден шығарды.') {
    const entry = this.connections.get(sessionId);
    if (!entry) return;
    if (entry.conn.open) {
      try {
        entry.conn.send({ type: 'KICKED', reason } satisfies PeerMessage);
      } catch {
        // Ignore
      }
    }
    this.connToSession.delete(entry.conn);
    this.connections.delete(sessionId);
    window.setTimeout(() => {
      try {
        entry.conn.close();
      } catch {
        // Ignore
      }
    }, 120);
  }

  public destroy() {
    this.destroyed = true;
    this.stopHeartbeat();
    for (const entry of this.connections.values()) {
      if (entry.conn.open) {
        try {
          entry.conn.send({ type: 'HOST_CLOSED' } satisfies PeerMessage);
        } catch {
          // Ignore
        }
      }
      try {
        entry.conn.close();
      } catch {
        // Ignore
      }
    }
    this.connections.clear();
    this.connToSession.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignore
      }
      this.peer = null;
    }
  }
}

export interface GuestTransportCallbacks {
  onConnected: () => void;
  onSnapshot: (snapshot: OnlineGameSnapshot) => void;
  onError: (reason: string) => void;
  onHostDisconnected: () => void;
  onKicked: (reason: string) => void;
}

export class OnlineGuestTransport {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private heartbeatTimer: number | null = null;
  private connectTimeoutTimer: number | null = null;
  private lastSeen = 0;
  private destroyed = false;
  private callbacks: GuestTransportCallbacks;

  constructor(callbacks: GuestTransportCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(
    roomCode: string,
    helloPayload: Omit<Extract<PeerMessage, { type: 'HELLO' }>, 'type'>
  ) {
    this.destroyed = false;
    const cleanCode = normalizeRoomCode(roomCode);
    const targetPeerId = `${PEER_ID_PREFIX}${cleanCode}`;
    const peer = new Peer(PEER_CONFIG);
    this.peer = peer;

    let connectedOnce = false;

    this.connectTimeoutTimer = window.setTimeout(() => {
      if (!connectedOnce && !this.destroyed) {
        this.destroy(false);
        this.callbacks.onError(
          'Бөлме табылмады немесе қосылу уақыты бітті. Бөлме кодын тексеріңіз.'
        );
      }
    }, 14000);

    peer.on('open', () => {
      if (this.destroyed) return;
      const conn = peer.connect(targetPeerId, { reliable: true });
      this.conn = conn;

      conn.on('open', () => {
        if (this.destroyed) return;
        connectedOnce = true;
        if (this.connectTimeoutTimer !== null) {
          window.clearTimeout(this.connectTimeoutTimer);
          this.connectTimeoutTimer = null;
        }
        this.lastSeen = Date.now();
        this.startHeartbeat();
        conn.send({
          type: 'HELLO',
          ...helloPayload,
        } satisfies PeerMessage);
        this.callbacks.onConnected();
      });

      conn.on('data', (raw) => {
        const msg = raw as PeerMessage;
        if (!msg || typeof msg !== 'object') return;
        this.lastSeen = Date.now();

        if (msg.type === 'PING') {
          if (conn.open) {
            conn.send({ type: 'PONG', ts: msg.ts } satisfies PeerMessage);
          }
        } else if (msg.type === 'STATE_SYNC') {
          this.callbacks.onSnapshot(msg.snapshot);
        } else if (msg.type === 'ROOM_ERROR') {
          this.destroy(false);
          this.callbacks.onError(msg.reason);
        } else if (msg.type === 'KICKED') {
          this.destroy(false);
          this.callbacks.onKicked(msg.reason);
        } else if (msg.type === 'HOST_CLOSED') {
          this.destroy(false);
          this.callbacks.onHostDisconnected();
        }
      });

      const handleClose = () => {
        if (this.destroyed) return;
        this.destroy(false);
        if (!connectedOnce) {
          this.callbacks.onError('Бөлмеге қосылу мүмкін болмады.');
        } else {
          this.callbacks.onHostDisconnected();
        }
      };

      conn.on('close', handleClose);
      conn.on('error', handleClose);
    });

    peer.on('error', (err) => {
      if (this.destroyed) return;
      const errType = (err as { type?: string })?.type;
      this.destroy(false);
      if (errType === 'peer-unavailable') {
        this.callbacks.onError('Мұндай коды бар бөлме табылмады.');
      } else if (!connectedOnce) {
        this.callbacks.onError('Желіге қосылу кезінде қате шықты. Қайта көріңіз.');
      } else {
        this.callbacks.onHostDisconnected();
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      const now = Date.now();
      if (now - this.lastSeen > ONLINE_HEARTBEAT_TIMEOUT_MS) {
        this.destroy(false);
        this.callbacks.onHostDisconnected();
        return;
      }
      if (this.conn?.open) {
        try {
          this.conn.send({ type: 'PING', ts: now } satisfies PeerMessage);
        } catch {
          // Ignore
        }
      }
    }, ONLINE_HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public sendAction(sessionId: string, action: GuestAction) {
    if (this.conn?.open) {
      this.conn.send({ type: 'ACTION', sessionId, action } satisfies PeerMessage);
    }
  }

  public destroy(markDestroyed = true) {
    if (markDestroyed) {
      this.destroyed = true;
    }
    if (this.connectTimeoutTimer !== null) {
      window.clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = null;
    }
    this.stopHeartbeat();
    if (this.conn) {
      try {
        this.conn.close();
      } catch {
        // Ignore
      }
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignore
      }
      this.peer = null;
    }
  }
}
