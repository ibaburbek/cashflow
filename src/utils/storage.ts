import { SavedGameState, ThemeMode } from '../types/game';

const GAME_STORAGE_KEY = 'qarjy_agyny_save_v1';
const THEME_STORAGE_KEY = 'qarjy_agyny_theme_v1';
const SOUND_STORAGE_KEY = 'qarjy_agyny_sound_v1';

export function saveGameState(state: SavedGameState): void {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadGameState(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    if (!parsed || !Array.isArray(parsed.players) || parsed.players.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function loadThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemeMode(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore
  }
}

export function loadSoundSetting(): boolean {
  try {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved === 'false') return false;
  } catch {
    // Ignore
  }
  return true;
}

export function saveSoundSetting(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore
  }
}

const SESSION_ID_KEY = 'qarjy_agyny_session_id_v1';
const ONLINE_PROFILE_KEY = 'qarjy_agyny_online_profile_v1';

export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.length >= 6) return existing;
    const created = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export interface StoredOnlineProfile {
  name: string;
  professionId: string;
  dreamId: string;
  color: string;
}

export function saveOnlineProfile(profile: StoredOnlineProfile): void {
  try {
    localStorage.setItem(ONLINE_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export function loadOnlineProfile(): StoredOnlineProfile | null {
  try {
    const raw = localStorage.getItem(ONLINE_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredOnlineProfile;
  } catch {
    return null;
  }
}

