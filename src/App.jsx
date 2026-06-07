import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// PARSER — converts filenames like "01_Nick.jpg" into participant objects.
// Use this when you have a real /images folder. Mock data is used by default.
// ---------------------------------------------------------------------------
export function parseFilename(filename) {
  const m = filename.match(/^(\d+)_(.+?)\.\w+$/);
  if (!m) return null;
  const [, rawId, name] = m;
  return { id: parseInt(rawId, 10), name, imgUrl: `/images/${filename}`, winCount: 0, championCount: 0 };
}

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRoundLabel(count) {
  if (count === 16) return 'Round of 16';
  if (count === 8)  return 'Quarter Finals';
  if (count === 4)  return 'Semi Finals';
  if (count === 2)  return 'FINAL';
  return `Round of ${count}`;
}

// ---------------------------------------------------------------------------
// MOCK DATA — 16 Amazing World of Gumball characters as Room 6/1 students.
// Images sourced from Wikimedia Commons (CC-licensed) and Gumball Fandom wiki.
// ---------------------------------------------------------------------------
const BASE_PARTICIPANTS = [
  {
    id: 1, name: 'Gumball',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Gumball_Watterson.svg/300px-Gumball_Watterson.svg.png',
  },
  {
    id: 2, name: 'Darwin',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Darwin_Watterson.svg/300px-Darwin_Watterson.svg.png',
  },
  {
    id: 3, name: 'Anais',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Anais_Watterson.svg/300px-Anais_Watterson.svg.png',
  },
  {
    id: 4, name: 'Penny',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Penny_Fitzgerald_%28no_shell%29.png',
  },
  {
    id: 5, name: 'Tobias',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tobias_Wilson.svg/300px-Tobias_Wilson.svg.png',
  },
  {
    id: 6, name: 'Carrie',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Carrie_Krueger.svg/300px-Carrie_Krueger.svg.png',
  },
  {
    id: 7, name: 'Banana Joe',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Banana_Joe.png',
  },
  {
    id: 8, name: 'Bobert',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Bobert_6B.png',
  },
  {
    id: 9, name: 'Alan',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Alan_Keane.png',
  },
  {
    id: 10, name: 'Carmen',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Carmen_Verde.svg/300px-Carmen_Verde.svg.png',
  },
  {
    id: 11, name: 'Molly',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Molly_Collins.svg/300px-Molly_Collins.svg.png',
  },
  {
    id: 12, name: 'Tina Rex',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Tina_Rex.png',
  },
  {
    id: 13, name: 'Nicole',
    imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/f/f4/Nicole_Watterson.png/revision/latest?cb=20131022121059',
  },
  {
    id: 14, name: 'Richard',
    imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/6/69/Richard_Watterson.png/revision/latest?cb=20131022121026',
  },
  {
    id: 15, name: 'Idaho',
    imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/a/ac/Idaho.png/revision/latest?cb=20120413015847',
  },
  {
    id: 16, name: 'Leslie',
    imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/3/38/Leslie.png/revision/latest?cb=20110515131635',
  },
].map(p => ({ ...p, winCount: 0, championCount: 0 }));

// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------
const DB_KEY = '67sigma_db';

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDB(participants, categories, totalRuns) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({ participants, categories, totalRuns }));
  } catch {}
}

