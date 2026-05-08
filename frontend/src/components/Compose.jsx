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

export default function Compose({ onClose }) {
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
  const [anonCount, setAnonCount] = useState(0);
  const [recipientSent, setRecipientSent] = useState(false);
  const comboRef = useRef(null);

  const apiUrl = '';

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

  // Fetch anonymous message count
  useEffect(() => {
    fetch(`${apiUrl}/api/messages/anon-count`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : { count: 0 })
      .then(data => setAnonCount(data.count))
      .catch(() => {});
  }, []);

  // Check if message sent to selected recipient
  useEffect(() => {
    if (!recipient) {
      setRecipientSent(false);
      return;
    }
    fetch(`${apiUrl}/api/messages/check-sent?recipientId=${recipient}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : { sent: false })
      .then(data => setRecipientSent(data.sent))
      .catch(() => {});
  }, [recipient]);

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
            {onClose ? (
              <button onClick={onClose} className="p-1.5 -ml-1.5 flex items-center hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors" title="Back">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
              </button>
            ) : (
              <span className="material-symbols-outlined text-primary text-2xl">auto_stories</span>
            )}
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
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

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20"
        >
          <p className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant mb-2">Sending Rules</p>
          <ul className="space-y-1 text-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">info</span>
              You can send up to 3 anonymous messages ({anonCount}/3 used)
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">info</span>
              You can only send 1 message per person (including anonymous)
            </li>
          </ul>
        </motion.div>

        {/* ── Letter Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -2, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotate: 0.5, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="paper-texture polaroid-shadow rounded-2xl p-6 md:p-8 relative"
        >
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full rounded-tr-2xl pointer-events-none"
            style={{ background: 'radial-gradient(circle at 100% 0%, rgba(212,168,67,0.08), transparent 70%)' }}
          />

          {/* ── Recipient Section ── */}
          <div className="mb-6 pb-5 border-b border-surface-variant">
            <label className="editorial-label text-on-surface-variant block mb-3">
              To
            </label>

            {/* Custom Combobox — letter-style underline */}
            <div ref={comboRef} className="relative">
              <div
                onClick={() => setComboOpen(v => !v)}
                className={`flex items-center gap-2 cursor-pointer border-b-2 transition-all duration-300 pb-2 ${
                  comboOpen
                    ? 'border-primary'
                    : 'border-outline-variant/40 hover:border-outline'
                }`}
              >
                {selectedSenior ? (
                  <>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #D4A843, #B35A28)', color: '#fff' }}>
                      {selectedSenior.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-body-md text-on-background font-medium">{selectedSenior.name}</span>
                      <span className="ml-2 font-body-sm text-xs text-on-surface-variant">{selectedSenior.usn}</span>
                    </div>
                    {recipientSent && (
                      <span className="font-label-md text-xs text-error">Already sent</span>
                    )}
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
                    <span className="font-body-md text-on-surface-variant/50 flex-1 italic">Select your friend…</span>
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
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'top' }}
                    className="absolute z-50 mt-2 w-full bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden"
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
                    <div className="max-h-40 sm:max-h-52 overflow-y-auto hide-scrollbar">
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
            <label className="editorial-label text-on-surface-variant block mb-3">
              Your Message
            </label>
            <textarea
              className="w-full bg-transparent border-none outline-none resize-none font-body-lg text-body-lg text-on-background min-h-[50vh] sm:min-h-[200px] p-0 focus:ring-0 leading-[2.2em] placeholder:italic"
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

          {/* ── Memory Stamps (Postage Stamps) ── */}
          <div className="mb-8">
            <label className="editorial-label text-on-surface-variant block mb-3">
              Memory Stamp
            </label>
            <div className="flex gap-3 overflow-x-auto py-4 hide-scrollbar">
              {STAMPS.map((s, i) => (
                <motion.button
                  key={s.icon}
                  type="button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300 }}
                  whileHover={{ y: -4, scale: 1.08, rotate: 2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setStamp(s.icon)}
                  className={`postage-stamp ${stamp === s.icon ? 'selected' : 'unselected'}`}
                  style={stamp === s.icon ? { transform: 'rotate(3deg)' } : {}}
                >
                  <span
                    className={`material-symbols-outlined text-2xl transition-colors ${stamp === s.icon ? 'text-gold' : 'text-outline'}`}
                    style={stamp === s.icon ? { color: '#D4A843' } : {}}
                  >
                    {s.icon}
                  </span>
                  <span className={`font-label-md text-[9px] uppercase tracking-wider ${stamp === s.icon ? 'text-on-surface' : 'text-outline-variant'}`}>
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
              disabled={anonCount >= 3}
              className="w-5 h-5 accent-secondary rounded-sm cursor-pointer disabled:opacity-50"
            />
            <label htmlFor="anonymous-check" className={`font-body-sm text-sm cursor-pointer select-none ${anonCount >= 3 ? 'text-on-surface-variant/50' : 'text-on-surface'}`}>
              Send this anonymously ({3 - anonCount} remaining)
            </label>
          </div>

          {/* ── Seal Button ── */}
          {/* On desktop: inline with text. On mobile: floating FAB for thumb access */}
          <div className="hidden sm:flex items-center justify-between">
            <p className="font-body-sm text-on-surface-variant/70 text-xs max-w-[60%]">
              {isAnonymous ? "Delivered anonymously. Only you know you sent it." : "Your name will be visible to the recipient."}
            </p>

            <motion.button
              type="button"
              onClick={handleSeal}
              disabled={isSending || sent}
              whileHover={!isSending && !sent ? { scale: 1.08 } : {}}
              whileTap={!isSending && !sent ? {
                scale: 0.85,
                rotate: -5,
                transition: { duration: 0.15 }
              } : {}}
              animate={sent ? { scale: [1, 1.15, 1] } : {}}
              className={`wax-seal ${sent ? 'sent' : ''} focus:outline-none`}
            >
              <span className="material-symbols-outlined text-2xl mb-0.5" style={{ color: sent ? '#fff' : '#FFD700' }}>
                {sent ? 'check' : isSending ? 'progress_activity' : 'send'}
              </span>
              <span className="font-label-md text-[9px] uppercase tracking-widest" style={{ color: sent ? '#fff' : '#FFD700' }}>
                {sent ? 'Sent!' : isSending ? '...' : 'Seal'}
              </span>
            </motion.button>
          </div>

          {/* Mobile-only: anon hint text */}
          <p className="sm:hidden font-body-sm text-on-surface-variant/70 text-xs text-center">
            {isAnonymous ? "Delivered anonymously." : "Your name will be visible."}
          </p>
        </motion.div>

        {/* Sticky note hint */}
        <motion.div
          initial={{ opacity: 0, rotate: 1 }}
          animate={{ opacity: 1, rotate: -1.5 }}
          transition={{ delay: 0.8, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 w-full sm:w-56 sm:ml-auto bg-tertiary-fixed/50 p-3 rounded shadow-sm relative"
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

      {/* Mobile floating wax-seal FAB — hidden on sm+ where inline seal is visible */}
      <motion.button
        type="button"
        onClick={handleSeal}
        disabled={isSending || sent}
        whileTap={!isSending && !sent ? {
          scale: 0.85,
          rotate: -5,
          transition: { duration: 0.15 }
        } : {}}
        animate={sent ? { scale: [1, 1.15, 1] } : {}}
        className={`sm:hidden fixed bottom-6 right-6 z-50 wax-seal ${sent ? 'sent' : ''} focus:outline-none`}
        style={{ width: '4.5rem', height: '4.5rem' }}
      >
        <span className="material-symbols-outlined text-2xl mb-0.5" style={{ color: sent ? '#fff' : '#FFD700' }}>
          {sent ? 'check' : isSending ? 'progress_activity' : 'send'}
        </span>
        <span className="font-label-md text-[9px] uppercase tracking-widest" style={{ color: sent ? '#fff' : '#FFD700' }}>
          {sent ? 'Sent!' : isSending ? '...' : 'Seal'}
        </span>
      </motion.button>
    </div>
  );
}
