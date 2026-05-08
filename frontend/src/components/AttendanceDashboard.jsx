import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Phyllotaxis (sunflower) layout ────────────────────────────────────────
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
function getPos(index, total, W, H) {
  const r = Math.min(W, H) * 0.44 * Math.sqrt(index / Math.max(total, 1));
  const theta = index * GOLDEN_ANGLE;
  return { x: W / 2 + r * Math.cos(theta), y: H / 2 + r * Math.sin(theta) };
}

// ── QR generation using external service (works on local network) ─────────
function getQrUrl(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&qzone=2&data=${encodeURIComponent(url)}`;
}

// ── User Avatar (Photo or Initials fallback) ──────────────────────────────
function UserAvatar({ user, size = 40 }) {
  if (user.photo) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <img src={user.photo} alt={user.name || user.usn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  const name = user.name || user.usn || '?';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', fontSize: size * 0.36, fontWeight: 700,
      background: `hsl(${hue},55%,65%)`, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>{initials}</div>
  );
}

export default function AttendanceDashboard({ onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const [recentArrivals, setRecentArrivals] = useState([]);
  const [qrModal, setQrModal] = useState(null); // student object
  const [dimensions, setDimensions] = useState({ w: 900, h: 500 });
  const [celebrationQueue, setCelebrationQueue] = useState([]); // array of arrival objects to celebrate
  const [activeCelebration, setActiveCelebration] = useState(null);
  const graphRef = useRef(null);

  const apiUrl = '';
  const hostname = window.location.hostname;

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${apiUrl}/api/admin/attendance`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const studentsData = Array.isArray(data) ? data : [];
        setStudents(studentsData);
        // Reconstruct recent arrivals from persisted data
        const arrivals = studentsData
          .filter(s => s.arrivedAt)
          .sort((a, b) => new Date(b.arrivedAt) - new Date(a.arrivedAt))
          .slice(0, 12)
          .map(s => ({
            userId: s._id,
            name: s.name,
            usn: s.usn,
            photo: s.photo,
            arrivedAt: s.arrivedAt
          }));
        setRecentArrivals(arrivals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── SSE real-time stream ──────────────────────────────────────────────────
  useEffect(() => {
    const es = new EventSource(`${apiUrl}/api/attendance/stream`);
    es.onopen = () => setLiveConnected(true);
    es.onerror = () => setLiveConnected(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'arrival') {
          setStudents(prev => prev.map(s =>
            s._id === data.userId.toString()
              ? { ...s, arrivedAt: data.arrivedAt, photo: data.photo, name: data.name, usn: data.usn }
              : s
          ));
          setRecentArrivals(prev => [data, ...prev].slice(0, 12));
          // Add to full-screen celebration queue
          setCelebrationQueue(prev => [...prev, data]);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  // ── Manual Check In (for admin testing/fallback) ─────────────────────────
  const manualCheckIn = async (token) => {
    try {
      const res = await fetch(`${apiUrl}/api/scan/${token}`);
      if (res.ok) {
        setQrModal(prev => prev ? { ...prev, arrivedAt: new Date().toISOString() } : null);
      }
    } catch {}
  };

  // ── Celebration Queue Manager ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeCelebration && celebrationQueue.length > 0) {
      const nextPerson = celebrationQueue[0];
      setActiveCelebration(nextPerson);
      setCelebrationQueue(prev => prev.slice(1));
    }
  }, [activeCelebration, celebrationQueue]);

  // Handle the dismissal timer separately so it doesn't get cancelled by state updates
  useEffect(() => {
    if (activeCelebration) {
      const timer = setTimeout(() => {
        setActiveCelebration(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeCelebration]);

  // ── Resize observer on graph container ───────────────────────────────────
  useEffect(() => {
    if (!graphRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setDimensions({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(graphRef.current);
    setDimensions({ w: graphRef.current.offsetWidth, h: graphRef.current.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // ── Computed values ───────────────────────────────────────────────────────
  const { w, h } = dimensions;
  const positions = useMemo(() => students.map((_, i) => getPos(i, students.length, w, h)), [students.length, w, h]);

  const arrivedIds = useMemo(() => new Set(students.filter(s => s.arrivedAt).map(s => s._id)), [students]);

  // Connection lines between nearby arrived nodes
  const lines = useMemo(() => {
    const arrivedNodes = students
      .map((s, i) => arrivedIds.has(s._id) ? { ...positions[i], id: s._id } : null)
      .filter(Boolean);
    const result = [];
    for (let i = 0; i < arrivedNodes.length; i++) {
      for (let j = i + 1; j < arrivedNodes.length; j++) {
        const dx = arrivedNodes[i].x - arrivedNodes[j].x;
        const dy = arrivedNodes[i].y - arrivedNodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 110) {
          result.push({ x1: arrivedNodes[i].x, y1: arrivedNodes[i].y, x2: arrivedNodes[j].x, y2: arrivedNodes[j].y });
        }
      }
    }
    return result;
  }, [students, arrivedIds, positions]);

  const arrivedCount = arrivedIds.size;
  const total = students.length;
  const pct = total > 0 ? Math.round((arrivedCount / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col text-on-background relative"
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">Who's Here?</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Live attendance · Farewell 2025</p>
          </div>

          {/* SSE status */}
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${liveConnected ? 'border-green-500/30 text-green-600' : 'border-outline-variant/50 text-on-surface-variant'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveConnected ? 'bg-green-500 animate-pulse' : 'bg-outline-variant'}`} />
            {liveConnected ? 'Live' : 'Connecting…'}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-on-surface tabular-nums">{arrivedCount}</div>
            <div className="text-xs text-on-surface-variant">Arrived</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-on-surface-variant/50 tabular-nums">{total}</div>
            <div className="text-xs text-on-surface-variant">Expected</div>
          </div>
          <div className="w-16 h-16 relative">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-full h-full">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="15.9" fill="none" stroke="#4ade80" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - pct }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-400">{pct}%</div>
          </div>
        </div>
      </div>

      {/* ── Main Area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Network Graph */}
        <div ref={graphRef} className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">Loading students…</div>
          ) : (
            <>
              {/* SVG connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <AnimatePresence>
                  {lines.map((line, i) => (
                    <motion.line
                      key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`}
                      x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                      stroke="rgba(74,222,128,0.25)"
                      strokeWidth="1"
                      filter="url(#glow)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    />
                  ))}
                </AnimatePresence>
              </svg>

              {/* Student nodes */}
              {students.map((student, i) => {
                const pos = positions[i];
                const arrived = arrivedIds.has(student._id);
                const nodeSize = arrived ? 52 : 20;

                return (
                  <motion.div
                    key={student._id}
                    style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}
                    initial={false}
                    animate={{
                      width: nodeSize,
                      height: nodeSize,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {arrived ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className="relative group cursor-pointer"
                        onClick={() => setQrModal(student)}
                        title={`${student.name} — click for QR`}
                      >
                        {/* Pulse ring */}
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-0 rounded-full bg-green-400/30"
                        />
                        {/* Avatar */}
                        <div className="w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-400/30 relative z-10 bg-surface flex items-center justify-center">
                          <UserAvatar user={student} size={52} />
                        </div>
                        {/* Name tooltip */}
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                          {student.name?.split(' ')[0] || student.usn}
                        </div>
                      </motion.div>
                    ) : student.photo ? (
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden border-2 border-outline-variant/40 cursor-pointer hover:border-outline transition-colors shadow-sm opacity-60 grayscale scale-75"
                        onClick={() => setQrModal(student)}
                        title={`${student.name} — Not arrived`}
                      >
                        <UserAvatar user={student} size={40} />
                      </div>
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full bg-outline-variant/30 border border-outline-variant cursor-pointer hover:bg-outline-variant transition-colors shadow-sm"
                        onClick={() => setQrModal(student)}
                        title={student.name}
                      />
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Right Panel: Recent Arrivals ─────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-l border-outline-variant/20 flex flex-col bg-surface/50">
          <div className="px-4 pt-4 pb-2 border-b border-outline-variant/20">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Recent Arrivals</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence initial={false}>
              {recentArrivals.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">Waiting for guests…</p>
              ) : recentArrivals.map((a, i) => (
                <motion.div
                  key={`${a.userId}-${a.arrivedAt}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-green-500/15 border border-green-500/30' : 'bg-white/5'}`}
                >
                  <div className="flex-shrink-0 border-2 border-green-400/50 rounded-full">
                    <UserAvatar user={a} size={40} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-on-surface truncate">{a.name || a.usn}</p>
                    <p className="text-xs text-on-surface-variant">{a.usn}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {new Date(a.arrivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {i === 0 && <span className="text-lg">🎉</span>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-outline-variant/20 space-y-2">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <div className="w-3 h-3 rounded-full bg-green-400 border border-green-300" />
              Arrived — click node for details
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <div className="w-3 h-3 rounded-full bg-outline-variant/30 border border-outline-variant" />
              Not yet arrived — click node for QR
            </div>
          </div>
        </div>
      </div>

      {/* ── QR Code Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {qrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setQrModal(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <UserAvatar user={qrModal} size={56} />
              </div>
              <h3 className="font-headline-md text-on-surface text-lg font-bold mb-1">{qrModal.name || 'Unknown'}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{qrModal.usn}</p>

              {qrModal.scanToken ? (
                <>
                  <img
                    src={getQrUrl(`${window.location.origin}/api/scan/${qrModal.scanToken}`)}
                    alt="QR Code"
                    className="w-52 h-52 mx-auto rounded-lg mb-3"
                  />
                  <p className="text-xs text-on-surface-variant">Student scans this at the entrance</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${qrModal.arrivedAt ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {qrModal.arrivedAt ? `✓ Arrived at ${new Date(qrModal.arrivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Not yet arrived'}
                    </span>
                    {!qrModal.arrivedAt && (
                      <button 
                        onClick={() => manualCheckIn(qrModal.scanToken)}
                        className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-full font-medium transition-colors"
                      >
                        Manual Check-in
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">No scan token — re-run import script</p>
              )}

              <button onClick={() => setQrModal(null)} className="mt-5 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full Screen 5-Second Celebration Overlay ─────────────────────── */}
      <AnimatePresence>
        {activeCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden pointer-events-none"
          >
            {/* Ambient light flares */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.4 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 4, ease: "easeOut" }}
              className="absolute w-[800px] h-[800px] bg-green-500/20 rounded-full blur-[100px]"
            />
            
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Confetti or particles placeholder using simple CSS/framer */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
                    animate={{
                      y: (Math.random() - 0.5) * 800,
                      x: (Math.random() - 0.5) * 800,
                      opacity: 0,
                      scale: Math.random() * 2 + 1,
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 2.5 + Math.random() * 2, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-400 rounded-sm"
                    style={{ backgroundColor: ['#4ade80', '#3b82f6', '#facc15', '#f472b6'][i % 4] }}
                  />
                ))}
              </div>

              <motion.div 
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.2 }}
                className="w-56 h-56 rounded-full border-4 border-green-400 shadow-[0_0_80px_rgba(74,222,128,0.5)] overflow-hidden bg-white/10 mb-8 z-10 flex items-center justify-center"
              >
                <UserAvatar user={activeCelebration} size={224} />
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-4 drop-shadow-2xl z-10"
              >
                {activeCelebration.name || activeCelebration.usn}
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-2xl text-green-400 font-medium tracking-widest uppercase z-10"
              >
                Has Arrived
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