function fallbackSrc(label, w = 300, h = 260) {
  return `https://placehold.co/${w}x${h}/dddddd/333333?text=${encodeURIComponent(label)}`;
}

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------
export default function App() {
  // ── Persistent state ──────────────────────────────────────────────────────
  const [participants, setParticipants] = useState(() => {
    const db = loadDB();
    if (!db?.participants) return BASE_PARTICIPANTS;
    return BASE_PARTICIPANTS.map(p => {
      const saved = db.participants.find(s => s.id === p.id);
      return saved ? { ...p, winCount: saved.winCount, championCount: saved.championCount } : p;
    });
  });

  const [categories, setCategories] = useState(() => {
    const db = loadDB();
    return db?.categories ?? ['Most Popular', 'Best Smile'];
  });

  const [totalRuns, setTotalRuns] = useState(() => {
    const db = loadDB();
    return db?.totalRuns ?? 0;
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // ── Tournament runtime ────────────────────────────────────────────────────
  const [screen, setScreen]           = useState('home');   // 'home' | 'battle' | 'leaderboard'
  const [selectedCat, setSelectedCat] = useState('');
  const [currentRound, setCurrentRound]   = useState([]);  // participants active this round
  const [matchIndex, setMatchIndex]       = useState(0);   // current pair index (0-based)
  const [roundWinners, setRoundWinners]   = useState([]);  // winners collected this round
  const [runWins, setRunWins]             = useState({});  // { [id]: matchWins } this run
  const [champion, setChampion]           = useState(null);
  const [isSaving, setIsSaving]           = useState(false);

  useEffect(() => {
    saveDB(participants, categories, totalRuns);
  }, [participants, categories, totalRuns]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalMatches = currentRound.length / 2;
  const leftPlayer   = currentRound[matchIndex * 2];
  const rightPlayer  = currentRound[matchIndex * 2 + 1];
  const roundLabel   = currentRound.length > 0 ? getRoundLabel(currentRound.length) : '';
  const isFinal      = currentRound.length === 2;

  const leaderboard = [...participants].sort((a, b) =>
    b.winCount !== a.winCount ? b.winCount - a.winCount : b.championCount - a.championCount
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const startTournament = (cat) => {
    setSelectedCat(cat);
    setCurrentRound(shuffle(participants));
    setMatchIndex(0);
    setRoundWinners([]);
    setRunWins({});
    setChampion(null);
    setScreen('battle');
  };

  const handleVote = (winner) => {
    const updatedRunWins = { ...runWins, [winner.id]: (runWins[winner.id] ?? 0) + 1 };
    setRunWins(updatedRunWins);

    const updatedWinners = [...roundWinners, winner];

    if (updatedWinners.length < totalMatches) {
      // More matches left in this round
      setRoundWinners(updatedWinners);
      setMatchIndex(i => i + 1);
    } else if (updatedWinners.length === 1) {
      // Final match complete — one survivor
      finalizeTournament(updatedWinners[0], updatedRunWins);
    } else {
      // Round complete — advance bracket
      setCurrentRound(updatedWinners);
      setRoundWinners([]);
      setMatchIndex(0);
    }
  };

  const finalizeTournament = (winner, finalRunWins) => {
    setIsSaving(true);
    // Simulate async API write
    setTimeout(() => {
      setParticipants(prev =>
        prev.map(p => ({
          ...p,
          winCount:      p.winCount      + (finalRunWins[p.id] ?? 0),
          championCount: p.championCount + (p.id === winner.id ? 1 : 0),
        }))
      );
      setTotalRuns(r => r + 1);
      setChampion(winner);
      setIsSaving(false);
      setScreen('leaderboard');
    }, 600);
  };

  const resetToHome = () => {
    setScreen('home');
    setChampion(null);
    setCurrentRound([]);
    setRoundWinners([]);
    setMatchIndex(0);
    setRunWins({});
  };

  const addCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(prev => [...prev, trimmed]);
    setNewCatInput('');
  };

  const clearStats = () => {
    if (!window.confirm('Reset ALL tournament stats? This cannot be undone.')) return;
    setParticipants(BASE_PARTICIPANTS);
    setTotalRuns(0);
  };

  // ── Style tokens ──────────────────────────────────────────────────────────
  const T = {
    wrap:    { fontFamily: '"Courier New", Courier, monospace', maxWidth: 960, margin: '0 auto', padding: '16px', color: '#000', background: '#fff', minHeight: '100vh' },
    row:     { display: 'flex', alignItems: 'center', gap: 8 },
    btn:     { padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, border: '2px solid #000', background: '#fff', color: '#000', cursor: 'pointer' },
    btnDark: { padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, border: '2px solid #000', background: '#000', color: '#fff', cursor: 'pointer' },
    input:   { padding: 8, fontFamily: 'inherit', fontSize: 14, border: '2px solid #000', outline: 'none' },
    card:    { border: '3px solid #000', padding: 8, cursor: 'pointer', textAlign: 'center', userSelect: 'none' },
    imgBox:  { width: '100%', height: 260, objectFit: 'contain', display: 'block', background: '#f0f0f0' },
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={T.wrap}>

      {/* HEADER */}
      <header style={{ ...T.row, justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: 8, marginBottom: 20 }}>
        <strong style={{ fontSize: 16 }}>67Σ · ROOM 6/1 · TOURNAMENT</strong>
        <div style={T.row}>
          <code style={{ fontSize: 11, border: '1px solid #999', padding: '2px 6px' }}>
            {isAdmin ? 'ADMIN' : 'GUEST'}
          </code>
          <button style={T.btn} onClick={() => setIsAdmin(v => !v)}>
            {isAdmin ? 'Logout' : 'Login (Admin)'}
          </button>
        </div>
      </header>

      {/* ─────────────────────── HOME ─────────────────────── */}
      {screen === 'home' && (
        <div>
          {isAdmin && (
            <div style={{ border: '2px solid #000', padding: 12, marginBottom: 16 }}>
              <strong>+ New Category (Admin only)</strong>
              <div style={{ ...T.row, marginTop: 8 }}>
                <input
                  style={{ ...T.input, flex: 1 }}
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="Type a category name and press Enter…"
                />
                <button style={T.btnDark} onClick={addCategory}>Save</button>
              </div>
            </div>
          )}

          <h2 style={{ margin: '0 0 12px' }}>Select a Category to Vote</h2>

          {categories.length === 0 ? (
            <p style={{ color: '#666' }}>
              No categories yet.{isAdmin ? ' Create one above.' : ' Ask admin to add one.'}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  style={{ ...T.btn, padding: '13px 16px', textAlign: 'left', fontSize: 15, width: '100%' }}
                  onClick={() => startTournament(cat)}
                >
                  ▶&nbsp;&nbsp;{cat}
                </button>
              ))}
            </div>
          )}

          <div style={{ ...T.row, flexWrap: 'wrap', marginTop: 20, paddingTop: 12, borderTop: '1px solid #ccc', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#666' }}>Tournaments completed: {totalRuns}</span>
            {totalRuns > 0 && (
              <button style={T.btn} onClick={() => { setChampion(null); setScreen('leaderboard'); }}>
                📊 View Leaderboard
              </button>
            )}
            {isAdmin && totalRuns > 0 && (
              <button style={{ ...T.btn, color: 'red', borderColor: 'red' }} onClick={clearStats}>
                Reset All Stats
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────── BATTLE ─────────────────────── */}
      {screen === 'battle' && (
        <div>
          {/* Match info bar */}
          <div style={{ background: '#000', color: '#fff', padding: '10px 14px', marginBottom: 12, fontSize: 14, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <span>Category: {selectedCat}</span>
            <span>{roundLabel}: Match {matchIndex + 1} of {totalMatches}</span>
          </div>

          {isFinal && (
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', letterSpacing: 4, border: '4px solid #000', padding: 10, marginBottom: 12 }}>
              ⚡ FINAL ROUND ⚡
            </div>
          )}

          {isSaving ? (
            <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 16 }}>
              ⏳ Saving results…
            </div>
          ) : leftPlayer && rightPlayer ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr' }}>

                {/* Left player */}
                <div style={T.card} onClick={() => handleVote(leftPlayer)}>
                  <img
                    src={leftPlayer.imgUrl}
                    alt={leftPlayer.name}
                    style={T.imgBox}
                    onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(leftPlayer.name); }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 'bold', padding: '8px 0 4px' }}>{leftPlayer.name}</div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                    Wins: {leftPlayer.winCount} · Titles: {leftPlayer.championCount}
                  </div>
                  <button style={{ ...T.btnDark, width: '100%', padding: 10, fontSize: 14, pointerEvents: 'none' }}>
                    ◀ VOTE
                  </button>
                </div>

                {/* VS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 15, background: '#eee', borderTop: '3px solid #000', borderBottom: '3px solid #000' }}>
                  VS
                </div>

                {/* Right player */}
                <div style={T.card} onClick={() => handleVote(rightPlayer)}>
                  <img
                    src={rightPlayer.imgUrl}
                    alt={rightPlayer.name}
                    style={T.imgBox}
                    onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(rightPlayer.name); }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 'bold', padding: '8px 0 4px' }}>{rightPlayer.name}</div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                    Wins: {rightPlayer.winCount} · Titles: {rightPlayer.championCount}
                  </div>
                  <button style={{ ...T.btnDark, width: '100%', padding: 10, fontSize: 14, pointerEvents: 'none' }}>
                    VOTE ▶
                  </button>
                </div>

              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 6 }}>
                Click a card to vote
              </p>
            </>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <button style={T.btn} onClick={resetToHome}>✕ Quit Tournament</button>
          </div>
        </div>
      )}

      {/* ─────────────────────── LEADERBOARD ─────────────────────── */}
      {screen === 'leaderboard' && (
        <div>
          {champion && (
            <div style={{ border: '4px solid #000', textAlign: 'center', padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 48 }}>🏆</div>
              <img
                src={champion.imgUrl}
                alt={champion.name}
                style={{ height: 160, objectFit: 'contain', display: 'block', margin: '8px auto', background: '#f0f0f0' }}
                onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(champion.name, 160, 160); }}
              />
              <div style={{ fontSize: 26, fontWeight: 'bold', letterSpacing: 2 }}>
                CHAMPION: {champion.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Category: {selectedCat}</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Global Leaderboard</h2>
            <span style={{ fontSize: 12, color: '#666' }}>
              {totalRuns} tournament{totalRuns !== 1 ? 's' : ''} played
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#000', color: '#fff' }}>
                <th style={{ padding: 8, textAlign: 'center', width: 50 }}>Rank</th>
                <th style={{ padding: 8, textAlign: 'center', width: 52 }}>Photo</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Total Wins</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Champ&nbsp;%</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => {
                const isChamp = champion && p.id === champion.id;
                const champPct = totalRuns > 0
                  ? ((p.championCount / totalRuns) * 100).toFixed(1) + '%'
                  : '—';
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #ddd',
                      background: isChamp ? '#fffde7' : i % 2 === 0 ? '#fff' : '#f9f9f9',
                      fontWeight: isChamp ? 'bold' : 'normal',
                    }}
                  >
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <img
                        src={p.imgUrl}
                        alt={p.name}
                        style={{ height: 36, width: 36, objectFit: 'contain', display: 'block', margin: '0 auto', background: '#f0f0f0' }}
                        onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(p.name[0], 36, 36); }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>{p.name}{isChamp ? ' 🏆' : ''}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.winCount}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{champPct}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ ...T.row, flexWrap: 'wrap', marginTop: 16, gap: 8 }}>
            <button style={{ ...T.btnDark, padding: '10px 20px', fontSize: 14 }} onClick={resetToHome}>
              ← Play Again / Change Category
            </button>
            {isAdmin && (
              <button style={{ ...T.btn, color: 'red', borderColor: 'red', padding: '10px 20px', fontSize: 14 }} onClick={clearStats}>
                Reset All Stats
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
