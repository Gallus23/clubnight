import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Courts from './pages/Courts';
import Bookings from './pages/Bookings';
import Sessions from './pages/Sessions';
import Players from './pages/Players';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courts" element={<Courts />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/players" element={<Players />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
