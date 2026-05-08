import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import AttendanceDashboard from './AttendanceDashboard';
import AdminWordCloud from './AdminWordCloud';

export default function VisibleDashboard({ phase, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sentMessagesQueue, setSentMessagesQueue] = useState([]);
  const [currentMail, setCurrentMail] = useState(null);

  // Queue consumer
  useEffect(() => {
    if (!currentMail && sentMessagesQueue.length > 0) {
      setCurrentMail(sentMessagesQueue[0]);
      setSentMessagesQueue(prev => prev.slice(1));
    }
  }, [currentMail, sentMessagesQueue]);

  useEffect(() => {
    if (currentMail) {
      const timer = setTimeout(() => {
        setCurrentMail(null);
      }, 4000); // stay for 4s
      return () => clearTimeout(timer);
    }
  }, [currentMail]);

  // Listen to SSE
  useEffect(() => {
    const apiUrl = '';
    const eventSource = new EventSource(`${apiUrl}/api/attendance/stream`, { withCredentials: true });
    
    eventSource.onmessage = (e) => {
      if (e.data === ': ping') return;
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'message_sent') {
          setSentMessagesQueue(prev => [...prev, payload.recipientName]);
        }
      } catch (err) {}
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  const FullscreenBtn = () => (
    <button 
      onClick={toggleFullscreen}
      className={`fixed bottom-6 right-6 z-[999] p-4 bg-surface-variant/80 hover:bg-surface-variant backdrop-blur-md rounded-full shadow-lg transition-all text-on-surface-variant hover:text-on-surface flex items-center justify-center ${isFullscreen ? 'opacity-10 hover:opacity-100' : 'opacity-100 hover:scale-105'}`}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      <span className="material-symbols-outlined text-2xl">
        {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
      </span>
    </button>
  );

  let content = null;
  
  if (phase === 'welcome') {
    content = <AttendanceDashboard onClose={onClose} />;
  } else if (phase === 'wordcloud') {
    content = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background flex flex-col w-full"
      >
        <div className="flex-1 w-full h-full relative">
          <AdminWordCloud />
        </div>
      </motion.div>
    );
  } else {
    // phase === 'messaging'
    content = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <span className="material-symbols-outlined text-primary mb-6" style={{ fontSize: '80px' }}>
            mark_email_unread
          </span>
          <h1 className="font-headline-lg text-5xl md:text-7xl font-bold text-on-surface mb-6 tracking-tight">
            Farewell Messaging is Open!
          </h1>
          <p className="font-body-lg text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Check your phones. You can now write anonymous messages to your friends. <br />
            Make them memorable.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <FullscreenBtn />
      {content}

      {/* Mail Animation Overlay */}
      <AnimatePresence>
        {currentMail && (
          <motion.div
            key={currentMail}
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-surface p-4 pr-8 rounded-2xl shadow-2xl border border-outline-variant/30 flex items-center gap-5 z-50 pointer-events-none"
          >
            <motion.div 
              initial={{ rotate: -20, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary text-3xl">mark_email_read</span>
            </motion.div>
            <div>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Incoming Memory For</p>
              <p className="font-headline-md text-2xl font-bold text-on-surface leading-none">
                {currentMail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
