import { User, Table, Song, WishlistItem, MusicPreference } from '../types';

// Helper for normalization
export const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// --- SEED DATA ---

const SEED_USERS: User[] = [
  { id: 'u1', name: 'Juan Pérez', normalizedName: 'juan perez', groupName: 'Colegio', isAdmin: true },
  { id: 'u2', name: 'María Gómez', normalizedName: 'maria gomez', groupName: 'Familia' },
  { id: 'u3', name: 'Carlos López', normalizedName: 'carlos lopez', groupName: 'Amigos' },
  { id: 'u4', name: 'Ana Torres', normalizedName: 'ana torres', groupName: 'Colegio' },
  { id: 'u5', name: 'Pedro Ruiz', normalizedName: 'pedro ruiz', groupName: 'Familia' },
  { id: 'u6', name: 'Sofía Diaz', normalizedName: 'sofia diaz', groupName: 'Amigos' },
  { id: 'u7', name: 'Lucas M', normalizedName: 'lucas m', groupName: 'Colegio' },
  { id: 'u8', name: 'Valentina R', normalizedName: 'valentina r', groupName: 'Amigos' },
  { id: 'u9', name: 'Admin User', normalizedName: 'admin', isAdmin: true },
];

const SEED_TABLES: Table[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `t${i + 1}`,
  name: `Mesa ${i + 1}`,
  capacity: 8,
}));

const SEED_WISHLIST: WishlistItem[] = [
  { id: 'w1', name: 'Auriculares Sony', imageUrl: 'https://picsum.photos/200/200?random=1', isTaken: false },
  { id: 'w2', name: 'Gift Card Zara', imageUrl: 'https://picsum.photos/200/200?random=2', isTaken: false },
  { id: 'w3', name: 'Entrada Concierto', imageUrl: 'https://picsum.photos/200/200?random=3', isTaken: false },
  { id: 'w4', name: 'Zapatillas Nike', imageUrl: 'https://picsum.photos/200/200?random=4', isTaken: true, takenByUserId: 'u2' }, // Already taken example
  { id: 'w5', name: 'Libro de Diseño', imageUrl: 'https://picsum.photos/200/200?random=5', isTaken: false },
  { id: 'w6', name: 'Cámara Instax', imageUrl: 'https://picsum.photos/200/200?random=6', isTaken: false },
];

// --- MOCK API ---

class MockDB {
  private load<T>(key: string, seed: T): T {
    const stored = localStorage.getItem(`my18app_${key}`);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(`my18app_${key}`, JSON.stringify(seed));
    return seed;
  }

  private save(key: string, data: any) {
    localStorage.setItem(`my18app_${key}`, JSON.stringify(data));
    // Trigger a custom event so hooks can update
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
  addSong(song: Song) {
    const songs = this.getSongs();
    if (!songs.find(s => s.title === song.title && s.artist === song.artist)) {
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
        // Untake
        item.isTaken = false;
        item.takenByUserId = undefined;
      } else if (!item.isTaken) {
        // Take
        item.isTaken = true;
        item.takenByUserId = userId;
      }
      this.save('wishlist', items);
    }
  }
}

export const db = new MockDB();