import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin({ setAuth }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setErrorMsg('');
    setIsLoading(true);

    try {
      const apiUrl = `http://${window.location.hostname}:5000`;
      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        localStorage.setItem('usn', 'admin');
        setAuth(true);
        navigate('/admin');
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'Authentication failed');
      }
    } catch {
      setErrorMsg('Cannot reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(65,95,118,0.07),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(146,75,33,0.06),transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="paper-texture polaroid-shadow rounded-2xl px-8 py-10">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-error/10 mb-3">
              <span className="material-symbols-outlined text-error text-3xl">shield_person</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Admin Portal</h1>
            <p className="font-body-sm text-on-surface-variant mt-1">Organiser access only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest" htmlFor="admin-pw">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-pw"
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-error text-sm bg-error/5 px-3 py-2 rounded-lg border border-error/20"
                >
                  <span className="material-symbols-outlined text-base">error</span>
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { y: -2 } : {}}
              whileTap={!isLoading ? { scale: 0.97 } : {}}
              className="btn-primary w-full tracking-widest uppercase"
            >
              {isLoading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="material-symbols-outlined text-xl">progress_activity</motion.span>
              ) : (
                <>Access Dashboard <span className="material-symbols-outlined text-xl">arrow_forward</span></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
            <a href="/login" className="font-body-sm text-xs text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors">
              ← Back to student login
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
