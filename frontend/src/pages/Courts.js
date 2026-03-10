import React, { useEffect, useState, useCallback } from 'react';
import { courtsApi, playersApi } from '../api';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';
const api = axios.create({ baseURL: BASE });

// Live court session API
const liveApi = {
  getState: () => api.get('/live').then(r => r.data),
  joinCourt: (courtId, playerId) => api.post('/live/join', { courtId, playerId }).then(r => r.data),
  leaveCourt: (courtId, playerId) => api.post('/live/leave', { courtId, playerId }).then(r => r.data),
  joinWaiting: (playerId) => api.post('/live/waiting/join', { playerId }).then(r => r.data),
  leaveWaiting: (playerId) => api.post('/live/waiting/leave', { playerId }).then(r => r.data),
  assignFromWaiting: (playerId, courtId) => api.post('/live/waiting/assign', { playerId, courtId }).then(r => r.data),
};

const LEVEL_COLOR = {
  Advanced: 'var(--accent)',
  Intermediate: 'var(--blue)',
  Beginner: 'var(--orange)',
};

function PlayerChip({ player, onRemove, compact }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '6px 10px' : '8px 12px',
        background: hover ? 'var(--bg-3)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hover ? 'var(--border-light)' : 'var(--border)'}`,
        borderRadius: 4,
        transition: 'all 0.15s ease',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: LEVEL_COLOR[player.level] || 'var(--text-dim)',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, flex: 1 }}>{player.name}</span>
      <span style={{
        fontSize: 9, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{player.level?.slice(0, 3)}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(player.id); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: hover ? 'var(--red)' : 'var(--text-dim)',
            fontSize: 14, lineHeight: 1, padding: '0 0 0 4px',
            transition: 'color 0.15s',
          }}
          title="Remove from court"
        >×</button>
      )}
    </div>
  );
}

