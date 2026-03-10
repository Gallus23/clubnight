import React, { useEffect, useState } from 'react';
import { leaderboardApi } from '../api';
import { useToast } from '../context/ToastContext';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    leaderboardApi.get()
      .then(setPlayers)
      .catch(() => toast('Failed to load leaderboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-display" style={{ fontSize: 36 }}>LEADERBOARD</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ranked by points · Win = +30pts · Loss = −10pts</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
      ) : players.length === 0 ? (
        <div className="card"><div className="empty-state"><p>No players yet</p></div></div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((p, i) => {
                const realRank = p.rank;
                const heights = [120, 160, 100];
                const heightMap = { 2: heights[0], 1: heights[1], 3: heights[2] };
                return (
                  <div key={p.id} className="card fade-in" style={{
                    textAlign: 'center',
                    paddingTop: 28,
                    paddingBottom: 28,
                    borderColor: realRank === 1 ? 'rgba(200,245,66,0.4)' : 'var(--border)',
                    background: realRank === 1 ? 'linear-gradient(180deg, rgba(200,245,66,0.05) 0%, var(--bg-2) 100%)' : 'var(--bg-2)',
                    order: realRank === 1 ? 0 : realRank === 2 ? -1 : 1,
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{MEDAL[realRank - 1]}</div>
                    <div className="font-display" style={{ fontSize: 48, color: realRank === 1 ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{p.points}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>PTS</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{p.wins}W · {p.losses}L · {p.winRate}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of the table */}
          {rest.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Rank</th>
                    <th>Player</th>
                    <th>Level</th>
                    <th>Win Rate</th>
                    <th>W / L</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 12 }}>#{p.rank}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text)' }}>{p.name}</td>
                      <td>
                        <span className={`badge ${p.level === 'Advanced' ? 'badge-green' : p.level === 'Intermediate' ? 'badge-blue' : 'badge-orange'}`}>
                          {p.level}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                            <div style={{ width: `${p.winRate}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.winRate}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent)' }}>{p.wins}</span>
                        <span style={{ color: 'var(--text-dim)' }}> / </span>
                        <span style={{ color: 'var(--red)' }}>{p.losses}</span>
                      </td>
                      <td><span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>{p.points}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
