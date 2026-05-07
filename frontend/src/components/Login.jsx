import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Login({ setAuth }) {
  const [usn, setUsn] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usn.trim()) return;
    setErrorMsg('');
    setIsLoading(true);

    try {
      const apiUrl = `http://${window.location.hostname}:5000`;
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usn: usn.trim() })
      });

      if (response.ok) {
        localStorage.setItem('usn', usn.trim());
        setAuth(true);
        navigate('/compose');
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'Authentication failed');
      }
    } catch {
      setErrorMsg('Cannot reach the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden px-4">

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <motion.main
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Tape decoration */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-7 bg-surface-variant/70 rounded-sm shadow-sm rotate-1 z-20" />

        <div className="paper-texture polaroid-shadow rounded-2xl px-8 py-10 relative z-10">

          {/* Icon & Title */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-3"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '44px' }}>auto_stories</span>
            </motion.div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none mb-1">
              Aura of Remembrance
            </h1>
            <p className="font-body-sm text-on-surface-variant mt-2 italic">
              Leave a memory. Stay forever.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest" htmlFor="usn">
                Your USN
              </label>
              <div className="relative">
                <input
                  id="usn"
                  name="usn"
                  type="text"
                  required
                  placeholder="e.g. 1DS20CS001"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  className="input-field pr-12"
                  autoComplete="off"
                  autoCapitalize="characters"
                  disabled={isLoading}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant text-xl pointer-events-none">badge</span>
              </div>
            </div>

            {/* Error */}
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
              whileHover={!isLoading ? { y: -2, boxShadow: '0 8px 24px rgba(65,95,118,0.25)' } : {}}
              whileTap={!isLoading ? { scale: 0.97 } : {}}
              className="btn-primary w-full mt-2 tracking-widest uppercase"
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="material-symbols-outlined text-xl"
                >
                  progress_activity
                </motion.span>
              ) : (
                <>
                  Begin
                  <span className="material-symbols-outlined text-xl">east</span>
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center font-body-sm text-on-surface-variant/60 mt-6 text-xs">
            A digital keepsake for the Class of 2025
          </p>
        </div>
      </motion.main>
    </div>
  );
}
