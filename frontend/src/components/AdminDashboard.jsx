import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportMessagesPDF, exportAllMessagesPDF } from '../utils/exportPDF';

const STAMPS = {
  local_florist: '🌸',
  favorite: '❤️',
  stars: '⭐',
  flight_takeoff: '✈️',
  cake: '🎂',
  auto_stories: '📖',
};

export default function AdminDashboard({ phase, setPhase }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [togglingMsg, setTogglingMsg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 });
  const [studentsWithMessages, setStudentsWithMessages] = useState(new Set());

  // Create USN to name mapping for displaying sender names
  const usnToName = students.reduce((acc, s) => ({ ...acc, [s.usn]: s.name }), {});

  // Filter out anonymous messages
  const visibleMessages = messages.filter(msg => !msg.isAnonymous);

  const apiUrl = '';

  useEffect(() => {
    setLoadingStudents(true);
    fetch(`${apiUrl}/api/seniors`)
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/api/admin/students-with-messages`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setStudentsWithMessages(new Set(data.map(s => s._id.toString())));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedStudent) { setMessages([]); return; }
    setLoadingMessages(true);
    fetch(`${apiUrl}/api/admin/messages/${selectedStudent._id}`, { credentials: 'include' })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('usn');
          window.location.href = '/admin-login';
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingMessages(false));
  }, [selectedStudent]);

  const pickRandom = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/students-with-messages?visible=true`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const studentsWithMsg = await res.json();
      if (!Array.isArray(studentsWithMsg) || studentsWithMsg.length === 0) {
        alert('No students have received visible messages yet.');
        return;
      }
      const rand = studentsWithMsg[Math.floor(Math.random() * studentsWithMsg.length)];
      setSelectedStudent(rand);
      // Only close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch {
      alert('Failed to fetch students. Please try again.');
    }
  };

  const handleLogout = () => {
    fetch(`${apiUrl}/api/logout`, { method: 'POST', credentials: 'include' }).finally(() => {
      localStorage.removeItem('usn');
      window.location.href = '/admin-login';
    });
  };

  const handleExportPDF = () => {
    if (!selectedStudent || visibleMessages.length === 0) return;
    setIsExporting(true);
    // Small timeout so the button state renders before jsPDF blocks the thread
    setTimeout(() => {
      try {
        exportMessagesPDF(selectedStudent, visibleMessages, students);
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  const handleExportAll = async () => {
    if (isExportingAll || students.length === 0) return;
    setIsExportingAll(true);
    setExportProgress({ done: 0, total: 0 });
    try {
      const res = await fetch(`${apiUrl}/api/admin/messages/all`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const allMessages = await res.json();
      const total = await exportAllMessagesPDF(
        students,
        allMessages,
        (done, total) => setExportProgress({ done, total })
      );
      if (total === 0) alert('No students have received any messages yet.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingAll(false);
      setExportProgress({ done: 0, total: 0 });
    }
  };

  const changePhase = async (newPhase) => {
    setTogglingMsg(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/settings/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phase: newPhase })
      });
      if (res.ok) {
        const data = await res.json();
        setPhase(data.phase);
      }
    } catch {}
    finally { setTogglingMsg(false); }
  };

  const filtered = students.filter(s => {
    const q = searchTerm.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || s.usn.toLowerCase().includes(q);
  });

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">


      {/* ── Top Bar ── */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="md:hidden p-1.5 rounded-lg hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error">shield_person</span>
              <h1 className="font-headline-md text-on-surface">Admin Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Visible Dashboard button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('/presentation', '_blank')}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-full text-sm font-medium shadow hover:bg-indigo-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">cast</span>
              <span className="hidden sm:inline text-xs">Visible Dashboard</span>
            </motion.button>
            {/* Download All PDFs */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportAll}
              disabled={isExportingAll || students.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 ${
                isExportingAll
                  ? 'bg-surface-container text-on-surface-variant border border-outline-variant'
                  : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isExportingAll ? 'progress_activity' : 'download'}
              </span>
              <span className="hidden sm:inline text-xs">
                {isExportingAll
                  ? exportProgress.total > 0
                    ? `${exportProgress.done}/${exportProgress.total}…`
                    : 'Loading…'
                  : 'All PDFs'
                }
              </span>
            </motion.button>

            {/* Phase Selection */}
            <div className="relative">
              <select
                value={phase}
                onChange={(e) => changePhase(e.target.value)}
                disabled={togglingMsg}
                className={`appearance-none outline-none pl-3 pr-8 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 cursor-pointer ${
                  phase === 'messaging' ? 'bg-green-500 text-white hover:bg-green-600' :
                  phase === 'wordcloud' ? 'bg-purple-500 text-white hover:bg-purple-600' :
                  'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant'
                }`}
              >
                <option value="welcome">Phase 1: Welcome</option>
                <option value="wordcloud">Phase 2: Word Cloud</option>
                <option value="jamming">Phase 3: Jamming</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-base pointer-events-none opacity-70">
                arrow_drop_down
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={pickRandom}
              className="hidden sm:flex items-center gap-1.5 bg-tertiary text-on-tertiary px-3 py-2 rounded-full text-sm font-medium shadow hover:bg-tertiary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-base">casino</span>
              <span className="hidden sm:inline text-xs">Random</span>
            </motion.button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-error hover:bg-error/10 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:inline text-xs">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <AnimatePresence initial={false}>
          {(sidebarOpen) && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-72 flex-shrink-0 bg-surface border-r border-outline-variant/20 flex flex-col absolute md:relative z-30 h-full md:h-auto shadow-xl md:shadow-none"
            >
              <div className="p-4 border-b border-outline-variant/20">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg pointer-events-none">search</span>
                  <input
                    type="text"
                    placeholder="Search student…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input-field pl-10 py-2.5"
                  />
                </div>
                <button
                  onClick={pickRandom}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-tertiary/10 text-tertiary px-3 py-2 rounded-lg text-sm font-medium hover:bg-tertiary/20 transition-colors sm:hidden"
                >
                  <span className="material-symbols-outlined text-base">casino</span>
                  Random Pick
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingStudents ? (
                  <div className="p-6 text-center text-on-surface-variant text-sm">Loading students…</div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant text-sm">No results found.</div>
                ) : filtered.map(student => (
                  <button
                    key={student._id}
                    onClick={() => { setSelectedStudent(student); setSidebarOpen(window.innerWidth >= 768); }}
                    className={`w-full text-left px-4 py-3 border-b border-outline-variant/10 transition-colors flex items-center gap-3 ${
                      selectedStudent?._id === student._id
                        ? 'bg-primary text-on-primary'
                        : 'hover:bg-surface-container'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      selectedStudent?._id === student._id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {(student.name || student.usn).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{student.name || 'Unknown'}</p>
                      <p className={`text-xs truncate ${selectedStudent?._id === student._id ? 'text-white/70' : 'text-on-surface-variant'}`}>{student.usn}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-outline-variant/20 text-center">
                <p className="font-body-sm text-xs text-on-surface-variant">{students.length} total members</p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Message Panel ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">inbox</span>
              <h2 className="font-headline-md text-on-surface-variant">Select a student</h2>
              <p className="font-body-sm text-on-surface-variant mt-1 max-w-xs">
                Choose someone from the list or use Random Pick to read their messages.
              </p>
            </div>
          ) : (
            <motion.div
              key={selectedStudent._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20 flex-wrap">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {(selectedStudent.name || selectedStudent.usn).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-headline-md text-on-surface">{selectedStudent.name || 'Unknown'}</h2>
                  <p className="font-body-sm text-on-surface-variant">{selectedStudent.usn}</p>
                </div>
                <span className={`ml-auto font-body-sm text-sm font-medium px-3 py-1 rounded-full ${
                  visibleMessages.length > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {loadingMessages ? '…' : `${visibleMessages.length} message${visibleMessages.length !== 1 ? 's' : ''}`}
                </span>

                {/* PDF Export Button */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportPDF}
                  disabled={isExporting || loadingMessages || messages.length === 0}
                  title={messages.length === 0 ? 'No messages to export' : 'Download PDF'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                    messages.length === 0 || isExporting
                      ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'
                      : 'bg-error text-white hover:bg-error/90 cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isExporting ? 'progress_activity' : 'picture_as_pdf'}
                  </span>
                  <span className="hidden sm:inline">
                    {isExporting ? 'Generating…' : 'Download PDF'}
                  </span>
                </motion.button>
              </div>

              {loadingMessages ? (
                <div className="text-center py-12 text-on-surface-variant">Loading messages…</div>
              ) : visibleMessages.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-outline mb-3">mail</span>
                  <p className="font-body-sm text-on-surface-variant">No messages received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleMessages.map((msg, i) => (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="paper-texture rounded-xl p-5 shadow-sm border border-surface-variant relative"
                    >
                      {/* Stamp emoji */}
                      <span className="absolute top-4 right-4 text-xl opacity-60">
                        {STAMPS[msg.stamp] || '📝'}
                      </span>

                       <p className="font-body-lg text-on-background whitespace-pre-wrap pr-10 leading-relaxed">
                         {msg.content}
                       </p>

                       {msg.imageUrl && (
                         <div className="mt-3 flex justify-center">
                           <img 
                             src={msg.imageUrl} 
                             alt="Attached" 
                             className="max-h-[300px] w-auto rounded-lg border border-outline-variant/30 object-contain"
                           />
                         </div>
                       )}
 
                       <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-between items-center flex-wrap gap-2">
                        <span className="font-label-md text-xs uppercase tracking-widest px-2 py-1 rounded border text-error bg-error/5 border-error/20">
                          From: {usnToName[msg.senderUsn] ? `${usnToName[msg.senderUsn]} (${msg.senderUsn})` : msg.senderUsn}
                        </span>
                        <span className="font-body-sm text-xs text-on-surface-variant">
                          {new Date(msg.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium', timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
