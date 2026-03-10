const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ── In-memory store ──────────────────────────────────────────────────────────
let players = [
  { id: uuidv4(), name: 'Alex Chen', email: 'alex@example.com', level: 'Advanced', joined: '2024-01-15', wins: 24, losses: 8, points: 1420 },
  { id: uuidv4(), name: 'Sam Rivera', email: 'sam@example.com', level: 'Intermediate', joined: '2024-02-01', wins: 15, losses: 12, points: 1180 },
  { id: uuidv4(), name: 'Jordan Lee', email: 'jordan@example.com', level: 'Beginner', joined: '2024-03-10', wins: 5, losses: 9, points: 940 },
  { id: uuidv4(), name: 'Morgan Kim', email: 'morgan@example.com', level: 'Advanced', joined: '2024-01-20', wins: 21, losses: 10, points: 1350 },
  { id: uuidv4(), name: 'Casey Park', email: 'casey@example.com', level: 'Intermediate', joined: '2024-02-18', wins: 12, losses: 15, points: 1050 },
];

let courts = [
  { id: uuidv4(), name: 'Court 1', status: 'available' },
  { id: uuidv4(), name: 'Court 2', status: 'available' },
  { id: uuidv4(), name: 'Court 3', status: 'available' },
  { id: uuidv4(), name: 'Court 4', status: 'available' },
];

let bookings = [];

let sessions = [];

// ── Players ──────────────────────────────────────────────────────────────────
app.get('/api/players', (req, res) => res.json(players));

app.post('/api/players', (req, res) => {
  const { name, email, level } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const player = { id: uuidv4(), name, email, level: level || 'Beginner', joined: new Date().toISOString().split('T')[0], wins: 0, losses: 0, points: 800 };
  players.push(player);
  res.status(201).json(player);
});

app.put('/api/players/:id', (req, res) => {
  const idx = players.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Player not found' });
  players[idx] = { ...players[idx], ...req.body };
  res.json(players[idx]);
});

app.delete('/api/players/:id', (req, res) => {
  players = players.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

// ── Courts ───────────────────────────────────────────────────────────────────
app.get('/api/courts', (req, res) => res.json(courts));

// ── Bookings ─────────────────────────────────────────────────────────────────
app.get('/api/bookings', (req, res) => res.json(bookings));

app.post('/api/bookings', (req, res) => {
  const { courtId, playerId, date, startTime, endTime, type } = req.body;
  if (!courtId || !playerId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Check for conflicts
  const conflict = bookings.find(b =>
    b.courtId === courtId &&
    b.date === date &&
    b.status === 'confirmed' &&
    ((startTime >= b.startTime && startTime < b.endTime) ||
     (endTime > b.startTime && endTime <= b.endTime))
  );
  if (conflict) return res.status(409).json({ error: 'Court already booked for this time' });

  const court = courts.find(c => c.id === courtId);
  const player = players.find(p => p.id === playerId);
  const booking = {
    id: uuidv4(), courtId, playerId,
    courtName: court?.name, playerName: player?.name,
    date, startTime, endTime, type: type || 'casual',
    status: 'confirmed', createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  res.status(201).json(booking);
});

app.delete('/api/bookings/:id', (req, res) => {
  bookings = bookings.filter(b => b.id !== req.params.id);
  res.json({ success: true });
});

// ── Sessions ─────────────────────────────────────────────────────────────────
app.get('/api/sessions', (req, res) => res.json(sessions));

app.post('/api/sessions', (req, res) => {
  const { name, date, maxPlayers, fee } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Name and date required' });
  const session = {
    id: uuidv4(), name, date,
    maxPlayers: maxPlayers || 20, fee: fee || 0,
    enrolled: [], status: 'upcoming', createdAt: new Date().toISOString()
  };
  sessions.push(session);
  res.status(201).json(session);
});

app.post('/api/sessions/:id/enroll', (req, res) => {
  const session = sessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const { playerId } = req.body;
  if (session.enrolled.includes(playerId)) return res.status(409).json({ error: 'Already enrolled' });
  if (session.enrolled.length >= session.maxPlayers) return res.status(409).json({ error: 'Session full' });
  session.enrolled.push(playerId);
  res.json(session);
});

app.post('/api/sessions/:id/result', (req, res) => {
  const { winnerId, loserId } = req.body;
  const winner = players.find(p => p.id === winnerId);
  const loser = players.find(p => p.id === loserId);
  if (winner) { winner.wins++; winner.points += 30; }
  if (loser) { loser.losses++; loser.points = Math.max(0, loser.points - 10); }
  res.json({ success: true, winner, loser });
});

app.delete('/api/sessions/:id', (req, res) => {
  sessions = sessions.filter(s => s.id !== req.params.id);
  res.json({ success: true });
});

// ── Leaderboard ──────────────────────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const ranked = [...players]
    .sort((a, b) => b.points - a.points)
    .map((p, i) => ({ ...p, rank: i + 1, winRate: p.wins + p.losses > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0 }));
  res.json(ranked);
});

// ── Stats ────────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json({
    totalPlayers: players.length,
    totalBookings: bookings.length,
    activeSessions: sessions.filter(s => s.status === 'upcoming').length,
    totalCourts: courts.length,
    availableCourts: courts.length - bookings.filter(b => b.date === new Date().toISOString().split('T')[0] && b.status === 'confirmed').length
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ClubNight API running on port ${PORT}`));
