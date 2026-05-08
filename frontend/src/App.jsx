import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Compose from './components/Compose';
import Welcome from './components/Welcome';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import WordCloudPhase from './components/WordCloudPhase';
import VisibleDashboard from './components/VisibleDashboard';
import JammingPhase from './components/JammingPhase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [phase, setPhase] = useState('welcome');
  const [checking, setChecking] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  const apiUrl = '';

  useEffect(() => {
    // Validate cookie AND fetch messaging status in parallel
    Promise.all([
      fetch(`${apiUrl}/api/me`, { credentials: 'include' })
        .then(res => { if (!res.ok) throw new Error('Not authenticated'); return res.json(); })
        .catch(() => null),
      fetch(`${apiUrl}/api/settings`)
        .then(res => res.json())
        .catch(() => ({ phase: 'welcome' }))
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
      setPhase(settings?.phase || 'welcome');
    }).finally(() => setChecking(false));
  }, []);

  // Poll phase every 10s so the page changes automatically when admin switches it
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetch(`${apiUrl}/api/settings`)
        .then(res => res.json())
        .then(data => setPhase(data.phase || 'welcome'))
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

  // Authenticated student sees view depending on phase
  let StudentView = <Welcome name={profile?.name} />;
  if (phase === 'wordcloud') {
    StudentView = <WordCloudPhase name={profile?.name} />;
  } else if (phase === 'jamming') {
    StudentView = <JammingPhase />;
  }

  const StudentApp = () => (
    <>
      <div style={{ display: showCompose ? 'none' : 'block' }} className="relative min-h-screen">
        {StudentView}
        {/* Floating Action Button */}
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-6 right-6 z-50 bg-secondary text-on-secondary shadow-xl rounded-full px-5 py-4 flex items-center gap-2 hover:bg-secondary/90 transition-all hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl">edit_square</span>
          <span className="font-medium text-sm tracking-wide">Write Message</span>
        </button>
      </div>
      
      {showCompose && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
          <Compose onClose={() => setShowCompose(false)} />
        </div>
      )}
    </>
  );

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
            isAuthenticated && !isAdmin ? <StudentApp /> :
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
            isAdmin ? <AdminDashboard phase={phase} setPhase={setPhase} /> :
            isAuthenticated ? <Navigate to="/compose" /> :
            <Navigate to="/admin-login" />
          }
        />
        
        <Route
          path="/presentation"
          element={
            isAdmin ? <VisibleDashboard phase={phase} /> :
            <Navigate to="/admin-login" />
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
