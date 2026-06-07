import React, { useState, useEffect } from 'react';

// Procedural Gradient Circle SVG Generator
const generateInitialsSvg = (name) => {
  const initials = name.split(' ').map(n => n[0]).join('');
  const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Custom premium gradients matching the palette
  const gradients = [
    ["#6366f1", "#a855f7"], // Indigo-Purple
    ["#3b82f6", "#06b6d4"], // Blue-Cyan
    ["#f59e0b", "#d97706"], // Amber-Orange
    ["#10b981", "#059669"], // Emerald-Teal
    ["#ec4899", "#f43f5e"], // Pink-Red
    ["#8b5cf6", "#ec4899"]  // Purple-Pink
  ];
  
  const colors = gradients[charSum % gradients.length];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g-${initials}-${charSum}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}" />
        <stop offset="100%" stop-color="${colors[1]}" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#g-${initials}-${charSum})" stroke="#ffffff" stroke-width="4"/>
    <text x="50%" y="54%" font-family="'Outfit', sans-serif" font-size="34" font-weight="900" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Seed 16 initial participants
const defaultParticipants = [
  { id: '1', name: 'Alex Rivera' },
  { id: '2', name: 'Beatrice Chen' },
  { id: '3', name: 'Connor Vance' },
  { id: '4', name: 'Daisy Taylor' },
  { id: '5', name: 'Ethan Smith' },
  { id: '6', name: 'Fiona Jones' },
  { id: '7', name: 'Gabe Miller' },
  { id: '8', name: 'Harper Davis' },
  { id: '9', name: 'Ian Wilson' },
  { id: '10', name: 'Julia Patel' },
  { id: '11', name: 'Kai Lee' },
  { id: '12', name: 'Lana Brown' },
  { id: '13', name: 'Marcus Wu' },
  { id: '14', name: 'Nadia Novak' },
  { id: '15', name: 'Oliver Garcia' },
  { id: '16', name: 'Paige Young' }
].map(p => ({
  ...p,
  image_url: generateInitialsSvg(p.name),
  win_count: 0,
  champion_count: 0
}));

// Mock Database / LocalStorage API Layer
const mockApi = {
  getParticipants: () => {
    const data = localStorage.getItem('classroom_ranking_db');
    if (!data) {
      localStorage.setItem('classroom_ranking_db', JSON.stringify(defaultParticipants));
      localStorage.setItem('classroom_ranking_total_runs', '0');
      return defaultParticipants;
    }
    return JSON.parse(data);
  },
  getTotalRuns: () => {
    const runs = localStorage.getItem('classroom_ranking_total_runs');
    return runs ? parseInt(runs, 10) : 0;
  },
  saveTournamentResult: (winnerId, sessionWins) => {
    const currentDb = mockApi.getParticipants();
    const runs = mockApi.getTotalRuns();
    
    const updatedDb = currentDb.map(p => {
      const matchWins = sessionWins[p.id] || 0;
      const isChampion = p.id === winnerId;
      return {
        ...p,
        win_count: p.win_count + matchWins,
        champion_count: p.champion_count + (isChampion ? 1 : 0)
      };
    });

    localStorage.setItem('classroom_ranking_db', JSON.stringify(updatedDb));
    localStorage.setItem('classroom_ranking_total_runs', String(runs + 1));
    return { db: updatedDb, runs: runs + 1 };
  },
  resetDatabase: () => {
    localStorage.setItem('classroom_ranking_db', JSON.stringify(defaultParticipants));
    localStorage.setItem('classroom_ranking_total_runs', '0');
    return { db: defaultParticipants, runs: 0 };
  }
};

