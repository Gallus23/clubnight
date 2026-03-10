import React, { useEffect, useState } from 'react';
import { statsApi, leaderboardApi, bookingsApi } from '../api';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card fade-in" style={{ '--accent': accent || 'var(--accent)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'JetBrains Mono' }}>{label}</div>
      <div className="font-display" style={{ fontSize: 44, lineHeight: 1, color: accent || 'var(--accent)', marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    statsApi.get().then(setStats).catch(() => {});
    leaderboardApi.get().then(d => setLeaders(d.slice(0, 5))).catch(() => {});
    bookingsApi.list().then(setBookings).catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === today);

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-display" style={{ fontSize: 36, color: 'var(--text)', marginBottom: 4 }}>DASHBOARD</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Players" value={stats?.totalPlayers ?? '—'} sub="Registered members" />
        <StatCard label="Courts" value={stats?.totalCourts ?? '—'} sub="Available courts" accent="var(--blue)" />
        <StatCard label="Bookings" value={stats?.totalBookings ?? '—'} sub="All time" accent="var(--orange)" />
        <StatCard label="Sessions" value={stats?.activeSessions ?? '—'} sub="Upcoming" accent="var(--purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top 5 leaderboard */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 className="font-display" style={{ fontSize: 18, letterSpacing: '0.03em' }}>TOP PLAYERS</h2>
            <a href="/leaderboard" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
          </div>
          {leaders.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '20px 0' }}>No players yet</div>
          ) : leaders.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0',
              borderBottom: i < leaders.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div className="font-display" style={{
                width: 28, textAlign: 'center', fontSize: 20,
                color: i === 0 ? 'var(--accent)' : i === 1 ? '#aaa' : i === 2 ? 'var(--orange)' : 'var(--text-dim)',
              }}>{p.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.wins}W · {p.losses}L · {p.winRate}%</div>
              </div>
              <div className="font-mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{p.points}</div>
            </div>
          ))}
        </div>

        {/* Today's bookings */}
        <div className="card">
          <div style={{ marginBottom: 18 }}>
            <h2 className="font-display" style={{ fontSize: 18, letterSpacing: '0.03em' }}>TODAY'S BOOKINGS</h2>
          </div>
          {todayBookings.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No bookings for today</p>
            </div>
          ) : todayBookings.map(b => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{b.courtName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{b.playerName} · {b.startTime}–{b.endTime}</div>
              </div>
              <span className={`badge badge-${b.type === 'competitive' ? 'red' : 'green'}`}>{b.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
