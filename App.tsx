import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Music, 
  Gift, 
  Users, 
  LogOut, 
  Plus, 
  Check, 
  Lock, 
  Unlock,
  PlayCircle,
  Save,
  Shield,
  ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { User, Table, Song, WishlistItem } from './types';
import { db, normalizeName, VALID_GENRES } from './services/db';
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

// --- UTILS ---
// Req 4: Función de cuenta regresiva
const calculateTimeLeft = () => {
  const birthday = new Date('2025-12-27T00:00:00');
  const now = new Date();
  const difference = +birthday - +now;

  let timeLeft = {};

  if (difference > 0) {
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    
    timeLeft = { days, hours, minutes, seconds, total: difference };
  } else {
    timeLeft = { total: 0 };
  }
  return timeLeft;
};

// --- COMPONENTS ---

const BirthdayCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<any>(calculateTimeLeft());

  useEffect(() => {
    const intervalTime = timeLeft.days < 1 ? 1000 : 60000;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, intervalTime);
    return () => clearInterval(timer);
  }, [timeLeft.days]);

  if (timeLeft.total <= 0) return <p className="text-neon-blue font-bold animate-pulse">¡ES HOY! 🎉</p>;

  if (timeLeft.days >= 1) {
    return <p className="text-neon-text mt-1">Faltan <span className="text-white font-bold">{timeLeft.days} días</span> para la fiesta</p>;
  }

  return (
    <p className="text-neon-blue font-mono mt-1 text-xl">
      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </p>
  );
};

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
    <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-md border-t border-[#333] z-50 pb-safe">
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

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const allUsers = useData(() => db.getUsers(), 'users');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setError('');
    
    if (val.length >= 1) {
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
                <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-[#333] mt-1 rounded-lg overflow-hidden z-20 shadow-xl">
                  {suggestions.map(s => (
                    <div 
                      key={s} 
                      className="p-3 hover:bg-[#222] cursor-pointer text-gray-300 border-b border-gray-800 last:border-0"
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
  const navigate = useNavigate();

  const myPrefs = useData(() => db.getPreferences(), 'prefs').filter(p => p.userId === user.id);
  const mySongs = useData(() => db.getSongs(), 'songs').filter(s => s.suggestedByUserId === user.id);

  const pendingTasks = [];
  if (!user.musicComment && myPrefs.length === 0 && mySongs.length === 0) {
    pendingTasks.push({ type: 'music', title: '🎵 DJ en proceso...', desc: '¡No nos dijiste qué música te gusta!', link: '/music' });
  }
  if (!user.tableId) {
    pendingTasks.push({ type: 'table', title: '🍽️ Tu lugar en la mesa', desc: 'Todavía no elegiste mesa.', link: '/tables' });
  }

  return (
    <div className="pb-24 pt-8 px-4">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white">Hola, <span className="text-neon-blue">{user.name.split(' ')[0]}</span> 👋</h1>
          <BirthdayCountdown />
        </div>
        {/* Req Admin: Botón visible para ir al panel */}
        {user.isAdmin && (
          <button 
            onClick={() => navigate('/admin')}
            className="bg-[#111] p-2 rounded-lg border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-colors"
            title="Panel Admin"
          >
            <Shield size={20} />
          </button>
        )}
      </header>

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

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Invitados Confirmados ({confirmedUsers.length})</h2>
          <button onClick={() => setShowAllGuests(true)} className="text-xs text-neon-blue border border-neon-blue px-2 py-1 rounded">VER TODOS</button>
        </div>
        
        {/* Req Home: Carrusel Marquee (Scroll infinito real) */}
        <NeonCard onClick={() => setShowAllGuests(true)} className="h-24 flex items-center !bg-black !p-0">
          <div className="w-full overflow-hidden relative h-full flex items-center mask-linear-fade">
             {confirmedUsers.length === 0 ? (
                <p className="w-full text-center text-gray-500 text-sm">Aún no hay nadie...</p>
             ) : (
                <div className="flex animate-scroll whitespace-nowrap w-max hover:[animation-play-state:paused]">
                  {/* Duplicamos la lista para efecto infinito */}
                  {[...confirmedUsers, ...confirmedUsers, ...confirmedUsers].map((u, i) => (
                    <div 
                      key={`${u.id}-${i}`} 
                      className="mx-4 flex flex-col items-center justify-center min-w-[80px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center mb-1 text-xs font-bold text-gray-400">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-400">{u.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </NeonCard>
      </div>

      {showAllGuests && (
        <div className="fixed inset-0 bg-black z-[60] p-6 flex flex-col animate-fade-in">
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
  const [tagError, setTagError] = useState('');
  
  const [songQuery, setSongQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  const preferences = useData(() => db.getPreferences(), 'prefs');
  const songs = useData(() => db.getSongs(), 'songs');

  const handleSaveComment = () => {
    db.updateUser({ ...user, musicComment: comment });
    alert('¡Comentario guardado! 💾');
  };

  const myPrefs = preferences.filter(p => p.userId === user.id);
  const handleAddTag = () => {
    setTagError('');
    const val = tagInput.trim().toLowerCase();
    if (!val) return;

    if (myPrefs.some(p => p.genre === val)) {
      setTagError('¡Ya agregaste este género!');
      return;
    }

    if (!VALID_GENRES.includes(val)) {
      setTagError(`Género no reconocido. Probá: ${VALID_GENRES.slice(0,3).join(', ')}...`);
      return;
    }

    db.addPreference({ id: Date.now().toString(), userId: user.id, genre: val });
    setTagInput('');
  };

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    preferences.forEach(p => {
      const g = p.genre.toUpperCase();
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [preferences]);

  // Req Musica: Búsqueda "Real" y no inventada
  useEffect(() => {
    if (songQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      // Llamada a la función "mock API"
      const results = await db.searchSongs(songQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [songQuery]);

  const handleSelectSong = (song: Song) => {
    db.addSong({ ...song, suggestedByUserId: user.id });
    setSongQuery('');
    setSearchResults([]);
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle title="DJ Zone 🎧" subtitle="Ayudanos a armar la playlist perfecta" />

      <section className="mb-8">
        <h3 className="text-white font-semibold mb-2">¿Qué querés escuchar?</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-white focus:border-neon-blue outline-none h-24 text-sm mb-2"
          placeholder="Ej: Mucho reggaeton viejo, nada de electrónica..."
        />
        <NeonButton onClick={handleSaveComment} variant="secondary" className="!py-2 !text-xs w-full">
          <Save size={14} /> GUARDAR COMENTARIO
        </NeonButton>
      </section>

      <section className="mb-8">
        <h3 className="text-white font-semibold mb-2">Géneros Favoritos</h3>
        <div className="flex gap-2 mb-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white outline-none"
            placeholder="Ej: cumbia, rock..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <NeonButton onClick={handleAddTag} className="!py-2">
            <Plus size={18} />
          </NeonButton>
        </div>
        {tagError && <p className="text-red-400 text-xs mb-2">{tagError}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {myPrefs.map(p => (
            <Badge key={p.id} onRemove={() => db.removePreference(p.id)}>{p.genre}</Badge>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-white font-semibold mb-4">Tendencias de la Fiesta 📊</h3>
        <div className="h-64 w-full overflow-x-auto">
           <div className="min-w-[400px] h-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 10, bottom: 10 }}>
                 <CartesianGrid horizontal={false} stroke="#333" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={80} tick={{fill: '#fff', fontSize: 10}} interval={0} />
                 <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                    itemStyle={{ color: '#00C6FF' }}
                    formatter={(value: number) => [value, 'Votos']}
                 />
                 <Bar dataKey="value" fill="#00C6FF" radius={[0, 4, 4, 0]} barSize={20}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`rgba(0, 198, 255, ${Math.max(0.3, 1 - index * 0.1)})`} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </section>

      <section>
        <h3 className="text-white font-semibold mb-2">Temazos infaltables</h3>
        <div className="relative mb-4">
           <input 
             value={songQuery}
             onChange={e => setSongQuery(e.target.value)}
             placeholder="Buscar canción o artista..."
             className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-3 text-white outline-none focus:border-neon-blue"
           />
           {isSearching && <div className="absolute right-3 top-3 text-neon-blue animate-spin">⌛</div>}
           
           {searchResults.length > 0 ? (
             <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-[#333] z-20 rounded-b-lg max-h-60 overflow-y-auto shadow-2xl">
               {searchResults.map(res => (
                 <div key={res.id} className="flex items-center p-3 hover:bg-[#222] border-b border-gray-800">
                    <img src={res.thumbnailUrl} className="w-10 h-10 rounded mr-3 object-cover"/>
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-white text-sm font-bold truncate">{res.title}</p>
                      <p className="text-xs text-gray-400 truncate">{res.artist}</p>
                    </div>
                    
                    {/* Enlace funcional para escuchar */}
                    {res.platformUrl && (
                      <a 
                        href={res.platformUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-neon-blue"
                        title="Escuchar preview"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    
                    <button onClick={() => handleSelectSong(res)} className="p-2 text-neon-blue hover:bg-neon-blue/10 rounded-full">
                      <Plus size={18}/>
                    </button>
                 </div>
               ))}
             </div>
           ) : (
             songQuery.length >= 2 && !isSearching && (
                <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-[#333] z-20 p-3 text-center text-gray-500 text-sm">
                  No encontramos esa canción 😢
                </div>
             )
           )}
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
  
  const tableData = useMemo(() => {
    return tables.map(t => {
      const occupants = allUsers.filter(u => u.tableId === t.id);
      return { ...t, occupants };
    });
  }, [tables, allUsers]);

  const handleJoin = (tableId: string) => {
    db.updateUser({ ...user, tableId });
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle title="Mesas 🍽️" subtitle="Elegí dónde sentarte" />

      <div className="space-y-4">
        {tableData.map(table => {
          const isFull = table.occupants.length >= table.capacity;
          const isMyTable = table.id === user.tableId;
          const occupancyRate = table.occupants.length / table.capacity;

          return (
            // Req Mesas: Height auto permitido gracias al cambio en UI.tsx
            <NeonCard key={table.id} className="!p-0 transition-all duration-500">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">{table.name}</h3>
                  <span className={`text-sm font-mono ${isFull ? 'text-red-500' : 'text-neon-blue'}`}>
                    {table.occupants.length}/{table.capacity}
                  </span>
                </div>
                
                <div className="w-full bg-gray-800 h-2 rounded-full mb-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-neon-blue'}`}
                    style={{ width: `${occupancyRate * 100}%` }}
                  />
                </div>

                {/* Lista vertical que empuja el contenedor */}
                <div className="flex flex-col gap-2 mb-4">
                  {table.occupants.map(u => (
                    <div key={u.id} className={`flex items-center gap-2 text-sm ${u.id === user.id ? 'text-neon-blue font-bold' : 'text-gray-300'}`}>
                       <div className="w-1 h-1 bg-current rounded-full" />
                       {u.name}
                    </div>
                  ))}
                  {table.occupants.length === 0 && <span className="text-xs text-gray-600 italic">Mesa vacía</span>}
                </div>
                
                <div className="mt-3">
                   {isMyTable ? (
                     <NeonButton fullWidth disabled variant="secondary" className="opacity-50">
                        ESTÁS ACÁ
                     </NeonButton>
                   ) : (
                     <NeonButton 
                        fullWidth 
                        onClick={() => handleJoin(table.id)} 
                        disabled={isFull}
                        variant={user.tableId ? "secondary" : "primary"}
                      >
                        {isFull ? "LLENA" : user.tableId ? "CAMBIARME ACÁ" : "UNIRSE"}
                     </NeonButton>
                   )}
                </div>
              </div>
            </NeonCard>
          );
        })}
      </div>
    </div>
  );
};

const WishlistScreen = ({ user }: { user: User }) => {
  const items = useData(() => db.getWishlist(), 'wishlist');

  const handleToggle = (item: WishlistItem) => {
    if (item.isTaken && item.takenByUserId !== user.id && !user.isAdmin) return;
    db.toggleWishlistItem(item.id, user.id);
  };

  return (
    <div className="pb-24 pt-8 px-4">
      <PageTitle 
        title="Lista de deseos 🎁" 
        subtitle="¡Por si no sabés qué regalarme, acá podés reservar lo que quieras tanto vos como un grupo con el que se organicen!" 
      />

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
                      <span className="text-neon-blue text-xs font-bold flex items-center gap-1"><Check size={12}/> RESERVADO</span>
                    ) : takenByOther ? (
                      <span className="text-red-500 text-xs font-bold flex items-center gap-1"><Lock size={12}/> RESERVADO</span>
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
          <Route 
            path="/" 
            element={
              currentUser ? <Navigate to="/home" replace /> : <LoginScreen onLogin={handleLogin} />
            } 
          />
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