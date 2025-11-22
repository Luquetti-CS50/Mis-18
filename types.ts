export interface User {
  id: string;
  name: string;
  normalizedName: string;
  groupName?: string; // e.g., "Familia", "Colegio"
  tableId?: string | null;
  musicComment?: string;
  isAdmin?: boolean;
  hasLoggedIn?: boolean;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  platform: 'spotify' | 'youtube';
  thumbnailUrl: string;
  suggestedByUserId: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl?: string;
  isTaken: boolean;
  takenByUserId?: string;
}

export interface MusicPreference {
  id: string;
  userId: string;
  genre: string;
}

export interface MusicGenreCount {
  name: string;
  value: number;
}