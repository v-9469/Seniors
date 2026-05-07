import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Compose from './components/Compose';
import Welcome from './components/Welcome';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [messagingEnabled, setMessagingEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  const apiUrl = `http://${window.location.hostname}:5000`;

  useEffect(() => {
    // Validate cookie AND fetch messaging status in parallel
    Promise.all([
      fetch(`${apiUrl}/api/me`, { credentials: 'include' })
        .then(res => { if (!res.ok) throw new Error('Not authenticated'); return res.json(); })
        .catch(() => null),
      fetch(`${apiUrl}/api/settings`)
        .then(res => res.json())
        .catch(() => ({ messagingEnabled: false }))
    ]).then(([user, settings]) => {
      if (user) {
        if (user.role === 'admin') {
          setIsAdmin(true);
          localStorage.setItem('usn', 'admin');
        } else {
          localStorage.setItem('usn', user.usn);
        }
        setProfile(user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('usn');
      }
      setMessagingEnabled(settings?.messagingEnabled ?? false);
    }).finally(() => setChecking(false));
  }, []);

  // Poll messaging status every 10s so the page opens automatically when admin enables it
  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;
    const interval = setInterval(() => {
      fetch(`${apiUrl}/api/settings`)
        .then(res => res.json())
        .then(data => setMessagingEnabled(data.messagingEnabled ?? false))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  const setAuth = (value, adminFlag = false, userProfile = null) => {
    setIsAuthenticated(value);
    setIsAdmin(adminFlag);
    if (userProfile) setProfile(userProfile);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ animation: 'spin 1.2s linear infinite' }}>
            progress_activity
          </span>
          <p className="font-body-sm text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Authenticated student sees either Welcome or Compose depending on messaging flag
  const StudentView = messagingEnabled ? <Compose /> : <Welcome name={profile?.name} />;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated && !isAdmin ? <Navigate to="/compose" /> :
            isAdmin ? <Navigate to="/admin" /> :
            <Login setAuth={(v) => setAuth(v, false)} />
          }
        />
        <Route
          path="/compose"
          element={
            isAuthenticated && !isAdmin ? StudentView :
            isAdmin ? <Navigate to="/admin" /> :
            <Navigate to="/login" />
          }
        />

        <Route
          path="/admin-login"
          element={
            isAdmin ? <Navigate to="/admin" /> :
            isAuthenticated ? <Navigate to="/compose" /> :
            <AdminLogin setAuth={(v) => setAuth(v, true)} />
          }
        />
        <Route
          path="/admin"
          element={
            isAdmin ? <AdminDashboard messagingEnabled={messagingEnabled} setMessagingEnabled={setMessagingEnabled} /> :
            isAuthenticated ? <Navigate to="/compose" /> :
            <Navigate to="/admin-login" />
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