export default function App() {
  // Database States
  const [db, setDb] = useState([]);
  const [totalRuns, setTotalRuns] = useState(0);

  // Navigation Screen
  const [screen, setScreen] = useState('topic_selection'); // 'topic_selection' | 'battle' | 'result'
  const [selectedTopic, setSelectedTopic] = useState('');

  // Active Tournament Bracket States
  const [currentRoundParticipants, setCurrentRoundParticipants] = useState([]);
  const [nextRoundWinners, setNextRoundWinners] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [sessionWins, setSessionWins] = useState({});
  const [champion, setChampion] = useState(null);

  // Load database on mount
  useEffect(() => {
    setDb(mockApi.getParticipants());
    setTotalRuns(mockApi.getTotalRuns());
  }, []);

  // Confetti Canvas Particle Loop
  useEffect(() => {
    if (screen !== 'result') return;

    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize canvas relative to its parent container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle colors
    const colors = ['#6366f1', '#a855f7', '#fbbf24', '#10b981', '#ec4899', '#3b82f6'];
    const particles = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 3 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.speedY = Math.random() * 3 + 3;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [screen]);

  // Initialize Tournament Bracket
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    
    // Load fresh copy of participants and shuffle
    const candidates = mockApi.getParticipants();
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    
    setCurrentRoundParticipants(shuffled);
    setNextRoundWinners([]);
    setCurrentMatchIndex(0);
    setSessionWins({});
    setChampion(null);
    setScreen('battle');
  };

  // Vote Click Handler
  const handleVote = (winner, loser) => {
    const updatedSessionWins = {
      ...sessionWins,
      [winner.id]: (sessionWins[winner.id] || 0) + 1
    };
    setSessionWins(updatedSessionWins);

    const updatedWinners = [...nextRoundWinners, winner];

    const currentRoundSize = currentRoundParticipants.length;
    const totalMatchesInRound = currentRoundSize / 2;

    if (currentMatchIndex + 1 < totalMatchesInRound) {
      // Advance to the next match of the current round
      setNextRoundWinners(updatedWinners);
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else {
      // Current round is complete
      if (updatedWinners.length === 1) {
        // Tournament finished! Mock API call to update cumulative stats
        const apiResult = mockApi.saveTournamentResult(winner.id, updatedSessionWins);
        
        setDb(apiResult.db);
        setTotalRuns(apiResult.runs);
        setChampion(winner);
        setScreen('result');
      } else {
        // Progress to the next round with winners
        setCurrentRoundParticipants(updatedWinners);
        setNextRoundWinners([]);
        setCurrentMatchIndex(0);
      }
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm("Are you sure you want to clear all simulation history?")) {
      const apiResult = mockApi.resetDatabase();
      setDb(apiResult.db);
      setTotalRuns(apiResult.runs);
    }
  };

  // Sorting: sort leaderboard by total Wins, then Champion count
  const sortedLeaderboard = [...db].sort((a, b) => {
    if (b.win_count !== a.win_count) {
      return b.win_count - a.win_count;
    }
    return b.champion_count - a.champion_count;
  });

  // Helper to get active round label
  const getRoundLabel = (size) => {
    if (size === 16) return "Round of 16";
    if (size === 8) return "Quarter Finals";
    if (size === 4) return "Semi Finals";
    if (size === 2) return "Finals";
    return "Tournament";
  };

  // Helper for Rank display classes
  const getRankClass = (idx) => {
    if (idx === 0) return "rank-badge rank-1";
    if (idx === 1) return "rank-badge rank-2";
    if (idx === 2) return "rank-badge rank-3";
    return "rank-badge";
  };

  // Active match competitors
  const matchSize = currentRoundParticipants.length;
  const competitorA = matchSize > 0 ? currentRoundParticipants[currentMatchIndex * 2] : null;
  const competitorB = matchSize > 0 ? currentRoundParticipants[currentMatchIndex * 2 + 1] : null;

  return (
    <div className="app-wrapper" style={{ position: 'relative' }}>
      {/* Canvas Confetti layer on win page */}
      {screen === 'result' && (
        <canvas 
          id="confetti-canvas" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: 'inherit'
          }}
        />
      )}

      <h1 style={{ position: 'relative', zIndex: 2 }}>Class Tournament Ranking</h1>

      {/* Screen 1: Topic Selection */}
      {screen === 'topic_selection' && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2>Select Tournament Topic</h2>
          <p className="subtitle">Pick a vote category to initialize the 1v1 versus brackets.</p>
          <div className="category-list">
            {[
              "Most Intelligent",
              "Most Likely to Pass University",
              "Class Villain (Prankster)",
              "Gay-dar Alert"
            ].map((topic, idx) => (
              <button 
                key={idx} 
                className="category-button" 
                onClick={() => handleSelectTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen 2: Tournament Battle */}
      {screen === 'battle' && competitorA && competitorB && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="match-status-bar">
            <span>Topic: {selectedTopic}</span>
            <span>
              {getRoundLabel(matchSize)}: Match {currentMatchIndex + 1} of {matchSize / 2}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {matchSize === 2 && (
              <div className="final-indicator">★ FINAL MATCH ★</div>
            )}
          </div>

          <div className="battle-arena">
            {/* Candidate Left */}
            <div className="competitor-card" onClick={() => handleVote(competitorA, competitorB)}>
              <div className="competitor-avatar">
                <img 
                  src={competitorA.image_url} 
                  alt={competitorA.name} 
                  width="100" 
                  height="100"
                  style={{ display: 'block', borderRadius: '50%' }}
                />
              </div>
              <div className="competitor-name">{competitorA.name}</div>
            </div>

            {/* VS Box in the middle */}
            <div className="vs-divider">VS</div>

            {/* Candidate Right */}
            <div className="competitor-card" onClick={() => handleVote(competitorB, competitorA)}>
              <div className="competitor-avatar">
                <img 
                  src={competitorB.image_url} 
                  alt={competitorB.name} 
                  width="100" 
                  height="100"
                  style={{ display: 'block', borderRadius: '50%' }}
                />
              </div>
              <div className="competitor-name">{competitorB.name}</div>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click on a competitor card to vote.
          </p>
        </div>
      )}

      {/* Screen 3: Winner & Leaderboard */}
      {screen === 'result' && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ 
            textAlign: 'center', 
            border: '1px solid var(--border-subtle)', 
            padding: '30px 20px', 
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, rgba(18, 19, 36, 0.4) 100%)',
            marginBottom: '35px'
          }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '15px' }}>👑 Champion Crowned!</h2>
            {champion && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="competitor-avatar" style={{ margin: 0 }}>
                  <img 
                    src={champion.image_url} 
                    alt={champion.name} 
                    width="100" 
                    height="100"
                    style={{ display: 'block', borderRadius: '50%' }}
                  />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#ffffff' }}>
                  {champion.name}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Reigning: <strong style={{ color: 'var(--accent-gold)' }}>{selectedTopic}</strong>
                </p>
              </div>
            )}
          </div>

          <h2>Leaderboard ({totalRuns} simulation runs)</h2>
          <p className="subtitle">Aggregated cumulative statistics across all simulated matches.</p>

          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Rank</th>
                <th>Participant</th>
                <th>Wins</th>
                <th>Championships %</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaderboard.map((student, idx) => {
                const champPct = totalRuns > 0 
                  ? ((student.champion_count / totalRuns) * 100).toFixed(1) + '%' 
                  : '0.0%';
                
                return (
                  <tr key={student.id}>
                    <td>
                      <span className={getRankClass(idx)}>#{idx + 1}</span>
                    </td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={student.image_url} 
                        alt={student.name} 
                        width="36" 
                        height="36" 
                        style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                      <span style={{ fontWeight: '600' }}>{student.name}</span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{student.win_count}</td>
                    <td style={{ fontWeight: '600', color: student.champion_count > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {champPct} ({student.champion_count})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="action-bar">
            <button className="btn" onClick={() => setScreen('topic_selection')}>
              New Tournament
            </button>
            <button className="btn btn-danger" onClick={handleResetDatabase}>
              Reset Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
