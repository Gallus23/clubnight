const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ── Players ──────────────────────────────────────────────────────────────────
app.get('/api/players', async (req, res) => {
  const { data, error } = await supabase.from('players').select('*').order('points', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/players', async (req, res) => {
  const { name, email, level } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const { data, error } = await supabase.from('players').insert({ name, email, level: level || 'Beginner' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/players/:id', async (req, res) => {
  const { data, error } = await supabase.from('players').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/players/:id', async (req, res) => {
  const { error } = await supabase.from('players').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Courts ───────────────────────────────────────────────────────────────────
app.get('/api/courts', async (req, res) => {
  const { data, error } = await supabase.from('courts').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Bookings ─────────────────────────────────────────────────────────────────
app.get('/api/bookings', async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, courts(name), players(name)')
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const flat = data.map(b => ({
    ...b,
    courtName: b.courts?.name,
    playerName: b.players?.name,
    courtId: b.court_id,
    playerId: b.player_id,
    startTime: b.start_time,
    endTime: b.end_time,
  }));
  res.json(flat);
});

app.post('/api/bookings', async (req, res) => {
  const { courtId, playerId, date, startTime, endTime, type } = req.body;
  if (!courtId || !playerId || !date || !startTime || !endTime)
    return res.status(400).json({ error: 'Missing required fields' });

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('court_id', courtId)
    .eq('date', date)
    .eq('status', 'confirmed')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (conflicts?.length > 0)
    return res.status(409).json({ error: 'Court already booked for this time' });

  const { data, error } = await supabase
    .from('bookings')
    .insert({ court_id: courtId, player_id: playerId, date, start_time: startTime, end_time: endTime, type: type || 'casual' })
    .select('*, courts(name), players(name)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({
    ...data,
    courtName: data.courts?.name,
    playerName: data.players?.name,
    courtId: data.court_id,
    playerId: data.player_id,
    startTime: data.start_time,
    endTime: data.end_time,
  });
});

app.delete('/api/bookings/:id', async (req, res) => {
  const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Sessions ─────────────────────────────────────────────────────────────────
app.get('/api/sessions', async (req, res) => {
  const { data: sessions, error } = await supabase.from('sessions').select('*').order('date');
  if (error) return res.status(500).json({ error: error.message });

  const { data: enrollments } = await supabase.from('session_enrollments').select('session_id, player_id');
  const grouped = {};
  (enrollments || []).forEach(e => {
    if (!grouped[e.session_id]) grouped[e.session_id] = [];
    grouped[e.session_id].push(e.player_id);
  });

  res.json(sessions.map(s => ({ ...s, maxPlayers: s.max_players, enrolled: grouped[s.id] || [] })));
});

app.post('/api/sessions', async (req, res) => {
  const { name, date, maxPlayers, fee } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Name and date required' });
  const { data, error } = await supabase
    .from('sessions')
    .insert({ name, date, max_players: maxPlayers || 20, fee: fee || 0 })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data, maxPlayers: data.max_players, enrolled: [] });
});

app.post('/api/sessions/:id/enroll', async (req, res) => {
  const { playerId } = req.body;
  const sessionId = req.params.id;

  const { data: session } = await supabase.from('sessions').select('max_players').eq('id', sessionId).single();
  const { count } = await supabase.from('session_enrollments').select('*', { count: 'exact', head: true }).eq('session_id', sessionId);

  if (count >= session.max_players) return res.status(409).json({ error: 'Session full' });

  const { error } = await supabase.from('session_enrollments').insert({ session_id: sessionId, player_id: playerId });
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/sessions/:id/result', async (req, res) => {
  const { winnerId, loserId } = req.body;

  const [{ data: winner }, { data: loser }] = await Promise.all([
    supabase.from('players').select('wins, points').eq('id', winnerId).single(),
    supabase.from('players').select('losses, points').eq('id', loserId).single(),
  ]);

  await Promise.all([
    winner && supabase.from('players').update({ wins: winner.wins + 1, points: winner.points + 30 }).eq('id', winnerId),
    loser && supabase.from('players').update({ losses: loser.losses + 1, points: Math.max(0, loser.points - 10) }).eq('id', loserId),
  ]);

  res.json({ success: true });
});

app.delete('/api/sessions/:id', async (req, res) => {
  const { error } = await supabase.from('sessions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Leaderboard ──────────────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  const { data, error } = await supabase.from('players').select('*').order('points', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const ranked = data.map((p, i) => ({
    ...p,
    rank: i + 1,
    winRate: p.wins + p.losses > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0,
  }));
  res.json(ranked);
});

// ── Stats ────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const [{ count: totalPlayers }, { count: totalBookings }, { count: activeSessions }, { count: totalCourts }] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'upcoming'),
    supabase.from('courts').select('*', { count: 'exact', head: true }),
  ]);
  res.json({ totalPlayers, totalBookings, activeSessions, totalCourts });
});

module.exports.handler = serverless(app);
