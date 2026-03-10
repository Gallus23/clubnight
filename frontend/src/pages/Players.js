import React, { useEffect, useState } from 'react';
import { playersApi } from '../api';
import { useToast } from '../context/ToastContext';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function PlayerModal({ player, onClose, onSave }) {
  const [form, setForm] = useState(player || { name: '', email: '', level: 'Beginner' });

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{player ? 'EDIT PLAYER' : 'NEW PLAYER'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label>Name</label>
          <input className="input" value={form.name} onChange={e => handle('name', e.target.value)} placeholder="Full name" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="input" type="email" value={form.email} onChange={e => handle('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="form-group">
          <label>Level</label>
          <select className="select" value={form.level} onChange={e => handle('level', e.target.value)}>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            {player ? 'Save Changes' : 'Add Player'}
          </button>
        </div>
      </div>
    </div>
  );
}

const levelBadge = (l) => l === 'Advanced' ? 'badge-green' : l === 'Intermediate' ? 'badge-blue' : 'badge-orange';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const load = () => playersApi.list().then(setPlayers).catch(() => toast('Failed to load players', 'error'));
  useEffect(() => { load(); }, []);

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const save = async (form) => {
    try {
      if (modal.player) {
        await playersApi.update(modal.player.id, form);
        toast('Player updated');
      } else {
        await playersApi.create(form);
        toast('Player added');
      }
      setModal(null);
      load();
    } catch { toast('Error saving player', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Remove this player?')) return;
    try { await playersApi.delete(id); toast('Player removed'); load(); }
    catch { toast('Error removing player', 'error'); }
  };

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 36 }}>PLAYERS</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input" style={{ width: 220 }} placeholder="Search players…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setModal({ player: null })}>+ Add Player</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Level</th>
              <th>Joined</th>
              <th>W / L</th>
              <th>Points</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <p>No players found</p>
                </div>
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.email}</div>
                </td>
                <td><span className={`badge ${levelBadge(p.level)}`}>{p.level}</span></td>
                <td><span className="font-mono" style={{ fontSize: 12 }}>{p.joined}</span></td>
                <td>
                  <span style={{ color: 'var(--accent)' }}>{p.wins}</span>
                  <span style={{ color: 'var(--text-dim)' }}> / </span>
                  <span style={{ color: 'var(--red)' }}>{p.losses}</span>
                </td>
                <td><span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>{p.points}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal({ player: p })}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <PlayerModal player={modal.player} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
