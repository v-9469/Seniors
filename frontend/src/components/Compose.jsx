import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAMPS = [
  { icon: 'local_florist', label: 'Flowers' },
  { icon: 'favorite', label: 'Love' },
  { icon: 'stars', label: 'Stars' },
  { icon: 'flight_takeoff', label: 'Fly High' },
  { icon: 'cake', label: 'Celebrate' },
  { icon: 'auto_stories', label: 'Memories' },
];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = type === 'success'
    ? 'bg-green-50 border border-green-200 text-green-800'
    : 'bg-red-50 border border-red-200 text-red-800';

  const icon = type === 'success' ? 'check_circle' : 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      className={`toast ${colors}`}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      {message}
    </motion.div>
  );
}

export default function Compose() {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [stamp, setStamp] = useState('favorite');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [seniors, setSeniors] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [comboOpen, setComboOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const comboRef = useRef(null);

  const apiUrl = import.meta.env.PROD ? 'http://goldenhour.assetiq.dpdns.org:12000' : `http://${window.location.hostname}:12000`;

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setComboOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    // Fetch peer list
    fetch(`${apiUrl}/api/seniors`)
      .then(res => res.json())
      .then(data => setSeniors(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Validate session & load profile
    fetch(`${apiUrl}/api/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => setProfile(data))
      .catch(() => {
        localStorage.removeItem('usn');
        window.location.href = '/login';
      });
  }, []);

  const handleSeal = async () => {
    if (!recipient) {
      setToast({ type: 'error', message: 'Please choose someone to send to.' });
      return;
    }
    if (!message.trim()) {
      setToast({ type: 'error', message: 'Write something heartfelt first!' });
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: recipient, content: message.trim(), stamp, isAnonymous })
      });
      if (response.ok) {
        setSent(true);
        setToast({ type: 'success', message: 'Your memory has been sealed & delivered! 💌' });
        setTimeout(() => {
          setMessage('');
          setRecipient('');
          setSearchTerm('');
          setSent(false);
        }, 2000);
      } else {
        const data = await response.json();
        setToast({ type: 'error', message: data.error || 'Failed to send. Try again.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    fetch(`${apiUrl}/api/logout`, { method: 'POST', credentials: 'include' }).finally(() => {
      localStorage.removeItem('usn');
      window.location.href = '/login';
    });
  };

  const filteredSeniors = seniors
    .filter(s => profile ? s.usn !== profile.usn : true)
    .filter(s => {
      const q = searchTerm.toLowerCase();
      return (s.name || '').toLowerCase().includes(q) || s.usn.toLowerCase().includes(q);
    });

  const selectedSenior = seniors.find(s => s._id === recipient);

  return (
    <div className="bg-background text-on-background min-h-screen">

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">auto_stories</span>
            <span className="font-headline-md text-primary font-semibold hidden sm:block">Golden Hour</span>
          </div>

          <h1 className="font-headline-md text-on-surface text-base font-medium absolute left-1/2 -translate-x-1/2">
            Write a Memory
          </h1>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="text-right hidden sm:block">
                <p className="font-body-sm font-semibold text-primary leading-tight">{profile.name || 'Student'}</p>
                <p className="font-body-sm text-on-surface-variant text-xs">{profile.usn}</p>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Greeting */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Hello, {profile.name?.split(' ')[0] || 'Friend'} 👋
            </h2>
            <p className="font-body-sm text-on-surface-variant mt-1">
              Share a memory, a wish, or a feeling. It stays anonymous.
            </p>
          </motion.div>
        )}

        {/* ── Letter Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="paper-texture polaroid-shadow rounded-2xl p-6 md:p-8 relative"
        >
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full rounded-tr-2xl pointer-events-none" />

          {/* ── Recipient Section ── */}
          <div className="mb-6 pb-5 border-b border-surface-variant">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-3">
              To
            </label>

            {/* Custom Combobox */}
            <div ref={comboRef} className="relative">
              <div
                onClick={() => setComboOpen(v => !v)}
                className={`flex items-center gap-2 cursor-pointer rounded-xl border transition-all duration-200 px-4 py-3 ${
                  comboOpen
                    ? 'border-primary ring-2 ring-primary/20 bg-surface-container-lowest'
                    : 'border-outline-variant/40 bg-surface-container/50 hover:border-outline'
                }`}
              >
                {selectedSenior ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary text-sm font-bold flex-shrink-0">
                      {selectedSenior.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-body-md text-on-background font-medium">{selectedSenior.name}</span>
                      <span className="ml-2 font-body-sm text-xs text-on-surface-variant">{selectedSenior.usn}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setRecipient(''); setSearchTerm(''); }}
                      className="text-outline-variant hover:text-error transition-colors ml-1"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-outline-variant text-lg">person_search</span>
                    <span className="font-body-md text-on-surface-variant/60 flex-1">Select your friend…</span>
                    <span className="material-symbols-outlined text-outline-variant text-lg">{comboOpen ? 'expand_less' : 'expand_more'}</span>
                  </>
                )}
              </div>

              {/* Dropdown panel */}
              <AnimatePresence>
                {comboOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ transformOrigin: 'top' }}
                    className="absolute z-50 mt-1 w-full bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden"
                  >
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-outline-variant/15">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-base pointer-events-none">search</span>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Type a name or USN…"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full bg-surface-container/50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50"
                        />
                      </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-52 overflow-y-auto hide-scrollbar">
                      {filteredSeniors.length === 0 ? (
                        <div className="py-6 text-center font-body-sm text-on-surface-variant text-sm">
                          No matches found.
                        </div>
                      ) : filteredSeniors.map(senior => (
                        <button
                          key={senior._id}
                          type="button"
                          onClick={() => { setRecipient(senior._id); setSearchTerm(''); setComboOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-primary/8 ${
                            recipient === senior._id ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                            {(senior.name || senior.usn).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-body-md text-sm text-on-background font-medium truncate">{senior.name || senior.usn}</p>
                            <p className="font-body-sm text-xs text-on-surface-variant truncate">{senior.usn}</p>
                          </div>
                          {recipient === senior._id && (
                            <span className="material-symbols-outlined text-primary text-base ml-auto">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Message Area ── */}
          <div className="mb-6">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-3">
              Your Message
            </label>
            <textarea
              className="w-full bg-transparent border-none outline-none resize-none font-body-lg text-body-lg text-on-background lined-paper min-h-[200px] p-0 focus:ring-0"
              placeholder="Pen down your memories… Let them live forever."
              rows={9}
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={isSending}
            />
            <div className="flex justify-end">
              <span className="font-body-sm text-on-surface-variant text-xs">{message.length} chars</span>
            </div>
          </div>

          {/* ── Memory Stamps ── */}
          <div className="mb-8">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-3">
              Memory Stamp
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {STAMPS.map((s, i) => (
                <motion.button
                  key={s.icon}
                  type="button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300 }}
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setStamp(s.icon)}
                  className={`stamp-card ${stamp === s.icon ? 'selected' : 'unselected'}`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl transition-colors ${stamp === s.icon ? 'text-secondary' : 'text-outline'}`}
                  >
                    {s.icon}
                  </span>
                  <span className={`font-label-md text-[9px] uppercase tracking-wider ${stamp === s.icon ? 'text-secondary' : 'text-outline-variant'}`}>
                    {s.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── Anonymous Checkbox ── */}
          <div className="mb-6 flex items-center gap-3 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/30">
            <input 
              type="checkbox" 
              id="anonymous-check" 
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 accent-secondary rounded-sm cursor-pointer"
            />
            <label htmlFor="anonymous-check" className="font-body-sm text-sm text-on-surface cursor-pointer select-none">
              Send this anonymously
            </label>
          </div>

          {/* ── Seal Button ── */}
          <div className="flex items-center justify-between">
            <p className="font-body-sm text-on-surface-variant/70 text-xs max-w-[60%]">
              {isAnonymous ? "Delivered anonymously. Only you know you sent it." : "Your name will be visible to the recipient."}
            </p>

            <motion.button
              type="button"
              onClick={handleSeal}
              disabled={isSending || sent}
              whileHover={!isSending && !sent ? { scale: 1.05 } : {}}
              whileTap={!isSending && !sent ? { scale: 0.92 } : {}}
              animate={sent ? { scale: [1, 1.15, 1] } : {}}
              className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 focus:outline-none ${
                sent
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary text-on-secondary hover:bg-secondary/90'
              }`}
            >
              {/* Dashed ring */}
              <div className="absolute inset-1 rounded-full border-2 border-white/25 border-dashed pointer-events-none" />
              <span className="material-symbols-outlined text-2xl mb-0.5">
                {sent ? 'check' : isSending ? 'progress_activity' : 'send'}
              </span>
              <span className="font-label-md text-[9px] uppercase tracking-widest">
                {sent ? 'Sent!' : isSending ? '...' : 'Seal'}
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Sticky note hint */}
        <motion.div
          initial={{ opacity: 0, rotate: 1 }}
          animate={{ opacity: 1, rotate: -1.5 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-5 ml-auto w-56 bg-tertiary-fixed/50 p-3 rounded shadow-sm relative"
        >
          <div className="absolute -top-2 left-8 w-10 h-3.5 bg-surface-variant/80 rounded-sm shadow-sm" />
          <div className="flex gap-2 items-start">
            <span className="material-symbols-outlined text-tertiary text-base mt-0.5">lock</span>
            <p className="font-body-sm text-on-tertiary-fixed-variant text-xs">
              Make it memorable. Your messages will be exported to a PDF for them!
            </p>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