function JoinCourtModal({ court, players, occupants, onClose, onJoin }) {
  const [selected, setSelected] = useState('');
  const available = players.filter(p => !occupants.includes(p.id));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">JOIN {court.name.toUpperCase()}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          {occupants.length} player{occupants.length !== 1 ? 's' : ''} currently on this court
        </p>
        <div className="form-group">
          <label>Select Player</label>
          <select className="select" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— choose player —</option>
            {available.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.level})</option>
            ))}
          </select>
        </div>
        {available.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
            All players are currently assigned to courts or the waiting list.
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selected} onClick={() => onJoin(selected)}>
            Join Court
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ player, courts, courtPlayers, onClose, onAssign }) {
  const [selected, setSelected] = useState('');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">ASSIGN PLAYER</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Assign <strong style={{ color: 'var(--text)' }}>{player.name}</strong> to a court
        </p>
        <div className="form-group">
          <label>Select Court</label>
          <select className="select" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— choose court —</option>
            {courts.map(c => {
              const count = (courtPlayers[c.id] || []).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} — {count} player{count !== 1 ? 's' : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selected} onClick={() => onAssign(selected)}>
            Assign to Court
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Courts() {
  const [courts, setCourts] = useState([]);
  const [players, setPlayers] = useState([]);
  const [liveState, setLiveState] = useState({ courtPlayers: {}, waitingList: [] });
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const [c, p, live] = await Promise.all([
        courtsApi.list(),
        playersApi.list(),
        liveApi.getState(),
      ]);
      setCourts(c);
      setPlayers(p);
      setLiveState(live);
    } catch {
      toast('Failed to load court data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15s for "live" feel
  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const getPlayer = (id) => players.find(p => p.id === id);

  const handleJoinCourt = async (courtId, playerId) => {
    try {
      await liveApi.joinCourt(courtId, playerId);
      toast('Player joined court');
      setModal(null);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to join court', 'error');
    }
  };

  const handleLeaveCourt = async (courtId, playerId) => {
    try {
      await liveApi.leaveCourt(courtId, playerId);
      toast('Player removed from court');
      load();
    } catch {
      toast('Failed to remove player', 'error');
    }
  };

  const handleJoinWaiting = async (playerId) => {
    if (!playerId) return;
    try {
      await liveApi.joinWaiting(playerId);
      toast('Added to waiting list');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to add to waiting list', 'error');
    }
  };

  const handleLeaveWaiting = async (playerId) => {
    try {
      await liveApi.leaveWaiting(playerId);
      toast('Removed from waiting list');
      load();
    } catch {
      toast('Failed to remove from waiting list', 'error');
    }
  };

  const handleAssignFromWaiting = async (playerId, courtId) => {
    try {
      await liveApi.assignFromWaiting(playerId, courtId);
      toast('Player assigned to court');
      setModal(null);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to assign player', 'error');
    }
  };

  // Players not on any court or waiting
  const assignedPlayerIds = new Set([
    ...Object.values(liveState.courtPlayers).flat(),
    ...liveState.waitingList,
  ]);
  const freePlayers = players.filter(p => !assignedPlayerIds.has(p.id));

  // Waiting list players with inline add
  const [waitingSelect, setWaitingSelect] = useState('');
  const waitingCandidates = players.filter(p => !assignedPlayerIds.has(p.id));

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading courts…</div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '32px 36px', flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 36 }}>COURTS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Live view · {Object.values(liveState.courtPlayers).flat().length} players active
            · {liveState.waitingList.length} waiting
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={load}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}
        >
          ↺ Refresh
        </button>
      </div>

      {/* Court grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {courts.map(court => {
          const occupantIds = liveState.courtPlayers[court.id] || [];
          const occupants = occupantIds.map(getPlayer).filter(Boolean);
          const isEmpty = occupants.length === 0;

          return (
            <div
              key={court.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                borderColor: isEmpty ? 'var(--border)' : 'rgba(200,245,66,0.25)',
                background: isEmpty ? 'var(--bg-2)' : 'linear-gradient(135deg, rgba(200,245,66,0.03) 0%, var(--bg-2) 60%)',
                transition: 'border-color 0.2s',
                minHeight: 200,
              }}
            >
              {/* Court header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="font-display" style={{ fontSize: 22 }}>{court.name.toUpperCase()}</h2>
                  <span className={`badge ${isEmpty ? 'badge-green' : 'badge-green'}`}
                    style={{
                      background: isEmpty ? 'rgba(200,245,66,0.08)' : 'rgba(200,245,66,0.15)',
                      color: isEmpty ? 'var(--text-dim)' : 'var(--accent)',
                    }}
                  >
                    {isEmpty ? 'Free' : `${occupants.length} active`}
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setModal({ type: 'join', court })}
                  style={{ fontSize: 12 }}
                >
                  + Join
                </button>
              </div>

              {/* Players on court */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {occupants.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic',
                    minHeight: 80, border: '1px dashed var(--border)', borderRadius: 4,
                  }}>
                    No players — court is free
                  </div>
                ) : (
                  occupants.map(p => (
                    <PlayerChip
                      key={p.id}
                      player={p}
                      onRemove={(pid) => handleLeaveCourt(court.id, pid)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Waiting List */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 className="font-display" style={{ fontSize: 20 }}>WAITING LIST</h2>
            {liveState.waitingList.length > 0 && (
              <span className="badge badge-orange">{liveState.waitingList.length} waiting</span>
            )}
          </div>
          {/* Add to waiting */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="select"
              style={{ width: 200 }}
              value={waitingSelect}
              onChange={e => setWaitingSelect(e.target.value)}
            >
              <option value="">Add player to queue…</option>
              {waitingCandidates.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn btn-ghost btn-sm"
              disabled={!waitingSelect}
              onClick={() => {
                handleJoinWaiting(waitingSelect);
                setWaitingSelect('');
              }}
            >
              + Add
            </button>
          </div>
        </div>

        {liveState.waitingList.length === 0 ? (
          <div style={{
            padding: '24px 0', textAlign: 'center',
            color: 'var(--text-dim)', fontSize: 13,
            border: '1px dashed var(--border)', borderRadius: 4,
          }}>
            No one waiting — all players are on courts or unassigned
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {liveState.waitingList.map((pid, idx) => {
              const player = getPlayer(pid);
              if (!player) return null;
              return (
                <div key={pid} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                }}>
                  {/* Queue position */}
                  <div className="font-display" style={{
                    width: 28, textAlign: 'center', fontSize: 20,
                    color: idx === 0 ? 'var(--orange)' : 'var(--text-dim)',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  {/* Player info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{player.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {player.level} · {player.wins}W {player.losses}L
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setModal({ type: 'assign', player })}
                    >
                      Assign →
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleLeaveWaiting(pid)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unassigned players */}
      {freePlayers.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 className="font-display" style={{ fontSize: 20 }}>UNASSIGNED</h2>
            <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-dim)' }}>
              {freePlayers.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {freePlayers.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 0 }}>
                <PlayerChip player={p} compact />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12 }}>
            Use "+ Join" on a court or add to the waiting list above
          </p>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'join' && (
        <JoinCourtModal
          court={modal.court}
          players={players}
          occupants={liveState.courtPlayers[modal.court.id] || []}
          onClose={() => setModal(null)}
          onJoin={(playerId) => handleJoinCourt(modal.court.id, playerId)}
        />
      )}
      {modal?.type === 'assign' && (
        <AssignModal
          player={modal.player}
          courts={courts}
          courtPlayers={liveState.courtPlayers}
          onClose={() => setModal(null)}
          onAssign={(courtId) => handleAssignFromWaiting(modal.player.id, courtId)}
        />
      )}
    </div>
  );
}
