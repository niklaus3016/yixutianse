import { Artwork, UserSettings } from '../types';

const STORAGE_KEYS = {
  ARTWORKS: 'yixu_artworks_v1',
  SETTINGS: 'yixu_settings_v1',
  FAVORITES: 'yixu_fav_colors_v1',
  ACTIVE_DRAFT: 'yixu_active_draft_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  paperColor: '#FAF7F2',
  soundEnabled: true,
  hapticEnabled: true,
  defaultBrushSize: 18,
  defaultBrushType: 'fill',
  autoSaveInterval: 3,
  showTouchIndicator: true,
  completedOnboarding: false,
  firstLaunch: true,
  agreementAccepted: false,
  agreementVersion: '',
};

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed, theme: 'dark' };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to localStorage:', err);
  }
}

export function getStoredArtworks(): Artwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARTWORKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load artworks:', err);
  }
  return [];
}

export function saveArtwork(artwork: Artwork): void {
  try {
    const artworks = getStoredArtworks();
    const existingIndex = artworks.findIndex(a => a.id === artwork.id);
    if (existingIndex >= 0) {
      artworks[existingIndex] = artwork;
    } else {
      artworks.unshift(artwork);
    }
    localStorage.setItem(STORAGE_KEYS.ARTWORKS, JSON.stringify(artworks));
  } catch (err) {
    console.warn('Storage quota exceeded or error saving artwork:', err);
  }
}

export function deleteArtwork(id: string): void {
  try {
    const artworks = getStoredArtworks().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ARTWORKS, JSON.stringify(artworks));
  } catch {}
}

export const deleteStoredArtwork = deleteArtwork;

export function getFavoriteColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['#4BA3A8', '#E76F51', '#F4A261', '#2A9D8F', '#E9C46A', '#9A8C98'];
}

export function saveFavoriteColors(colors: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(colors));
  } catch {}
}

export function getActiveDraft(): Artwork | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveActiveDraft(draft: Artwork): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, JSON.stringify(draft));
  } catch {}
}

export function clearActiveDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
  } catch {}
}

// Storage usage estimation
export function getStorageStats(): { usedBytes: number; usedFormatted: string; count: number } {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key) || '';
      total += (key.length + val.length) * 2; // UTF-16 approx
    }
  }

  const artworks = getStoredArtworks();
  const mb = total / (1024 * 1024);
  const formatted = mb >= 1 ? `${mb.toFixed(2)} MB` : `${(total / 1024).toFixed(1)} KB`;

  return {
    usedBytes: total,
    usedFormatted: formatted,
    count: artworks.length,
  };
}

export function clearAllAppData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ARTWORKS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
  } catch {}
}
