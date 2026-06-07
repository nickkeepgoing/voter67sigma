import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// PARSER — converts "01_Nick.jpg" → participant object.
// Use when you have a real /images folder. Mock data is used by default.
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
// Images: Wikimedia Commons (CC-licensed) + Gumball Fandom wiki.
// ---------------------------------------------------------------------------
const BASE_PARTICIPANTS = [
  { id:  1, name: 'Gumball',    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Gumball_Watterson.svg/300px-Gumball_Watterson.svg.png' },
  { id:  2, name: 'Darwin',     imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Darwin_Watterson.svg/300px-Darwin_Watterson.svg.png' },
  { id:  3, name: 'Anais',      imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Anais_Watterson.svg/300px-Anais_Watterson.svg.png' },
  { id:  4, name: 'Penny',      imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Penny_Fitzgerald_%28no_shell%29.png' },
  { id:  5, name: 'Tobias',     imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tobias_Wilson.svg/300px-Tobias_Wilson.svg.png' },
  { id:  6, name: 'Carrie',     imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Carrie_Krueger.svg/300px-Carrie_Krueger.svg.png' },
  { id:  7, name: 'Banana Joe', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Banana_Joe.png' },
  { id:  8, name: 'Bobert',     imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Bobert_6B.png' },
  { id:  9, name: 'Alan',       imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Alan_Keane.png' },
  { id: 10, name: 'Carmen',     imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Carmen_Verde.svg/300px-Carmen_Verde.svg.png' },
  { id: 11, name: 'Molly',      imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Molly_Collins.svg/300px-Molly_Collins.svg.png' },
  { id: 12, name: 'Tina Rex',   imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Tina_Rex.png' },
  { id: 13, name: 'Nicole',     imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/f/f4/Nicole_Watterson.png/revision/latest?cb=20131022121059' },
  { id: 14, name: 'Richard',    imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/6/69/Richard_Watterson.png/revision/latest?cb=20131022121026' },
  { id: 15, name: 'Idaho',      imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/a/ac/Idaho.png/revision/latest?cb=20120413015847' },
  { id: 16, name: 'Leslie',     imgUrl: 'https://static.wikia.nocookie.net/theamazingworldofgumball/images/3/38/Leslie.png/revision/latest?cb=20110515131635' },
].map(p => ({ ...p, winCount: 0, championCount: 0 }));

// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------
const DB_KEY = '67sigma_db';

function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)); } catch { return null; }
}
function saveDB(participants, categories, totalRuns) {
  try { localStorage.setItem(DB_KEY, JSON.stringify({ participants, categories, totalRuns })); } catch {}
}
function fallbackSrc(label, w = 300, h = 270) {
  return `https://placehold.co/${w}x${h}/16163a/a78bfa?text=${encodeURIComponent(label)}`;
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
      const s = db.participants.find(x => x.id === p.id);
      return s ? { ...p, winCount: s.winCount, championCount: s.championCount } : p;
    });
  });
  const [categories, setCategories] = useState(() => loadDB()?.categories ?? ['Most Popular', 'Best Smile']);
  const [totalRuns,  setTotalRuns]  = useState(() => loadDB()?.totalRuns ?? 0);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // ── Tournament runtime ────────────────────────────────────────────────────
  const [screen,       setScreen]       = useState('home');   // 'home'|'battle'|'leaderboard'
  const [selectedCat,  setSelectedCat]  = useState('');
  const [currentRound, setCurrentRound] = useState([]);
  const [matchIndex,   setMatchIndex]   = useState(0);
  const [roundWinners, setRoundWinners] = useState([]);
  const [runWins,      setRunWins]      = useState({});
  const [champion,     setChampion]     = useState(null);
  const [isSaving,     setIsSaving]     = useState(false);

  useEffect(() => { saveDB(participants, categories, totalRuns); }, [participants, categories, totalRuns]);

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
      setRoundWinners(updatedWinners);
      setMatchIndex(i => i + 1);
    } else if (updatedWinners.length === 1) {
      finalizeTournament(updatedWinners[0], updatedRunWins);
    } else {
      setCurrentRound(updatedWinners);
      setRoundWinners([]);
      setMatchIndex(0);
    }
  };

  const finalizeTournament = (winner, finalRunWins) => {
    setIsSaving(true);
    setTimeout(() => {
      setParticipants(prev => prev.map(p => ({
        ...p,
        winCount:      p.winCount      + (finalRunWins[p.id] ?? 0),
        championCount: p.championCount + (p.id === winner.id ? 1 : 0),
      })));
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
    const t = newCatInput.trim();
    if (!t || categories.includes(t)) return;
    setCategories(prev => [...prev, t]);
    setNewCatInput('');
  };

  const clearStats = () => {
    if (!window.confirm('Reset ALL tournament stats? This cannot be undone.')) return;
    setParticipants(BASE_PARTICIPANTS);
    setTotalRuns(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="header">
        <span className="header-title">67Σ · ROOM 6/1 · TOURNAMENT</span>
        <div className="header-right">
          <span className={`role-badge${isAdmin ? ' admin' : ''}`}>
            {isAdmin ? 'ADMIN' : 'GUEST'}
          </span>
          <button className="btn" onClick={() => setIsAdmin(v => !v)}>
            {isAdmin ? 'Logout' : 'Login (Admin)'}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HOME
      ══════════════════════════════════════════════════════════════════ */}
      {screen === 'home' && (
        <div>
          {isAdmin && (
            <div className="admin-panel">
              <span className="admin-panel-label">+ New Category (Admin)</span>
              <div className="admin-row">
                <input
                  className="text-input"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="Type a category name and press Enter…"
                />
                <button className="btn btn-primary" onClick={addCategory}>Save</button>
              </div>
            </div>
          )}

          <p className="section-label">Select a Category to Vote</p>

          {categories.length === 0 ? (
            <div className="empty-box">
              No categories yet.{isAdmin ? ' Create one above.' : ' Ask admin to add one.'}
            </div>
          ) : (
            <div className="cat-list">
              {categories.map(cat => (
                <button key={cat} className="cat-btn" onClick={() => startTournament(cat)}>
                  <span className="cat-arrow">▶</span>
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="home-footer">
            <span className="footer-stat">Tournaments completed: {totalRuns}</span>
            {totalRuns > 0 && (
              <button className="btn" onClick={() => { setChampion(null); setScreen('leaderboard'); }}>
                📊 View Leaderboard
              </button>
            )}
            {isAdmin && totalRuns > 0 && (
              <button className="btn btn-danger" onClick={clearStats}>Reset Stats</button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BATTLE
      ══════════════════════════════════════════════════════════════════ */}
      {screen === 'battle' && (
        <div>
          {/* Info bar */}
          <div className="match-bar">
            <span>Category: <span className="match-cat">{selectedCat}</span></span>
            <span className="match-round">
              {roundLabel} · Match {matchIndex + 1}/{totalMatches}
            </span>
          </div>

          {/* Match progress dots */}
          <div className="match-dots">
            {Array.from({ length: totalMatches }, (_, i) => (
              <span
                key={i}
                className={`dot${i < matchIndex ? ' done' : i === matchIndex ? ' current' : ''}`}
              />
            ))}
          </div>

          {/* Final banner */}
          {isFinal && <div className="final-banner">⚡ FINAL ROUND ⚡</div>}

          {/* Saving / Battle */}
          {isSaving ? (
            <div className="saving-screen">⏳ Saving results to database…</div>
          ) : leftPlayer && rightPlayer ? (
            <>
              <div className="battle-grid">
                {/* Left */}
                <div className="player-card left" onClick={() => handleVote(leftPlayer)}>
                  <img
                    src={leftPlayer.imgUrl}
                    alt={leftPlayer.name}
                    className="player-img"
                    onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(leftPlayer.name); }}
                  />
                  <div className="player-name">{leftPlayer.name}</div>
                  <div className="player-stats">
                    Wins: {leftPlayer.winCount} · Titles: {leftPlayer.championCount}
                  </div>
                  <button className="vote-btn left">◀ VOTE</button>
                </div>

                {/* VS */}
                <div className="vs-col">
                  <span className="vs-text">VS</span>
                </div>

                {/* Right */}
                <div className="player-card right" onClick={() => handleVote(rightPlayer)}>
                  <img
                    src={rightPlayer.imgUrl}
                    alt={rightPlayer.name}
                    className="player-img"
                    onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(rightPlayer.name); }}
                  />
                  <div className="player-name">{rightPlayer.name}</div>
                  <div className="player-stats">
                    Wins: {rightPlayer.winCount} · Titles: {rightPlayer.championCount}
                  </div>
                  <button className="vote-btn right">VOTE ▶</button>
                </div>
              </div>

              <p className="battle-hint">Click a card to cast your vote</p>
            </>
          ) : null}

          <div className="battle-actions">
            <button className="btn btn-ghost" onClick={resetToHome}>✕ Quit Tournament</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LEADERBOARD
      ══════════════════════════════════════════════════════════════════ */}
      {screen === 'leaderboard' && (
        <div>
          {/* Champion spotlight */}
          {champion && (
            <div className="champ-card">
              <span className="champ-trophy">🏆</span>
              <img
                src={champion.imgUrl}
                alt={champion.name}
                className="champ-img"
                onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(champion.name, 170, 170); }}
              />
              <div className="champ-name">CHAMPION: {champion.name.toUpperCase()}</div>
              <div className="champ-cat">Category: {selectedCat}</div>
            </div>
          )}

          {/* Table */}
          <div className="lb-head">
            <h2 className="lb-title">Global Leaderboard</h2>
            <span className="lb-meta">{totalRuns} tournament{totalRuns !== 1 ? 's' : ''} played</span>
          </div>

          <table className="lb-table">
            <thead>
              <tr>
                <th className="lb-rank">Rank</th>
                <th>Photo</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Total Wins</th>
                <th style={{ textAlign: 'right' }}>Champ&nbsp;%</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => {
                const isChamp = champion && p.id === champion.id;
                const champPct = totalRuns > 0
                  ? ((p.championCount / totalRuns) * 100).toFixed(1) + '%'
                  : '—';
                return (
                  <tr key={p.id} className={isChamp ? 'is-champ' : ''}>
                    <td className="lb-rank">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td>
                      <img
                        src={p.imgUrl}
                        alt={p.name}
                        className="lb-thumb"
                        onError={e => { e.target.onerror = null; e.target.src = fallbackSrc(p.name[0], 38, 38); }}
                      />
                    </td>
                    <td className="lb-name">{p.name}{isChamp ? ' 🏆' : ''}</td>
                    <td className="lb-wins">{p.winCount}</td>
                    <td className="lb-pct">{champPct}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="lb-actions">
            <button className="btn btn-accent" onClick={resetToHome}>← Play Again / Change Category</button>
            {isAdmin && (
              <button className="btn btn-danger" onClick={clearStats}>Reset All Stats</button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
