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
