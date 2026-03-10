import React, { useEffect, useState } from 'react';
import { sessionsApi, playersApi } from '../api';
import { useToast } from '../context/ToastContext';

function CreateSessionModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', date: '', maxPlayers: 20, fee: 0 });
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">NEW SESSION</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label>Session Name</label>
          <input className="input" value={form.name} onChange={e => handle('name', e.target.value)} placeholder="e.g. Thursday Night Club" />
        </div>
        <div className="form-group">
          <label>Date & Time</label>
          <input className="input" type="datetime-local" value={form.date} onChange={e => handle('date', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Max Players</label>
            <input className="input" type="number" value={form.maxPlayers} onChange={e => handle('maxPlayers', parseInt(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Fee (£)</label>
            <input className="input" type="number" step="0.50" value={form.fee} onChange={e => handle('fee', parseFloat(e.target.value))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Create Session</button>
        </div>
      </div>
    </div>
  );
}

function EnrollModal({ session, players, onClose, onEnroll }) {
  const [selected, setSelected] = useState('');
  const available = players.filter(p => !session.enrolled.includes(p.id));
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">ENROLL PLAYER</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          {session.name} · {session.enrolled.length}/{session.maxPlayers} enrolled
        </p>
        <div className="form-group">
          <label>Select Player</label>
          <select className="select" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— choose —</option>
            {available.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selected} onClick={() => onEnroll(selected)}>Enroll</button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ session, players, onClose, onSave }) {
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const enrolled = players.filter(p => session.enrolled.includes(p.id));
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">RECORD RESULT</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label>Winner</label>
          <select className="select" value={winnerId} onChange={e => setWinnerId(e.target.value)}>
            <option value="">— select winner —</option>
            {enrolled.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Loser</label>
          <select className="select" value={loserId} onChange={e => setLoserId(e.target.value)}>
            <option value="">— select loser —</option>
            {enrolled.filter(p => p.id !== winnerId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!winnerId || !loserId} onClick={() => onSave(winnerId, loserId)}>
            Save Result
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [modal, setModal] = useState(null);
  const toast = useToast();

  const load = () => {
    sessionsApi.list().then(setSessions).catch(() => {});
    playersApi.list().then(setPlayers).catch(() => {});
  };
  useEffect(load, []);

  const createSession = async (form) => {
    try { await sessionsApi.create(form); toast('Session created'); setModal(null); load(); }
    catch { toast('Error creating session', 'error'); }
  };

  const enroll = async (sessionId, playerId) => {
    try { await sessionsApi.enroll(sessionId, playerId); toast('Player enrolled'); setModal(null); load(); }
    catch (e) { toast(e.response?.data?.error || 'Enroll failed', 'error'); }
  };

  const saveResult = async (sessionId, winnerId, loserId) => {
    try { await sessionsApi.result(sessionId, winnerId, loserId); toast('Result recorded! Points updated.'); setModal(null); load(); }
    catch { toast('Error saving result', 'error'); }
  };

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try { await sessionsApi.delete(id); toast('Session deleted'); load(); }
    catch { toast('Error deleting session', 'error'); }
  };

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 36 }}>SESSIONS</h1>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>+ New Session</button>
      </div>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 14 }}>No sessions created yet</p>
            <p>Create a session to manage group play and track results</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {sessions.map(s => {
            const pct = Math.round((s.enrolled.length / s.maxPlayers) * 100);
            const full = s.enrolled.length >= s.maxPlayers;
            return (
              <div key={s.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.name}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {new Date(s.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  {s.fee > 0 && <span className="badge badge-orange">£{s.fee}</span>}
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                    <span>{s.enrolled.length} enrolled</span>
                    <span>{s.maxPlayers} max</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: full ? 'var(--red)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" disabled={full} onClick={() => setModal({ type: 'enroll', session: s })}>
                    {full ? 'Full' : 'Enroll Player'}
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={s.enrolled.length < 2} onClick={() => setModal({ type: 'result', session: s })}>
                    Record Result
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => deleteSession(s.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === 'create' && <CreateSessionModal onClose={() => setModal(null)} onSave={createSession} />}
      {modal?.type === 'enroll' && <EnrollModal session={modal.session} players={players} onClose={() => setModal(null)} onEnroll={(pid) => enroll(modal.session.id, pid)} />}
      {modal?.type === 'result' && <ResultModal session={modal.session} players={players} onClose={() => setModal(null)} onSave={(w, l) => saveResult(modal.session.id, w, l)} />}
    </div>
  );
}
