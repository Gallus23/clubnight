import React, { useEffect, useState } from 'react';
import { courtsApi, bookingsApi } from '../api';

export default function Courts() {
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    courtsApi.list().then(setCourts).catch(() => {});
    bookingsApi.list().then(setBookings).catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const todayBookings = bookings.filter(b => b.date === today);
  const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 36 }}>COURTS</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Today's court schedule overview</p>
      </div>

      {/* Court cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {courts.map(c => {
          const inUse = bookings.some(b => b.courtId === c.id && b.date === today && b.startTime <= now && b.endTime > now);
          const bookingNow = bookings.find(b => b.courtId === c.id && b.date === today && b.startTime <= now && b.endTime > now);
          const todayCount = todayBookings.filter(b => b.courtId === c.id).length;
          return (
            <div key={c.id} className="card" style={{ borderColor: inUse ? 'rgba(255,77,77,0.3)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 className="font-display" style={{ fontSize: 22 }}>{c.name.toUpperCase()}</h2>
                <span className={`badge ${inUse ? 'badge-red' : 'badge-green'}`}>{inUse ? 'In Use' : 'Free'}</span>
              </div>
              {inUse && bookingNow && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <div style={{ color: 'var(--text)' }}>{bookingNow.playerName}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{bookingNow.startTime} – {bookingNow.endTime}</div>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{todayCount} booking{todayCount !== 1 ? 's' : ''} today</div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="font-display" style={{ fontSize: 20, marginBottom: 20 }}>TODAY'S SCHEDULE</h2>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            {/* Time headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(14, 1fr)', gap: 0, marginBottom: 8 }}>
              <div />
              {HOURS.map(h => (
                <div key={h} style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono', textAlign: 'center' }}>{h}</div>
              ))}
            </div>
            {/* Court rows */}
            {courts.map(c => {
              return (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px repeat(14, 1fr)', gap: 0, marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{c.name}</div>
                  {HOURS.map((h, hi) => {
                    const booking = todayBookings.find(b =>
                      b.courtId === c.id &&
                      h >= b.startTime &&
                      h < b.endTime
                    );
                    const isCurrent = h <= now && `${String(parseInt(h) + 1).padStart(2, '0')}:00` > now;
                    return (
                      <div key={h} title={booking ? `${booking.playerName} (${booking.type})` : ''} style={{
                        height: 28,
                        borderRadius: 3,
                        background: booking
                          ? booking.type === 'competitive' ? 'rgba(255,77,77,0.25)' : booking.type === 'training' ? 'rgba(77,159,255,0.25)' : 'rgba(200,245,66,0.2)'
                          : isCurrent ? 'rgba(255,255,255,0.03)' : 'var(--bg-3)',
                        border: booking ? `1px solid ${booking.type === 'competitive' ? 'rgba(255,77,77,0.4)' : booking.type === 'training' ? 'rgba(77,159,255,0.4)' : 'rgba(200,245,66,0.35)'}` : '1px solid transparent',
                        margin: '0 1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: booking ? 'var(--text-muted)' : 'transparent',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        cursor: booking ? 'default' : 'default',
                      }}>
                        {booking ? booking.playerName?.split(' ')[0] : ''}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[['Casual', 'rgba(200,245,66,0.2)', 'rgba(200,245,66,0.35)'], ['Competitive', 'rgba(255,77,77,0.25)', 'rgba(255,77,77,0.4)'], ['Training', 'rgba(77,159,255,0.25)', 'rgba(77,159,255,0.4)']].map(([label, bg, border]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 2, background: bg, border: `1px solid ${border}` }} />
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
