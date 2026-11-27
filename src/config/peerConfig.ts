import type { PeerOptions } from 'peerjs';

/**
 * PeerJS (WebRTC) сервер мен ICE конфигурациясы.
 * Сигналинг серверін немесе TURN серверін ауыстыру үшін осы файлды өзгертіңіз.
 */
export const PEER_CONFIG: PeerOptions = {
  // Әдепкі тегін PeerJS бұлттық сигналинг сервері (0.peerjs.com)
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // Қажет болса, TURN серверін осы жерге қосыңыз:
      // {
      //   urls: 'turn:your-turn-server.example.com:3478',
      //   username: 'user',
      //   credential: 'password',
      // },
    ],
  },
};

export const ROOM_CODE_LENGTH = 5;
// Шатастыратын 0/O және 1/I таңбаларынсыз әліпби
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PEER_ID_PREFIX = 'qarjy-agyny-room-';

export const ONLINE_HEARTBEAT_INTERVAL_MS = 4000;
export const ONLINE_HEARTBEAT_TIMEOUT_MS = 12000;
export const OFFLINE_TURN_WAIT_SECONDS = 30;
