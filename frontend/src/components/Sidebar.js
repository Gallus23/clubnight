import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/courts', label: 'Courts', icon: '⬡' },
  { to: '/bookings', label: 'Bookings', icon: '◷' },
  { to: '/sessions', label: 'Sessions', icon: '◈' },
  { to: '/players', label: 'Players', icon: '◎' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '◆' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 24px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="font-display" style={{ fontSize: 28, lineHeight: 1, color: 'var(--text)' }}>
          CLUB<span style={{ color: 'var(--accent)' }}>NIGHT</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
          Badminton Manager
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 2,
              color: isActive ? '#080808' : 'var(--text-muted)',
              background: isActive ? 'var(--accent)' : 'transparent',
              transition: 'all 0.12s ease',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--bg-3)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--text-dim)',
        fontFamily: 'JetBrains Mono',
      }}>
        v1.0.0
      </div>
    </aside>
  );
}
