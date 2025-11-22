import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Music, 
  Gift, 
  Disc, 
  Users, 
  LogOut, 
  Plus, 
  Check, 
  Lock, 
  Unlock,
  BarChart2,
  Search,
  PlayCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, Table, Song, WishlistItem, MusicPreference } from './types';
import { db, normalizeName } from './services/db';
import { NeonCard, NeonButton, Badge, PageTitle } from './components/UI';

// --- HOOKS FOR DATA SYNC ---
function useData<T>(getData: () => T, eventKey: string): T {
  const [data, setData] = useState<T>(getData());
  useEffect(() => {
    const handler = () => setData(getData());
    window.addEventListener(`db_update_${eventKey}`, handler);
    return () => window.removeEventListener(`db_update_${eventKey}`, handler);
  }, [getData, eventKey]);
  return data;
}

// --- COMPONENTS ---

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Inicio' },
    { path: '/music', icon: Music, label: 'Música' },
    { path: '/wishlist', icon: Gift, label: 'Regalos' },
    { path: '/tables', icon: Users, label: 'Mesas' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-[#333] z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-16 transition-all duration-300 ${
                isActive ? 'text-neon-blue scale-110' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <item.icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,198,255,0.8)]' : ''} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- SCREENS ---

// 1. LOGIN
const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const allUsers = useData(() => db.getUsers(), 'users');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setError('');
    
    if (val.length > 1) {
      const norm = normalizeName(val);
      const matches = allUsers
        .filter(u => normalizeName(u.name).includes(norm))
        .map(u => u.name)
        .slice(0, 3);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.login(name);
    if (user) {
      onLogin(user);
    } else {
      setError('Ups, no te encuentro en la lista de invitados 🧐');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-neon-blue opacity-5 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">MIS 18</h1>
          <div className="h-1 w-24 bg-neon-blue mx-auto rounded-full shadow-[0_0_15px_#00C6FF]" />
        </div>

        <NeonCard className="p-8">
          <h2 className="text-xl font-semibold text-white mb-1">¡Bienvenido!</h2>
          <p className="text-neon-text text-sm mb-6">Escribí tu nombre para entrar a la fiesta.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleInputChange}
                placeholder="Tu nombre completo..."
                className="w-full bg-[#111] border border-[#333] rounded-lg p-4 text-white focus:border-neon-blue focus:outline-none transition-colors placeholder-gray-600"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-[#333] mt-1 rounded-lg overflow-hidden z-20">
                  {suggestions.map(s => (
                    <div 
                      key={s} 
                      className="p-3 hover:bg-[#222] cursor-pointer text-gray-300"
                      onClick={() => { setName(s); setSuggestions([]); }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {error && <p className="text-red-500 text-sm mt-2 animate-pulse">{error}</p>}

            <NeonButton fullWidth onClick={() => {}}>
              INGRESAR
            </NeonButton>
          </form>
        </NeonCard>
      </div>
    </div>
  );
};

// 2. HOME
const HomeScreen = ({ user }: { user: User }) => {
  const confirmedUsers = useData(() => db.getUsers().filter(u => u.hasLoggedIn), 'users');
  const [showAllGuests, setShowAllGuests] = useState(false);

  // Pending tasks logic
  const pendingTasks = [];
  if (!user.musicComment) pendingTasks.push({ type: 'music', title: '🎵 DJ en proceso...', desc: '¡No nos dijiste qué música te gusta!', link: '/music' });
  if (!user.tableId) pendingTasks.push({ type: 'table', title: '🍽️ Tu lugar en la mesa', desc: 'Todavía no elegiste mesa.', link: '/tables' });

  const navigate = useNavigate();

  return (
    <div className="pb-24 pt-8 px-4">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white">Hola, <span className="text-neon-blue">{user.name.split(' ')[0]}</span> 👋</h1>
          <p className="text-neon-text mt-1">Faltan 15 días para la fiesta</p>
        </div>
      </header>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-2">Pendientes</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {pendingTasks.map((task) => (
              <div key={task.type} className="min-w-[85%] snap-center">
                <NeonCard onClick={() => navigate(task.link)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg">{task.title}</h3>
                    <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-400">{task.desc}</p>
                  <div className="mt-4 text-neon-blue text-sm font-bold flex items-center">
                    COMPLETAR AHORA →
                  </div>
                </NeonCard>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Rain Carousel */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Invitados Confirmados ({confirmedUsers.length})</h2>
          <button onClick={() => setShowAllGuests(true)} className="text-xs text-neon-blue border border-neon-blue px-2 py-1 rounded">VER TODOS</button>
        </div>
        
        <NeonCard onClick={() => setShowAllGuests(true)} className="h-48 relative overflow-hidden !bg-black">
            {/* Rain Effect Container */}
            <div className="absolute inset-0 overflow-hidden">
               {confirmedUsers.map((u, i) => {
                 const row = i % 4; // 4 rows
                 const duration = 15 + (i % 5) * 5; // Variable speeds
                 const delay = (i % 10) * -2;
                 return (
                   <div 
                      key={u.id}
                      className="absolute whitespace-nowrap text-sm text-gray-400 border border-gray-800 rounded-full px-3 py-1 bg-[#050505]"
                      style={{
                        top: `${10 + row * 20}%`,
                        animation: `rain ${duration}s linear infinite`,
                        animationDelay: `${delay}s`,
                        left: '100%' // Start off screen
                      }}
                   >
                     {u.name}
                   </div>
                 )
               })}
               {confirmedUsers.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                   Aún no hay confirmados... ¡sé el primero!
                 </div>
               )}
            </div>
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent z-10" />
        </NeonCard>
      </div>

      {/* Full Guest List Modal */}
      {showAllGuests && (
        <div className="fixed inset-0 bg-black z-[60] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Lista de Invitados</h2>
            <button onClick={() => setShowAllGuests(false)} className="text-neon-blue text-xl font-bold">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
             {confirmedUsers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border-b border-gray-800">
                    <span className="text-white">{u.name}</span>
                    {u.groupName && <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">{u.groupName}</span>}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. MUSIC
const MusicScreen = ({ user }: { user: User }) => {
  const [comment, setComment] = useState(user.musicComment || '');
  const [tagInput, setTagInput] = useState('');
  const [songQuery, setSongQuery] = useState('');
  const preferences = useData(() => db.getPreferences(), 'prefs');
  const songs = useData(() => db.getSongs(), 'songs');
  const allUsers = useData(() => db.getUsers(), 'users'); // To force chart refresh if needed

  // 1. Comment Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (comment !== user.musicComment) {
        db.updateUser({ ...user, musicComment: comment });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [comment, user]);

  // 2. Tags
  const myPrefs = preferences.filter(p => p.userId === user.id);
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    db.addPreference({ id: Date.now().toString(), userId: user.id, genre: tagInput.trim() });
    setTagInput('');
  };

  // 3. Chart Data
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    preferences.forEach(p => {
      const g = p.genre.toUpperCase();
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [preferences]);

  // 4. Add Song Mock
  const handleAddSong = () => {
    if (!songQuery) return;
    // Mock "fetching" info
    const newSong: Song = {
      id: Date.now().toString(),
      title: songQuery,
      artist: 'Artista Desconocido', // Mock
      platform: Math.random() > 0.5 ? 'spotify' : 'youtube',
      thumbnailUrl: `https://picsum.photos/100/100?random=${Date.now()}`,
      suggestedByUserId: user.id
    };
    db.addSong(newSong);
    setSongQuery('');
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle title="DJ Zone 🎧" subtitle="Ayudanos a armar la playlist perfecta" />

      {/* Section 1: Comment */}
      <section className="mb-8">
        <h3 className="text-white font-semibold mb-2">¿Qué querés escuchar? (Comentario libre)</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-white focus:border-neon-blue outline-none h-24 text-sm"
          placeholder="Ej: Mucho reggaeton viejo, nada de electrónica..."
        />
      </section>

      {/* Section 2: Genres */}
      <section className="mb-8">
        <h3 className="text-white font-semibold mb-2">Géneros Favoritos</h3>
        <div className="flex gap-2 mb-3">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white outline-none"
            placeholder="Ej: Cumbia, Techno..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <NeonButton onClick={handleAddTag} className="!py-2">
            <Plus size={18} />
          </NeonButton>
        </div>
        <div className="flex flex-wrap gap-2">
          {myPrefs.map(p => (
            <Badge key={p.id} onRemove={() => db.removePreference(p.id)}>{p.genre}</Badge>
          ))}
        </div>
      </section>

      {/* Section 3: Chart */}
      <section className="mb-8">
        <h3 className="text-white font-semibold mb-4">Tendencias de la Fiesta 📊</h3>
        <div className="h-48 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
               <XAxis type="number" hide />
               <YAxis dataKey="name" type="category" width={70} tick={{fill: '#fff', fontSize: 10}} />
               <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                  itemStyle={{ color: '#00C6FF' }}
               />
               <Bar dataKey="value" fill="#00C6FF" radius={[0, 4, 4, 0]}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(0, 198, 255, ${1 - index * 0.15})`} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </section>

      {/* Section 4: Songs */}
      <section>
        <h3 className="text-white font-semibold mb-2">Temazos infaltables</h3>
        <div className="flex gap-2 mb-4">
           <input 
             value={songQuery}
             onChange={e => setSongQuery(e.target.value)}
             placeholder="Buscar canción..."
             className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white outline-none"
           />
           <NeonButton onClick={handleAddSong} className="!py-2">Agregar</NeonButton>
        </div>
        <div className="space-y-3">
          {songs.map(song => (
            <div key={song.id} className="flex items-center bg-[#0A0A0A] border border-gray-800 p-2 rounded-lg">
              <img src={song.thumbnailUrl} alt="art" className="w-12 h-12 rounded object-cover mr-3" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{song.title}</h4>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
              </div>
              <div className={`p-1 rounded-full ${song.platform === 'spotify' ? 'text-green-500' : 'text-red-500'}`}>
                 <PlayCircle size={20} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// 4. TABLES
const TablesScreen = ({ user }: { user: User }) => {
  const tables = useData(() => db.getTables(), 'tables');
  const allUsers = useData(() => db.getUsers(), 'users');
  
  // Compute occupancy
  const tableData = useMemo(() => {
    return tables.map(t => {
      const occupants = allUsers.filter(u => u.tableId === t.id);
      return { ...t, occupants };
    });
  }, [tables, allUsers]);

  const handleJoin = (tableId: string) => {
    db.updateUser({ ...user, tableId });
  };

  const handleLeave = () => {
    db.updateUser({ ...user, tableId: null });
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle title="Mesas 🍽️" subtitle="Elegí dónde sentarte" />

      {user.tableId ? (
         <div className="mb-8">
           <div className="bg-neon-blue/10 border border-neon-blue p-4 rounded-lg flex justify-between items-center">
             <div>
               <p className="text-neon-blue font-bold">Estás en la {tables.find(t => t.id === user.tableId)?.name}</p>
               <p className="text-xs text-gray-400">¿Querés cambiarte?</p>
             </div>
             <button onClick={handleLeave} className="text-xs bg-black text-white px-3 py-2 rounded border border-gray-700">
               SALIR
             </button>
           </div>
         </div>
      ) : (
        <p className="mb-6 text-gray-400 text-sm">Tocá una mesa para unirte. Máximo 10 por mesa.</p>
      )}

      <div className="space-y-4">
        {tableData.map(table => {
          const isFull = table.occupants.length >= table.capacity;
          const isMyTable = table.id === user.tableId;
          const occupancyRate = table.occupants.length / table.capacity;

          return (
            <NeonCard key={table.id} className="!p-0" onClick={() => !isFull && !isMyTable && handleJoin(table.id)}>
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">{table.name}</h3>
                  <span className={`text-sm font-mono ${isFull ? 'text-red-500' : 'text-neon-blue'}`}>
                    {table.occupants.length}/{table.capacity}
                  </span>
                </div>
                
                {/* Visual Occupancy Bar */}
                <div className="w-full bg-gray-800 h-2 rounded-full mb-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-neon-blue'}`}
                    style={{ width: `${occupancyRate * 100}%` }}
                  />
                </div>

                {/* Avatars / Names list */}
                <div className="flex flex-wrap gap-1">
                  {table.occupants.map(u => (
                    <span key={u.id} className={`text-xs px-2 py-1 rounded border ${u.id === user.id ? 'bg-neon-blue text-black border-neon-blue' : 'bg-black text-gray-400 border-gray-800'}`}>
                      {u.name.split(' ')[0]}
                    </span>
                  ))}
                  {table.occupants.length === 0 && <span className="text-xs text-gray-600 italic">Mesa vacía</span>}
                </div>
                
                {!user.tableId && !isFull && (
                  <div className="mt-3 text-right">
                     <span className="text-xs text-neon-blue font-bold">UNIRSE &gt;</span>
                  </div>
                )}
              </div>
            </NeonCard>
          );
        })}
      </div>
    </div>
  );
};

// 5. WISHLIST
const WishlistScreen = ({ user }: { user: User }) => {
  const items = useData(() => db.getWishlist(), 'wishlist');

  const handleToggle = (item: WishlistItem) => {
    // Validation: Only owner or if free
    if (item.isTaken && item.takenByUserId !== user.id && !user.isAdmin) return;
    db.toggleWishlistItem(item.id, user.id);
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle title="Regalos 🎁" subtitle="¡Reservá lo que quieras regalarme!" />

      <div className="grid grid-cols-2 gap-4">
        {items.map(item => {
          const takenByMe = item.takenByUserId === user.id;
          const takenByOther = item.isTaken && !takenByMe;

          return (
            <div 
              key={item.id} 
              className={`relative rounded-xl overflow-hidden border transition-all duration-300 ${
                takenByMe ? 'border-neon-blue shadow-[0_0_10px_rgba(0,198,255,0.3)]' : 
                takenByOther ? 'border-gray-800 opacity-50 grayscale' : 
                'border-gray-700'
              }`}
              onClick={() => handleToggle(item)}
            >
               <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover" />
               <div className="p-3 bg-[#0A0A0A]">
                 <h4 className="text-white text-sm font-medium truncate">{item.name}</h4>
                 <div className="mt-2 flex justify-between items-center">
                    {takenByMe ? (
                      <span className="text-neon-blue text-xs font-bold flex items-center gap-1"><Check size={12}/> TUYO</span>
                    ) : takenByOther ? (
                      <span className="text-red-500 text-xs font-bold flex items-center gap-1"><Lock size={12}/> OCUPADO</span>
                    ) : (
                      <span className="text-gray-400 text-xs font-bold flex items-center gap-1"><Unlock size={12}/> DISPONIBLE</span>
                    )}
                 </div>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// 6. ADMIN
const AdminScreen = ({ user }: { user: User }) => {
  const query = new URLSearchParams(useLocation().search);
  const token = query.get('token');
  const users = useData(() => db.getUsers(), 'users');
  
  // Simple auth check
  if (!user.isAdmin && token !== 'secret123') {
    return <Navigate to="/home" />;
  }

  const stats = {
    confirmed: users.filter(u => u.hasLoggedIn).length,
    total: users.length,
    music: users.filter(u => u.musicComment).length,
    tables: users.filter(u => u.tableId).length
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle title="Admin Panel 🛠️" />
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] p-4 rounded border border-gray-800">
           <div className="text-2xl font-bold text-white">{stats.confirmed}/{stats.total}</div>
           <div className="text-xs text-gray-400">Confirmados</div>
        </div>
        <div className="bg-[#111] p-4 rounded border border-gray-800">
           <div className="text-2xl font-bold text-neon-blue">{stats.tables}</div>
           <div className="text-xs text-gray-400">Con Mesa</div>
        </div>
      </div>

      <h3 className="text-white mb-4 font-bold">Listado General</h3>
      <div className="bg-[#0A0A0A] rounded border border-gray-800 overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-[#111] text-gray-400 border-b border-gray-800">
            <tr>
              <th className="p-2">Nombre</th>
              <th className="p-2">Mesa</th>
              <th className="p-2">🎵</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map(u => (
              <tr key={u.id} className={u.hasLoggedIn ? 'text-white' : 'text-gray-600'}>
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.tableId ? db.getTables().find(t => t.id === u.tableId)?.name : '-'}</td>
                <td className="p-2">{u.musicComment ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MAIN APP ---

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('my18app_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('my18app_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('my18app_session');
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-neon-blue selection:text-black">
        <Routes>
          {/* Public Route */}
          <Route 
            path="/" 
            element={
              currentUser ? <Navigate to="/home" replace /> : <LoginScreen onLogin={handleLogin} />
            } 
          />

          {/* Protected Routes */}
          {currentUser ? (
            <>
              <Route path="/home" element={<><HomeScreen user={currentUser} /><Navbar /></>} />
              <Route path="/music" element={<><MusicScreen user={currentUser} /><Navbar /></>} />
              <Route path="/tables" element={<><TablesScreen user={currentUser} /><Navbar /></>} />
              <Route path="/wishlist" element={<><WishlistScreen user={currentUser} /><Navbar /></>} />
              <Route path="/admin" element={<><AdminScreen user={currentUser} /><Navbar /></>} />
              <Route path="*" element={<Navigate to="/home" />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>

        {/* Logout Helper (Top Right) - Only visible if logged in */}
        {currentUser && (
          <button 
            onClick={handleLogout} 
            className="fixed top-4 right-4 z-50 text-gray-600 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </HashRouter>
  );
};

export default App;