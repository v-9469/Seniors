import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminWordCloud() {
  const [wordsList, setWordsList] = useState([]);
  const apiUrl = '';

  // Fetch initial words
  useEffect(() => {
    fetch(`${apiUrl}/api/words`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWordsList(data);
        }
      })
      .catch(console.error);
  }, []);

  // Listen for realtime words via SSE
  useEffect(() => {
    const eventSource = new EventSource(`${apiUrl}/api/attendance/stream`, { withCredentials: true });
    
    eventSource.onmessage = (e) => {
      if (e.data === ': ping') return;
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'word') {
          setWordsList(prev => [payload, ...prev]);
        }
      } catch (err) {}
    };

    return () => eventSource.close();
  }, []);

  // Calculate frequencies
  const cloudData = useMemo(() => {
    const tally = {};
    wordsList.forEach(w => {
      if (!w.text) return;
      const clean = w.text.toLowerCase().trim();
      if (!tally[clean]) {
        tally[clean] = { text: w.text, count: 0, firstId: w.id || w._id };
      }
      tally[clean].count += 1;
    });

    const arr = Object.values(tally);
    if (arr.length === 0) return [];

    const maxCount = Math.max(...arr.map(a => a.count));
    const minCount = Math.min(...arr.map(a => a.count));

    // Assign styles based on frequency
    return arr.map(item => {
      // Scale from 0 to 1
      const scale = maxCount > minCount ? (item.count - minCount) / (maxCount - minCount) : 0.5;
      
      // Font size from 1.5rem to 5.5rem
      const fontSize = 1.5 + (scale * 4);

      // Pick a color deterministically based on string length to avoid jitter on re-renders
      const colors = ['text-primary', 'text-secondary', 'text-tertiary', 'text-on-background', 'text-indigo-500', 'text-rose-500', 'text-emerald-500', 'text-amber-500'];
      const colorIndex = (item.text.length + item.count) % colors.length;
      
      return {
        ...item,
        fontSize,
        colorClass: colors[colorIndex]
      };
    }).sort((a, b) => b.count - a.count); // Sort by frequency so bigger words are somewhat centered if we use flex wrap
  }, [wordsList]);

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center relative overflow-hidden p-8 bg-background">
      
      {/* Background blobs for aesthetics */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {cloudData.length === 0 ? (
        <div className="text-center z-10">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">cloud_off</span>
          <h2 className="font-headline-md text-on-surface-variant">The Cloud is Empty</h2>
          <p className="font-body-sm text-on-surface-variant mt-2 max-w-sm">
            Wait for students to submit their memories in the Word Cloud phase.
          </p>
        </div>
      ) : (
        <motion.div 
          layout
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 w-full max-w-5xl z-10"
        >
          <AnimatePresence>
            {cloudData.map(word => (
              <motion.div
                layout
                key={word.firstId}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                className={`font-headline font-bold drop-shadow-sm ${word.colorClass} transition-colors`}
                style={{ fontSize: `${word.fontSize}rem`, lineHeight: 1.1 }}
                title={`${word.text} (${word.count} submissions)`}
              >
                {word.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Floating live badge */}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-surface/80 backdrop-blur border border-outline-variant/50 px-3 py-1.5 rounded-full shadow-sm z-20">
        <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
        <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">Live Cloud</span>
        <span className="ml-2 bg-surface-container-high text-on-surface text-[10px] px-2 py-0.5 rounded-full font-mono">
          {wordsList.length} total
        </span>
      </div>
    </div>
  );
}
