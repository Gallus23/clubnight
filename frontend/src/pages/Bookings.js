import React, { useEffect, useState } from 'react';
import { courtsApi, bookingsApi, playersApi } from '../api';
import { useToast } from '../context/ToastContext';

function BookingModal({ courts, players, onClose, onSave }) {
  const [form, setForm] = useState({
    courtId: courts[0]?.id || '',
    playerId: players[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'casual',
  });

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">NEW BOOKING</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Player</label>
            <select className="select" value={form.playerId} onChange={e => handle('playerId', e.target.value)}>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Court</label>
            <select className="select" value={form.courtId} onChange={e => handle('courtId', e.target.value)}>
              {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Date</label>
            <input className="input" type="date" value={form.date} onChange={e => handle('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input className="input" type="time" value={form.startTime} onChange={e => handle('startTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input className="input" type="time" value={form.endTime} onChange={e => handle('endTime', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Type</label>
            <select className="select" value={form.type} onChange={e => handle('type', e.target.value)}>
              <option value="casual">Casual</option>
              <option value="competitive">Competitive</option>
              <option value="training">Training</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Book Court</button>
        </div>
      </div>
    </div>
  );
}

const typeClass = { casual: 'badge-green', competitive: 'badge-red', training: 'badge-blue' };

export default function Bookings() {
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const toast = useToast();

  const load = () => {
    courtsApi.list().then(setCourts).catch(() => {});
    bookingsApi.list().then(setBookings).catch(() => {});
    playersApi.list().then(setPlayers).catch(() => {});
  };
  useEffect(load, []);

  const save = async (form) => {
    try {
      await bookingsApi.create(form);
      toast('Court booked!');
      setShowModal(false);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Booking failed', 'error');
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await bookingsApi.delete(id); toast('Booking cancelled'); load(); }
    catch { toast('Error cancelling booking', 'error'); }
  };

  const filtered = filterDate ? bookings.filter(b => b.date === filterDate) : bookings;
  const sorted = [...filtered].sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 36 }}>BOOKINGS</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="input" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 160 }} />
          {filterDate && <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>Clear</button>}
          <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={players.length === 0}>
            + Book Court
          </button>
        </div>
      </div>

      {/* Court status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {courts.map(c => {
          const today = new Date().toISOString().split('T')[0];
          const now = new Date().toTimeString().slice(0, 5);
          const inUse = bookings.some(b =>
            b.courtId === c.id && b.date === today && b.startTime <= now && b.endTime > now
          );
          return (
            <div key={c.id} className="card" style={{ padding: 16, borderColor: inUse ? 'rgba(255,77,77,0.3)' : 'rgba(200,245,66,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>{c.name}</div>
              <span className={`badge ${inUse ? 'badge-red' : 'badge-green'}`}>{inUse ? 'In Use' : 'Available'}</span>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Court</th>
              <th>Player</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state"><p>No bookings {filterDate ? 'for this date' : 'yet'}</p></div>
              </td></tr>
            ) : sorted.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 500, color: 'var(--text)' }}>{b.courtName}</td>
                <td>{b.playerName}</td>
                <td><span className="font-mono" style={{ fontSize: 12 }}>{b.date}</span></td>
                <td><span className="font-mono" style={{ fontSize: 12 }}>{b.startTime} – {b.endTime}</span></td>
                <td><span className={`badge ${typeClass[b.type] || 'badge-green'}`}>{b.type}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => cancel(b.id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <BookingModal courts={courts} players={players} onClose={() => setShowModal(false)} onSave={save} />}
    </div>
  );
}
