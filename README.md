# ClubNight
Badminton Club Court Management

## Features
- 📅 **Court Booking** — Book courts with conflict detection and a visual daily timeline
- 🏸 **Session Management** — Create group sessions, enroll players, record match results
- 👥 **Player Registration** — Manage members with skill levels and stats
- 🏆 **Leaderboard** — Points-based ranking with win/loss tracking

## Tech Stack
- **Frontend**: React 18, React Router 6
- **Backend**: Express.js (deployed as Netlify Functions)
- **Deployment**: Netlify

## Local Development

### Install dependencies
```bash
npm run install:all
```

### Run frontend (port 3000)
```bash
npm run dev:frontend
```

### Run backend (port 3001)
```bash
npm run dev:backend
```

The frontend proxies `/api` requests to the backend at `localhost:3001`.

## Deploy to Netlify

### Option 1: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 2: Git Push (Recommended)
1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select your repository
4. Netlify auto-detects settings from `netlify.toml`:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
   - **Functions directory**: `netlify/functions`
5. Click **Deploy site** ✓

## Project Structure
```
clubnight/
├── frontend/          # React app
│   └── src/
│       ├── pages/     # Dashboard, Courts, Bookings, Sessions, Players, Leaderboard
│       ├── components/# Sidebar
│       ├── context/   # Toast notifications
│       └── api.js     # API client
├── backend/           # Express server (for local dev)
│   └── src/index.js
├── netlify/
│   └── functions/
│       └── api.js     # Serverless Express (production)
└── netlify.toml       # Netlify config
```

## Notes
The backend uses in-memory storage — data resets on each Netlify function cold start. For production persistence, replace the in-memory arrays with a database (e.g. Supabase, PlanetScale, or MongoDB Atlas — all have free tiers).
