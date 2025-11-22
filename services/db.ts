import { User, Table, Song, WishlistItem, MusicPreference } from '../types';

// Helper for normalization
export const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export const VALID_GENRES = [
  'cumbia', 'rkt', 'reggaeton', 'trap', 'rock', 'pop', 'electronica', 
  'techno', 'house', 'cuarteto', 'salsa', 'bachata', 'hip hop', 'rap', 
  'indie', 'metal', 'jazz', 'clasica', 'disco', 'funk'
];

// --- SEED DATA ---

const SEED_USERS: User[] = [
  // Req 16: Admin Luca Verón confirmado
  { id: 'u1', name: 'Luca Verón', normalizedName: 'luca veron', isAdmin: true },
  { id: 'u2', name: 'María Gómez', normalizedName: 'maria gomez' },
  { id: 'u3', name: 'Carlos López', normalizedName: 'carlos lopez' },
  { id: 'u4', name: 'Ana Torres', normalizedName: 'ana torres' },
  { id: 'u5', name: 'Pedro Ruiz', normalizedName: 'pedro ruiz' },
  { id: 'u6', name: 'Sofía Diaz', normalizedName: 'sofia diaz' },
  { id: 'u7', name: 'Lucas M', normalizedName: 'lucas m' },
  { id: 'u8', name: 'Valentina R', normalizedName: 'valentina r' },
  { id: 'u9', name: 'Admin User', normalizedName: 'admin', isAdmin: true }, 
];

const SEED_TABLES: Table[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `t${i + 1}`,
  name: `Mesa ${i + 1}`,
  capacity: 10,
}));

const SEED_WISHLIST: WishlistItem[] = [
  { id: 'w1', name: 'Auriculares Sony', imageUrl: 'https://picsum.photos/200/200?random=1', isTaken: false },
  { id: 'w2', name: 'Gift Card Zara', imageUrl: 'https://picsum.photos/200/200?random=2', isTaken: false },
  { id: 'w3', name: 'Entrada Concierto', imageUrl: 'https://picsum.photos/200/200?random=3', isTaken: false },
  { id: 'w4', name: 'Zapatillas Nike', imageUrl: 'https://picsum.photos/200/200?random=4', isTaken: true, takenByUserId: 'u2' }, 
  { id: 'w5', name: 'Libro de Diseño', imageUrl: 'https://picsum.photos/200/200?random=5', isTaken: false },
  { id: 'w6', name: 'Cámara Instax', imageUrl: 'https://picsum.photos/200/200?random=6', isTaken: false },
];

// --- MOCK SEARCH DATABASE (Req Musica) ---
// Esto simula lo que devolvería la API de Spotify/YouTube
const MOCK_SONGS_DB: Partial<Song>[] = [
  { title: "Monaco", artist: "Bad Bunny", platform: "spotify", thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b2731374a015769994df669784ba", platformUrl: "https://open.spotify.com/track/4MjDJD8cW7lT3yZP8i8Z80" },
  { title: "Perro Negro", artist: "Bad Bunny, Feid", platform: "spotify", thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b2731374a015769994df669784ba", platformUrl: "https://open.spotify.com/track/0J5D8cW7lT3yZP8i8Z80" },
  { title: "Givenchy", artist: "Duki", platform: "youtube", thumbnailUrl: "https://i.ytimg.com/vi/4MjDJD8cW7l/hqdefault.jpg", platformUrl: "https://www.youtube.com/watch?v=4MjDJD8cW7l" },
  { title: "She Don't Give a FO", artist: "Duki, Khea", platform: "spotify", thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b2731374a015769994df669784ba", platformUrl: "https://open.spotify.com/track/0J5D8cW7lT3yZP8i8Z80" },
  { title: "Yellow", artist: "Coldplay", platform: "spotify", thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b2731374a015769994df669784ba", platformUrl: "https://open.spotify.com/track/3AJwUDP9IPFXyF5gR5CO0" },
  { title: "Viva La Vida", artist: "Coldplay", platform: "spotify", thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b2731374a015769994df669784ba", platformUrl: "https://open.spotify.com/track/3AJwUDP9IPFXyF5gR5CO0" },
  { title: "Lala", artist: "Myke Towers", platform: "spotify", thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b2731374a015769994df669784ba", platformUrl: "https://open.spotify.com/track/3AJwUDP9IPFXyF5gR5CO0" },
];


class MockDB {
  private load<T>(key: string, seed: T): T {
    const stored = localStorage.getItem(`my18app_${key}`);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(`my18app_${key}`, JSON.stringify(seed));
    return seed;
  }

  private save(key: string, data: any) {
    localStorage.setItem(`my18app_${key}`, JSON.stringify(data));
    window.dispatchEvent(new Event(`db_update_${key}`));
  }

  getUsers(): User[] { return this.load('users', SEED_USERS); }
  
  login(name: string): User | null {
    const users = this.getUsers();
    const normalized = normalizeName(name);
    const user = users.find(u => u.normalizedName === normalized);
    if (user) {
      if (!user.hasLoggedIn) {
        user.hasLoggedIn = true;
        this.updateUser(user);
      }
      return user;
    }
    return null;
  }

  updateUser(updatedUser: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.save('users', users);
    }
  }

  getTables(): Table[] { return this.load('tables', SEED_TABLES); }
  
  getSongs(): Song[] { return this.load('songs', []); }
  
  // Función para buscar canciones (simula API real)
  async searchSongs(query: string): Promise<Song[]> {
    // AQUÍ IRÍA LA LLAMADA A LA API DE YOUTUBE / SPOTIFY
    // Ej: const res = await fetch(`https://api.spotify.com/search?q=${query}...`)
    
    return new Promise((resolve) => {
      const q = query.toLowerCase();
      
      // Filtramos la DB mockeada
      const results = MOCK_SONGS_DB.filter(s => 
        s.title?.toLowerCase().includes(q) || 
        s.artist?.toLowerCase().includes(q)
      );

      // Convertimos al formato Song completo
      const songs: Song[] = results.map((r, i) => ({
        id: `search_${Date.now()}_${i}`,
        title: r.title!,
        artist: r.artist!,
        platform: r.platform || 'spotify',
        thumbnailUrl: r.thumbnailUrl || 'https://via.placeholder.com/100',
        platformUrl: r.platformUrl,
        suggestedByUserId: '' // Se llena al guardar
      }));

      resolve(songs);
    });
  }

  addSong(song: Song) {
    const songs = this.getSongs();
    if (!songs.find(s => 
      s.title.toLowerCase() === song.title.toLowerCase() && 
      s.artist.toLowerCase() === song.artist.toLowerCase())) {
      songs.push(song);
      this.save('songs', songs);
    }
  }

  getPreferences(): MusicPreference[] { return this.load('prefs', []); }
  addPreference(pref: MusicPreference) {
    const prefs = this.getPreferences();
    prefs.push(pref);
    this.save('prefs', prefs);
  }
  removePreference(id: string) {
    const prefs = this.getPreferences().filter(p => p.id !== id);
    this.save('prefs', prefs);
  }

  getWishlist(): WishlistItem[] { return this.load('wishlist', SEED_WISHLIST); }
  toggleWishlistItem(itemId: string, userId: string) {
    const items = this.getWishlist();
    const item = items.find(i => i.id === itemId);
    if (item) {
      if (item.isTaken && item.takenByUserId === userId) {
        item.isTaken = false;
        item.takenByUserId = undefined;
      } else if (!item.isTaken) {
        item.isTaken = true;
        item.takenByUserId = userId;
      }
      this.save('wishlist', items);
    }
  }
}

export const db = new MockDB();